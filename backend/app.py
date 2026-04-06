import os
import smtplib
import random
import secrets
import hashlib
import hmac
import json
import time
import threading
import pymysql
from email.mime.text import MIMEText
from functools import wraps
from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
import math
from werkzeug.security import generate_password_hash, check_password_hash
import bleach
from bleach.css_sanitizer import CSSSanitizer

# パス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")

app = Flask(
    __name__,
    template_folder=os.path.join(FRONTEND_DIR, "templates"),
    static_folder=os.path.join(FRONTEND_DIR, "static"),
)
CORS(app)

# --- 設定 ---
GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_PASS = os.environ.get("GMAIL_PASS")


# ==========================================
# Rate Limiter (Thread-Safe)
# ==========================================
class RateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._ip_requests = {}
        self._email_requests = {}
        self._login_attempts = {}
        self._blocked_ips = {}

    def _clean_expired(self, store, window):
        now = time.time()
        return {k: v for k, v in store.items() if now - v["last"] < window}

    def is_ip_blocked(self, ip):
        with self._lock:
            if ip in self._blocked_ips:
                if time.time() < self._blocked_ips[ip]["until"]:
                    return self._blocked_ips[ip]["attempts"] >= 3
                del self._blocked_ips[ip]
        return False

    def check_ip_rate_limit(self, ip, max_requests=100, window=60):
        with self._lock:
            now = time.time()
            self._ip_requests = self._clean_expired(self._ip_requests, window)

            if ip not in self._ip_requests:
                self._ip_requests[ip] = {"count": 0, "last": now}

            self._ip_requests[ip]["count"] += 1
            self._ip_requests[ip]["last"] = now

            if self._ip_requests[ip]["count"] > max_requests:
                return False, max_requests - self._ip_requests[ip]["count"]
        return True, 0

    def check_email_rate_limit(self, email, max_requests=3, window=300):
        with self._lock:
            now = time.time()
            self._email_requests = self._clean_expired(self._email_requests, window)

            if email not in self._email_requests:
                self._email_requests[email] = {"count": 0, "last": now}

            self._email_requests[email]["count"] += 1
            self._email_requests[email]["last"] = now

            if self._email_requests[email]["count"] > max_requests:
                retry_after = int(window - (now - self._email_requests[email]["last"]))
                return False, retry_after
        return True, 0

    def record_login_failure(self, identifier, is_ip=True):
        with self._lock:
            key = f"ip:{identifier}" if is_ip else f"email:{identifier}"

            if key not in self._login_attempts:
                self._login_attempts[key] = {"count": 0, "first_failure": time.time()}

            self._login_attempts[key]["count"] += 1

            if self._login_attempts[key]["count"] >= 5:
                block_duration = min(
                    300 * (2 ** (self._login_attempts[key]["count"] - 5)), 3600
                )
                if is_ip:
                    self._blocked_ips[identifier] = {
                        "until": time.time() + block_duration,
                        "attempts": self._login_attempts[key]["count"],
                    }
                return block_duration
        return 0

    def record_login_success(self, identifier, is_ip=True):
        with self._lock:
            key = f"ip:{identifier}" if is_ip else f"email:{identifier}"
            if key in self._login_attempts:
                del self._login_attempts[key]


rate_limiter = RateLimiter()


# ==========================================
# CSRF Protection (Double-Submit Cookie Pattern)
# ==========================================
class CSRFProtector:
    def __init__(self, secret_key=None):
        self._secret_key = secret_key or os.environ.get(
            "SECRET_KEY", secrets.token_hex(32)
        )

    def generate_token(self, user_identifier):
        token = secrets.token_hex(32)
        signature = hmac.new(
            self._secret_key.encode(),
            f"{user_identifier}:{token}".encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{token}:{signature}"

    def validate_token(self, user_identifier, token):
        if not token or ":" not in token:
            return False
        parts = token.rsplit(":", 1)
        if len(parts) != 2:
            return False
        token_part, provided_signature = parts
        expected_signature = hmac.new(
            self._secret_key.encode(),
            f"{user_identifier}:{token_part}".encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_signature, provided_signature)


csrf_protector = CSRFProtector()


def csrf_protected(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return f(*args, **kwargs)

        csrf_token = request.headers.get("X-CSRF-Token") or (
            request.json.get("csrfToken") if request.is_json and request.json else None
        )

        if not csrf_token:
            app.logger.warning(
                f"CSRF validation failed: token missing for {request.path}"
            )
            return jsonify({"error": "CSRF token missing"}), 403

        user_identifier = None
        if request.is_json and request.json:
            user_identifier = request.json.get("userEmail") or request.json.get("id")

        if not user_identifier:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                user_identifier = auth_header[7:]

        if not user_identifier:
            app.logger.warning(
                f"CSRF validation failed: user_identifier missing for {request.path}"
            )
            return jsonify(
                {"error": "User identifier missing for CSRF validation"}
            ), 403

        is_valid = csrf_protector.validate_token(user_identifier, csrf_token)
        if not is_valid:
            app.logger.warning(
                f"CSRF validation failed: invalid token for user={user_identifier}, path={request.path}"
            )
            return jsonify({"error": "Invalid CSRF token"}), 403

        return f(*args, **kwargs)

    return decorated_function


# --- MySQL接続設定 ---
# MySQL接続関数（リトライ機能付き）
def get_db():
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "db"),
        user=os.environ.get("DB_USER", "flashcard_user"),
        password=os.environ.get("DB_PASSWORD", "flashcard_pass"),
        database=os.environ.get("DB_NAME", "flashcards_db"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


# MySQLが起動するまで待つ関数
def wait_for_db():
    max_retries = 30
    for i in range(max_retries):
        try:
            conn = get_db()
            conn.close()
            print("Successfully connected to the database.")
            return
        except Exception as e:
            print(f"Waiting for database... ({i + 1}/{max_retries}) Error: {e}")
            time.sleep(3)
    raise Exception("Could not connect to the database.")


def init_db():
    wait_for_db()
    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS users (email VARCHAR(255) PRIMARY KEY, username VARCHAR(255), password VARCHAR(255))"""
        )
        c.execute(
            """CREATE TABLE IF NOT EXISTS verification_codes (email VARCHAR(255) PRIMARY KEY, code VARCHAR(255))"""
        )

        # likes カラムを追加（いいね機能用）
        c.execute("""CREATE TABLE IF NOT EXISTS folders (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            user_email VARCHAR(255), 
            title VARCHAR(255), 
            visibility VARCHAR(50),
            likes INT DEFAULT 0)""")  # デフォルト0で作成

        c.execute("""CREATE TABLE IF NOT EXISTS cards (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            folder_id INT, 
            order_index INT,
            front_content TEXT,
            back_content TEXT,
            front_bg VARCHAR(50) DEFAULT '',
            back_bg VARCHAR(50) DEFAULT '')""")
        c.execute(
            """CREATE TABLE IF NOT EXISTS folder_likes (user_email VARCHAR(255), folder_id INT, PRIMARY KEY(user_email, folder_id))"""
        )
        c.execute(
            """CREATE TABLE IF NOT EXISTS folder_favorites (user_email VARCHAR(255), folder_id INT, PRIMARY KEY(user_email, folder_id))"""
        )
    conn.commit()
    conn.close()


# ※注意: dbコンテナの起動直後はMySQLの準備ができておらずエラーになることがあるため、
# 実際の運用ではアプリ起動時の init_db() にリトライ処理を入れるか、起動を遅らせる必要があります。
try:
    init_db()
except Exception as e:
    print(f"DB初期化エラー (後で再試行してください): {e}")


# ==========================================
# ページ配信
# ==========================================
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/editor/<int:folder_id>")
def editor(folder_id):
    return render_template("editor.html", folder_id=folder_id)


# ==========================================
# APIエンドポイント (「?」を「%s」に変更)
# ==========================================


@app.route("/api/login", methods=["POST"])
def login():
    client_ip = request.remote_addr or "127.0.0.1"

    if rate_limiter.is_ip_blocked(client_ip):
        return jsonify(
            {
                "message": "一時的にブロックされました。しばらくしてから再試行してください。"
            }
        ), 429

    allowed, _ = rate_limiter.check_ip_rate_limit(client_ip, max_requests=30, window=60)
    if not allowed:
        return jsonify(
            {"message": "リクエストが多すぎます。しばらくしてから再試行してください。"}
        ), 429

    data = request.json
    login_id = data.get("id")
    raw_password = data.get("password")

    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            "SELECT * FROM users WHERE email = %s OR username = %s",
            (login_id, login_id),
        )
        user = c.fetchone()
    conn.close()

    if user and check_password_hash(user["password"], raw_password):
        rate_limiter.record_login_success(client_ip, is_ip=True)
        rate_limiter.record_login_success(login_id, is_ip=False)
        csrf_token = csrf_protector.generate_token(user["email"])
        return jsonify(
            {
                "message": "ログイン成功！",
                "username": user["username"],
                "email": user["email"],
                "csrfToken": csrf_token,
            }
        ), 200

    block_duration = rate_limiter.record_login_failure(client_ip, is_ip=True)
    if login_id:
        rate_limiter.record_login_failure(login_id, is_ip=False)

    if block_duration > 0:
        return jsonify(
            {
                "message": f"ログイン試行回数が多すぎます。{int(block_duration)}秒後に再試行してください。"
            }
        ), 429

    return jsonify({"message": "IDまたはパスワードが間違っています"}), 401


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    username = data.get("username")
    raw_password = data.get("password")

    allowed, retry_after = rate_limiter.check_email_rate_limit(
        email, max_requests=5, window=300
    )
    if not allowed:
        return jsonify(
            {
                "message": f"リクエストが多すぎます。{retry_after}秒後に再試行してください。"
            }
        ), 429

    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT code FROM verification_codes WHERE email = %s", (email,))
    row = c.fetchone()
    if not row or row["code"] != data.get("code"):
        conn.close()
        return jsonify({"message": "コードが違います"}), 400

    c.execute("SELECT email FROM users WHERE username = %s", (username,))
    if c.fetchone():
        conn.close()
        return jsonify({"message": "このユーザー名は既に使われています"}), 400

    hashed_password = generate_password_hash(raw_password)

    try:
        c.execute(
            "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
            (email, username, hashed_password),
        )
        conn.commit()
        return jsonify({"message": "アカウント作成成功！"}), 200
    except pymysql.err.IntegrityError:
        return jsonify({"message": "このメールアドレスは既に登録されています"}), 400
    finally:
        conn.close()


@app.route("/api/send-code", methods=["POST"])
def send_code():
    client_ip = request.remote_addr or "127.0.0.1"

    if rate_limiter.is_ip_blocked(client_ip):
        return jsonify(
            {
                "message": "一時的にブロックされました。しばらくしてから再試行してください。"
            }
        ), 429

    allowed, _ = rate_limiter.check_ip_rate_limit(client_ip, max_requests=10, window=60)
    if not allowed:
        return jsonify(
            {"message": "リクエストが多すぎます。しばらくしてから再試行してください。"}
        ), 429

    data = request.json
    email = data.get("email")

    allowed, retry_after = rate_limiter.check_email_rate_limit(
        email, max_requests=3, window=300
    )
    if not allowed:
        return jsonify(
            {
                "message": f"このメールアドレスからのリクエストが多すぎます。{retry_after}秒後に再試行してください。"
            }
        ), 429

    code = str(random.randint(100000, 999999))

    conn = get_db()
    c = conn.cursor()
    c.execute(
        "REPLACE INTO verification_codes (email, code) VALUES (%s, %s)", (email, code)
    )
    conn.commit()
    conn.close()

    try:
        msg = MIMEText(f"あなたの確認コードは {code} です。")
        msg["Subject"] = "アカウント作成コード"
        msg["From"] = GMAIL_USER
        msg["To"] = email
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(GMAIL_USER, GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return jsonify({"message": "メールを送信しました"}), 200
    except Exception as e:
        return jsonify({"message": "メール送信に失敗しました"}), 500


# --- パスワード変更画面の表示 ---
@app.route("/change-password")
def change_password_page():
    return render_template("change_password.html")


# --- パスワード変更のAPI処理 ---
@app.route("/api/user/change-password", methods=["POST"])
def change_password_api():
    data = request.json
    user_email = data.get("userEmail")
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not user_email or not current_password or not new_password:
        return jsonify({"error": "入力情報が不足しています"}), 400

    try:
        conn = get_db()
        with conn.cursor() as c:
            # 1. ユーザーの現在のパスワードをDBから取得
            c.execute("SELECT password FROM users WHERE email = %s", (user_email,))
            user = c.fetchone()

            # 2. ユーザーが存在するか、現在のパスワードが合っているか確認
            if not user or not check_password_hash(user["password"], current_password):
                conn.close()
                return jsonify({"error": "現在のパスワードが間違っています"}), 401

            # 3. 新しいパスワードをハッシュ化（暗号化）
            hashed_password = generate_password_hash(new_password)

            # 4. DBを新しいパスワードで更新
            c.execute(
                "UPDATE users SET password = %s WHERE email = %s",
                (hashed_password, user_email),
            )
            conn.commit()

        conn.close()
        return jsonify({"message": "パスワードを更新しました"}), 200

    except Exception as e:
        print(f"Password change error: {e}")
        return jsonify({"error": "サーバーエラーが発生しました"}), 500


# --- フォルダ作成 API ---
@app.route("/api/folders/create", methods=["POST"])
def create_folder():
    data = request.json
    user_email = data.get("userEmail")
    raw_title = data.get("title", "無題のフォルダ")
    title = bleach.clean(raw_title, tags=[], strip=True)

    if not user_email:
        return jsonify({"message": "ユーザー情報が必要です"}), 400

    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
            (user_email, title, "private"),
        )
        folder_id = conn.insert_id()
    conn.commit()
    conn.close()
    return jsonify({"message": "フォルダ作成完了", "folderId": folder_id}), 200


# --- カード保存 API (修正版) ---
@app.route("/api/cards/save", methods=["POST"])
@csrf_protected  # もしCSRF保護をつけている場合はそのまま
def save_cards():
    try:
        data = request.json
        folder_id = data.get("folderId")
        cards_data = data.get("cards")
        login_id = data.get("userEmail")

        if not login_id or not folder_id:
            return jsonify({"message": "ユーザー情報が必要です"}), 400

        allowed_tags = [
            "span",
            "div",
            "br",
            "p",
            "b",
            "i",
            "strong",
            "em",
            "u",
            "font",
            "img",
        ]
        allowed_attrs = {
            "*": ["class", "style", "data-name", "data-aspect"],
            "font": ["color", "size", "face"],
            "img": ["src", "alt", "draggable"],
        }

        # ✨ 追加：どのCSS（スタイル）を許可するかを指定する
        css_sanitizer = CSSSanitizer(
            allowed_css_properties=[
                "color",
                "font-size",
                "font-weight",
                "font-style",
                "text-decoration",
                "left",
                "top",
                "width",
                "height",
                "max-width",
                "max-height",
                "background-color",
                "position",
                "z-index",
            ]
        )

        conn = get_db()
        with conn.cursor() as c:
            c.execute(
                "SELECT email FROM users WHERE email = %s OR username = %s",
                (login_id, login_id),
            )
            user_row = c.fetchone()
            user_email = user_row["email"] if user_row else login_id

            c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
            folder = c.fetchone()
            if not folder or folder["user_email"] != user_email:
                conn.close()
                return jsonify(
                    {"message": "このフォルダへのアクセス権限がありません"}
                ), 403

            c.execute("DELETE FROM cards WHERE folder_id = %s", (folder_id,))

            for idx, card in enumerate(cards_data):
                # ✨ 修正： css_sanitizer=css_sanitizer を引数に追加する！
                front_html = bleach.clean(
                    card.get("front", ""),
                    tags=allowed_tags,
                    attributes=allowed_attrs,
                    css_sanitizer=css_sanitizer,
                    strip=True,
                )
                back_html = bleach.clean(
                    card.get("back", ""),
                    tags=allowed_tags,
                    attributes=allowed_attrs,
                    css_sanitizer=css_sanitizer,
                    strip=True,
                )

                front_bg = card.get("frontBg", "")
                back_bg = card.get("backBg", "")

                c.execute(
                    "INSERT INTO cards (folder_id, order_index, front_content, back_content, front_bg, back_bg) VALUES (%s, %s, %s, %s, %s, %s)",
                    (folder_id, idx, front_html, back_html, front_bg, back_bg),
                )

        conn.commit()
        conn.close()
        return jsonify({"message": "セーブ完了！"}), 200
    except Exception as e:
        print(f"Save Error: {e}")  # ターミナルでエラー原因を見やすくするため追加
        return jsonify({"message": "カードの保存に失敗しました"}), 500


# --- ユーザーごとのフォルダ一覧取得 API ---
@app.route("/api/folders/list", methods=["GET"])
def list_folders():
    user_email = request.args.get("userEmail")
    if not user_email:
        return jsonify({"message": "ユーザー情報が必要です"}), 400

    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            "SELECT id, title, visibility, likes FROM folders WHERE user_email = %s",
            (user_email,),
        )
        folders = c.fetchall()
    conn.close()
    return jsonify(folders), 200


# --- 特定フォルダのカード読み込み API ---
# --- カード読み込み API (修正版) ---
@app.route("/api/cards/load/<int:folder_id>", methods=["GET"])
def load_cards(folder_id):
    login_id = request.args.get("userEmail", "")

    try:
        conn = get_db()
        with conn.cursor() as c:
            if login_id:
                c.execute(
                    "SELECT email FROM users WHERE email = %s OR username = %s",
                    (login_id, login_id),
                )
                user_row = c.fetchone()
                user_email = user_row["email"] if user_row else login_id
            else:
                user_email = ""

            c.execute(
                "SELECT user_email, visibility FROM folders WHERE id = %s", (folder_id,)
            )
            folder = c.fetchone()

            if not folder:
                conn.close()
                return jsonify({"message": "フォルダが見つかりません"}), 404

            if folder["visibility"] != "public" and folder["user_email"] != user_email:
                conn.close()
                return jsonify(
                    {"message": "このフォルダにアクセスする権限がありません"}
                ), 403

            c.execute(
                "SELECT front_content, back_content, front_bg, back_bg FROM cards WHERE folder_id = %s ORDER BY order_index",
                (folder_id,),
            )
            rows = c.fetchall()
        conn.close()

        cards = []
        for row in rows:
            front = row.get("front_content", "")
            back = row.get("back_content", "")
            front_bg = row.get("front_bg", "")
            back_bg = row.get("back_bg", "")

            if front and front.startswith('"') and front.endswith('"'):
                try:
                    front = json.loads(front)
                except:
                    pass
            if back and back.startswith('"') and back.endswith('"'):
                try:
                    back = json.loads(back)
                except:
                    pass

            cards.append(
                {"front": front, "back": back, "frontBg": front_bg, "backBg": back_bg}
            )

        return jsonify(cards), 200
    except Exception as e:
        return jsonify({"message": "データの読み込みに失敗しました"}), 500


@app.route("/api/folders/update", methods=["POST"])
def update_folder():
    data = request.json
    login_id = data.get("userEmail")
    folder_id = data.get("folderId")
    raw_title = data.get("title")
    title = bleach.clean(raw_title, tags=[], strip=True) if raw_title else None

    if not login_id or not folder_id:
        return jsonify({"message": "ユーザー情報が必要です"}), 400

    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            "SELECT email FROM users WHERE email = %s OR username = %s",
            (login_id, login_id),
        )
        user_row = c.fetchone()
        user_email = user_row["email"] if user_row else login_id

        c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
        folder = c.fetchone()
        if not folder or folder["user_email"] != user_email:
            conn.close()
            return jsonify({"message": "このフォルダへのアクセス権限がありません"}), 403

        c.execute(
            "UPDATE folders SET title = %s, visibility = %s WHERE id = %s",
            (title, data.get("visibility"), folder_id),
        )
    conn.commit()
    conn.close()
    return jsonify({"message": "Success"}), 200


@app.route("/api/folders/delete", methods=["POST"])
def delete_folder():
    data = request.json
    login_id = data.get("userEmail")
    folder_id = data.get("folderId")

    if not login_id or not folder_id:
        return jsonify({"message": "ユーザー情報が必要です"}), 400

    conn = get_db()
    with conn.cursor() as c:
        c.execute(
            "SELECT email FROM users WHERE email = %s OR username = %s",
            (login_id, login_id),
        )
        user_row = c.fetchone()
        user_email = user_row["email"] if user_row else login_id

        c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
        folder = c.fetchone()
        if not folder or folder["user_email"] != user_email:
            conn.close()
            return jsonify({"message": "このフォルダへのアクセス権限がありません"}), 403

        c.execute("DELETE FROM folders WHERE id = %s", (folder_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"}), 200


# --- 公開フォルダ（Global）一覧取得 API ---
@app.route("/api/folders/global", methods=["GET"])
def list_global_folders():
    try:
        conn = get_db()
        with conn.cursor() as c:
            # INNER JOIN だと email/username のズレでデータが消えるため、LEFT JOIN に変更
            query = """
                SELECT f.id, f.title, f.visibility, 
                       COALESCE(u.username, f.user_email) AS username 
                FROM folders f
                LEFT JOIN users u ON f.user_email = u.email OR f.user_email = u.username
                WHERE f.visibility = 'public'
                ORDER BY f.id DESC
            """
            c.execute(query)
            folders = c.fetchall()
        conn.close()

        return jsonify(folders), 200
    except Exception as e:
        print(f"Global folders fetch error: {e}")
        return jsonify({"message": "公開データの取得に失敗しました"}), 500


# --- 修正版：フォルダー一覧取得 API (MySQL対応版) ---
@app.route("/api/folders", methods=["GET"])
def get_folders():
    try:
        tab = request.args.get("tab", "my-folders")
        search_query = request.args.get("q", "")
        page = int(request.args.get("page", 1))
        login_id = request.args.get("userEmail", "")

        limit = 12
        offset = (page - 1) * limit

        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT email FROM users WHERE email = %s OR username = %s",
                (login_id, login_id),
            )
            user_row = cursor.fetchone()
            user_email = user_row["email"] if user_row else login_id

            base_where = "WHERE 1=1"
            params = []

            if tab == "my-folders":
                base_where += " AND f.user_email = %s"
                params.append(user_email)
            else:
                base_where += " AND f.visibility = 'public'"

            if search_query:
                base_where += " AND f.title LIKE %s"
                params.append(f"%{search_query}%")

            count_sql = f"SELECT COUNT(*) as count FROM folders f {base_where}"
            cursor.execute(count_sql, tuple(params))
            total_count = cursor.fetchone()["count"]
            total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

            order_by = "f.id DESC"
            if tab == "global-folders" and not search_query:
                order_by = "is_favorite DESC, f.id DESC"

            if tab == "my-folders":
                fetch_sql = f"""
                    SELECT f.id, f.title, f.visibility, f.likes,
                           (SELECT COUNT(*) FROM folder_likes WHERE folder_id = f.id) as like_count
                    FROM folders f
                    {base_where} 
                    ORDER BY {order_by} 
                    LIMIT %s OFFSET %s
                """
                final_params = params + [limit, offset]
            else:
                fetch_sql = f"""
                    SELECT f.id, f.title, f.visibility,
                           COALESCE(u.username, f.user_email) AS username,
                           (SELECT COUNT(*) FROM folder_likes WHERE folder_id = f.id) as like_count,
                           EXISTS(SELECT 1 FROM folder_likes WHERE folder_id = f.id AND user_email = %s) as is_liked,
                           EXISTS(SELECT 1 FROM folder_favorites WHERE folder_id = f.id AND user_email = %s) as is_favorite
                    FROM folders f
                    LEFT JOIN users u ON f.user_email = u.email OR f.user_email = u.username
                    {base_where} 
                    ORDER BY {order_by} 
                    LIMIT %s OFFSET %s
                """
                final_params = [user_email, user_email] + params + [limit, offset]

            cursor.execute(fetch_sql, tuple(final_params))
            folders = cursor.fetchall()

        conn.close()

        return jsonify(
            {"folders": folders, "totalPages": total_pages, "currentPage": page}
        ), 200

    except Exception as e:
        app.logger.error(f"get_folders error: {e}")
        return jsonify({"message": "フォルダ一覧の取得に失敗しました"}), 500


# --- ビューワー画面 ---
@app.route("/viewer/<int:folder_id>")
def viewer(folder_id):
    return render_template("viewer.html", folder_id=folder_id)


# --- 2. いいね・お気に入り切り替えAPI (app.pyのどこかに追加) ---
@app.route("/api/folders/toggle-action", methods=["POST"])
def toggle_action():
    data = request.json
    user_email = data.get("userEmail")
    folder_id = data.get("folderId")
    action = data.get("action")  # 'like' または 'favorite'

    if not user_email or not folder_id:
        return jsonify({"message": "Invalid request"}), 400

    table = "folder_likes" if action == "like" else "folder_favorites"

    conn = get_db()
    with conn.cursor() as c:
        # すでに登録されているか確認
        c.execute(
            f"SELECT 1 FROM {table} WHERE user_email = %s AND folder_id = %s",
            (user_email, folder_id),
        )
        if c.fetchone():
            # あれば削除（取り消し）
            c.execute(
                f"DELETE FROM {table} WHERE user_email = %s AND folder_id = %s",
                (user_email, folder_id),
            )
        else:
            # なければ追加
            c.execute(
                f"INSERT INTO {table} (user_email, folder_id) VALUES (%s, %s)",
                (user_email, folder_id),
            )
    conn.commit()
    conn.close()
    return jsonify({"message": "Success"}), 200


# アカウント画面の表示ルート
@app.route("/account")
def account_page():
    return render_template("account.html")


# ユーザー統計情報を取得するAPI
@app.route("/api/user/stats", methods=["GET"])
def get_user_stats():
    user_email = request.args.get("email")
    auth_email = request.args.get("authEmail", "")

    if not user_email:
        return jsonify({"error": "Email missing"}), 400

    if user_email != auth_email:
        return jsonify({"error": "この情報にアクセスする権限がありません"}), 403

    try:
        conn = get_db()
        with conn.cursor() as c:
            c.execute("SELECT username FROM users WHERE email = %s", (user_email,))
            user_row = c.fetchone()
            username = (
                user_row["username"]
                if user_row and user_row["username"]
                else user_email.split("@")[0]
            )

            c.execute(
                """
                SELECT COUNT(*) as count FROM cards 
                WHERE folder_id IN (SELECT id FROM folders WHERE user_email = %s)
            """,
                (user_email,),
            )
            cards_count = c.fetchone()["count"]

            c.execute(
                """
                SELECT COUNT(*) as count FROM folder_likes 
                WHERE folder_id IN (SELECT id FROM folders WHERE user_email = %s)
            """,
                (user_email,),
            )
            likes_count = c.fetchone()["count"]

            c.execute(
                """
                SELECT COUNT(*) as count FROM folder_favorites 
                WHERE folder_id IN (SELECT id FROM folders WHERE user_email = %s)
            """,
                (user_email,),
            )
            favorites_count = c.fetchone()["count"]

        conn.close()
        return jsonify(
            {
                "username": username,
                "email": user_email,
                "cardsCount": cards_count,
                "likesCount": likes_count,
                "favoritesCount": favorites_count,
            }
        ), 200
    except Exception as e:
        return jsonify({"error": "ユーザー統計の取得に失敗しました"}), 500


# --- カードの削除API ---
@app.route("/api/cards/delete", methods=["POST"])
def delete_card():
    data = request.json
    card_id = data.get("cardId")
    login_id = data.get("userEmail")

    if not card_id or not login_id:
        return jsonify({"message": "パラメータが指定されていません"}), 400

    try:
        conn = get_db()
        with conn.cursor() as c:
            c.execute(
                "SELECT email FROM users WHERE email = %s OR username = %s",
                (login_id, login_id),
            )
            user_row = c.fetchone()
            user_email = user_row["email"] if user_row else login_id

            c.execute(
                """
                DELETE c FROM cards c
                JOIN folders f ON c.folder_id = f.id
                WHERE c.id = %s AND f.user_email = %s
            """,
                (card_id, user_email),
            )
            if c.rowcount == 0:
                conn.close()
                return jsonify(
                    {"message": "このカードへのアクセス権限がありません"}
                ), 403
        conn.commit()
        conn.close()
        return jsonify({"message": "カードを削除しました"}), 200
    except Exception as e:
        return jsonify({"error": "削除に失敗しました"}), 500


def migrate_passwords():
    conn = get_db()
    with conn.cursor() as c:
        c.execute("SELECT email, password FROM users")
        users = c.fetchall()

        for user in users:
            old_pass = user["password"]
            if not old_pass.startswith(("pbkdf2:sha256", "scrypt:", "bcrypt:")):
                new_hash = generate_password_hash(old_pass)
                c.execute(
                    "UPDATE users SET password = %s WHERE email = %s",
                    (new_hash, user["email"]),
                )
                print(f"Migrated: {user['email']}")
    conn.commit()
    conn.close()


def fix_double_hashed_passwords():
    conn = get_db()
    with conn.cursor() as c:
        c.execute("SELECT email, password FROM users")
        users = c.fetchall()

        for user in users:
            stored_hash = user["password"]
            if stored_hash.startswith(("pbkdf2:sha256", "scrypt:", "bcrypt:")):
                if check_password_hash(stored_hash, stored_hash):
                    new_hash = generate_password_hash(stored_hash)
                    c.execute(
                        "UPDATE users SET password = %s WHERE email = %s",
                        (new_hash, user["email"]),
                    )
                    print(f"Fixed double-hash for: {user['email']}")
    conn.commit()
    conn.close()


@app.route("/api/admin/migrate-passwords", methods=["POST"])
def admin_migrate_passwords():
    admin_key = (
        request.headers.get("X-Admin-Key") or request.json.get("adminKey")
        if request.is_json
        else None
    )
    expected_key = os.environ.get("ADMIN_API_KEY", "")

    if not expected_key or admin_key != expected_key:
        return jsonify({"error": "管理者権限が必要です"}), 403

    fix_double_hashed_passwords()
    return jsonify({"message": "Password migration completed"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
