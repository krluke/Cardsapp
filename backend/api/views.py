import os
import random
import smtplib
import math
import json
import logging
from email.mime.text import MIMEText

from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.core.files.storage import FileSystemStorage
from werkzeug.security import generate_password_hash, check_password_hash
import bleach
from bleach.css_sanitizer import CSSSanitizer

from api.rate_limiter import rate_limiter
from api.csrf import csrf_protector

logger = logging.getLogger(__name__)


def get_db():
    return connection


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def dictfetchone(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def sanitize_html(html):
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
    return bleach.clean(
        html,
        tags=allowed_tags,
        attributes=allowed_attrs,
        css_sanitizer=css_sanitizer,
        strip=True,
    )


def get_user_email_from_login_id(login_id):
    """Resolve login_id (email or username) to actual email."""
    if not login_id:
        return login_id
    with connection.cursor() as c:
        c.execute(
            "SELECT email FROM users WHERE email = %s OR username = %s",
            (login_id, login_id),
        )
        row = dictfetchone(c)
    return row["email"] if row else login_id


# ==========================================
# AUTH ENDPOINTS
# ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

    if rate_limiter.is_ip_blocked(client_ip):
        return JsonResponse(
            {
                "message": "一時的にブロックされました。しばらくしてから再試行してください。"
            },
            status=429,
        )

    allowed, _ = rate_limiter.check_ip_rate_limit(client_ip, max_requests=30, window=60)
    if not allowed:
        return JsonResponse(
            {"message": "リクエストが多すぎます。しばらくしてから再試行してください。"},
            status=429,
        )

    import json as json_mod

    data = json_mod.loads(request.body)
    login_id = data.get("id")
    raw_password = data.get("password")

    with connection.cursor() as c:
        c.execute(
            "SELECT * FROM users WHERE email = %s OR username = %s",
            (login_id, login_id),
        )
        user = dictfetchone(c)

    if user and check_password_hash(user["password"], raw_password):
        rate_limiter.record_login_success(client_ip, is_ip=True)
        rate_limiter.record_login_success(login_id, is_ip=False)
        csrf_token = csrf_protector.generate_token(user["email"])
        return JsonResponse(
            {
                "message": "ログイン成功！",
                "username": user["username"],
                "email": user["email"],
                "csrfToken": csrf_token,
            }
        )

    block_duration = rate_limiter.record_login_failure(client_ip, is_ip=True)
    if login_id:
        rate_limiter.record_login_failure(login_id, is_ip=False)

    if block_duration > 0:
        return JsonResponse(
            {
                "message": f"ログイン試行回数が多すぎます。{int(block_duration)}秒後に再試行してください。"
            },
            status=429,
        )

    return JsonResponse({"message": "IDまたはパスワードが間違っています"}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
def signup(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    email = data.get("email")
    username = data.get("username")
    raw_password = data.get("password")

    allowed, retry_after = rate_limiter.check_email_rate_limit(
        email, max_requests=5, window=300
    )
    if not allowed:
        return JsonResponse(
            {
                "message": f"リクエストが多すぎます。{retry_after}秒後に再試行してください。"
            },
            status=429,
        )

    with connection.cursor() as c:
        c.execute("SELECT code FROM verification_codes WHERE email = %s", (email,))
        row = dictfetchone(c)
        if not row or row["code"] != data.get("code"):
            return JsonResponse({"message": "コードが違います"}, status=400)

        c.execute("SELECT email FROM users WHERE username = %s", (username,))
        if dictfetchone(c):
            return JsonResponse(
                {"message": "このユーザー名は既に使われています"}, status=400
            )

        hashed_password = generate_password_hash(raw_password)

        try:
            c.execute(
                "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
                (email, username, hashed_password),
            )
            return JsonResponse({"message": "アカウント作成成功！"})
        except Exception:
            return JsonResponse(
                {"message": "このメールアドレスは既に登録されています"}, status=400
            )


@csrf_exempt
@require_http_methods(["POST"])
def send_code(request):
    import json as json_mod

    client_ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

    if rate_limiter.is_ip_blocked(client_ip):
        return JsonResponse(
            {
                "message": "一時的にブロックされました。しばらくしてから再試行してください。"
            },
            status=429,
        )

    allowed, _ = rate_limiter.check_ip_rate_limit(client_ip, max_requests=10, window=60)
    if not allowed:
        return JsonResponse(
            {"message": "リクエストが多すぎます。しばらくしてから再試行してください。"},
            status=429,
        )

    data = json_mod.loads(request.body)
    email = data.get("email")

    allowed, retry_after = rate_limiter.check_email_rate_limit(
        email, max_requests=3, window=300
    )
    if not allowed:
        return JsonResponse(
            {
                "message": f"このメールアドレスからのリクエストが多すぎます。{retry_after}秒後に再試行してください。"
            },
            status=429,
        )

    code = str(random.randint(100000, 999999))

    with connection.cursor() as c:
        c.execute(
            "REPLACE INTO verification_codes (email, code) VALUES (%s, %s)",
            (email, code),
        )

    try:
        msg = MIMEText(f"あなたの確認コードは {code} です。")
        msg["Subject"] = "アカウント作成コード"
        msg["From"] = settings.GMAIL_USER
        msg["To"] = email
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(settings.GMAIL_USER, settings.GMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return JsonResponse({"message": "メールを送信しました"})
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return JsonResponse({"message": "メール送信に失敗しました"}, status=500)


# ==========================================
# USER ENDPOINTS
# ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def change_password(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    user_email = data.get("userEmail")
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not user_email or not current_password or not new_password:
        return JsonResponse({"error": "入力情報が不足しています"}, status=400)

    try:
        with connection.cursor() as c:
            c.execute("SELECT password FROM users WHERE email = %s", (user_email,))
            user = dictfetchone(c)

            if not user or not check_password_hash(user["password"], current_password):
                return JsonResponse(
                    {"error": "現在のパスワードが間違っています"}, status=401
                )

            hashed_password = generate_password_hash(new_password)
            c.execute(
                "UPDATE users SET password = %s WHERE email = %s",
                (hashed_password, user_email),
            )

        return JsonResponse({"message": "パスワードを更新しました"})
    except Exception as e:
        logger.error(f"Password change error: {e}")
        return JsonResponse({"error": "サーバーエラーが発生しました"}, status=500)


@xframe_options_exempt
def get_user_stats(request):
    user_email = request.GET.get("email")
    auth_email = request.GET.get("authEmail", "")

    if not user_email:
        return JsonResponse({"error": "Email missing"}, status=400)

    if user_email != auth_email:
        return JsonResponse(
            {"error": "この情報にアクセスする権限がありません"}, status=403
        )

    try:
        with connection.cursor() as c:
            c.execute("SELECT username FROM users WHERE email = %s", (user_email,))
            user_row = dictfetchone(c)
            username = (
                user_row["username"]
                if user_row and user_row["username"]
                else user_email.split("@")[0]
            )

            c.execute(
                "SELECT COUNT(*) as count FROM folders WHERE user_email = %s",
                (user_email,),
            )
            folders_count = dictfetchone(c)["count"]

            c.execute(
                "SELECT COUNT(*) as count FROM folder_likes WHERE folder_id IN (SELECT id FROM folders WHERE user_email = %s)",
                (user_email,),
            )
            likes_count = dictfetchone(c)["count"]

            c.execute(
                "SELECT COUNT(*) as count FROM folder_favorites WHERE folder_id IN (SELECT id FROM folders WHERE user_email = %s)",
                (user_email,),
            )
            favorites_count = dictfetchone(c)["count"]

        return JsonResponse(
            {
                "username": username,
                "email": user_email,
                "foldersCount": folders_count,
                "likesCount": likes_count,
                "favoritesCount": favorites_count,
            }
        )
    except Exception as e:
        logger.error(f"User stats error: {e}")
    return JsonResponse({"error": "ユーザー統計の取得に失敗しました"}, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT"])  # noqa: E501
def user_profile(request):
    """GET returns profile info; PUT updates username.
    Expected query params for GET: email, authEmail (both must match).
    Expected JSON body for PUT: {"userEmail": ..., "username": ...}
    """
    if request.method == "GET":
        user_email = request.GET.get("email")
        auth_email = request.GET.get("authEmail", "")
        if not user_email:
            return JsonResponse({"error": "Email missing"}, status=400)
        if user_email != auth_email:
            return JsonResponse({"error": "Unauthorized"}, status=403)
        try:
            with connection.cursor() as c:
                c.execute(
                    "SELECT email, username FROM users WHERE email = %s", (user_email,)
                )
                row = dictfetchone(c)
                if not row:
                    return JsonResponse({"error": "User not found"}, status=404)
                return JsonResponse(
                    {"email": row["email"], "username": row["username"]}
                )
        except Exception as e:
            logger.error(f"user_profile GET error: {e}")
            return JsonResponse({"error": "Failed to fetch profile"}, status=500)
    else:  # PUT
        import json as json_mod

        data = json_mod.loads(request.body)
        user_email = data.get("userEmail")
        new_username = data.get("username")
        if not user_email or not new_username:
            return JsonResponse({"error": "Missing parameters"}, status=400)
        try:
            with connection.cursor() as c:
                c.execute(
                    "UPDATE users SET username = %s WHERE email = %s",
                    (new_username, user_email),
                )
            return JsonResponse({"message": "Profile updated"})
        except Exception as e:
            logger.error(f"user_profile PUT error: {e}")
            return JsonResponse({"error": "Failed to update profile"}, status=500)

    # ==========================================
    # FOLDER ENDPOINTS
    # ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def create_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    user_email = data.get("userEmail")
    raw_title = data.get("title", "無題のフォルダ")
    title = bleach.clean(raw_title, tags=[], strip=True)

    if not user_email:
        return JsonResponse({"message": "ユーザー情報が必要です"}, status=400)

    with connection.cursor() as c:
        c.execute(
            "SELECT id FROM folders WHERE user_email = %s AND title = %s",
            (user_email, title),
        )
        if dictfetchone(c):
            return JsonResponse(
                {"message": "同じ名前のフォルダが既に存在します"}, status=400
            )

        c.execute(
            "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
            (user_email, title, "private"),
        )
        folder_id = c.lastrowid

    return JsonResponse({"message": "フォルダ作成完了", "folderId": folder_id})


@xframe_options_exempt
def list_folders(request):
    user_email = request.GET.get("userEmail")
    if not user_email:
        return JsonResponse({"message": "ユーザー情報が必要です"}, status=400)

    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT id, title, visibility, likes FROM folders WHERE user_email = %s",
                (user_email,),
            )
            folders = dictfetchall(c)
        return JsonResponse(folders, safe=False)
    except Exception as e:
        logger.error(f"list_folders error: {e}")
        return JsonResponse({"message": "フォルダ一覧の取得に失敗しました"}, status=500)


@xframe_options_exempt
def get_folders(request):
    try:
        tab = request.GET.get("tab", "my-folders")
        search_query = request.GET.get("q", "")
        page = int(request.GET.get("page", 1))
        login_id = request.GET.get("userEmail", "")

        limit = 12
        offset = (page - 1) * limit

        user_email = get_user_email_from_login_id(login_id)

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
        with connection.cursor() as c:
            c.execute(count_sql, tuple(params))
            total_count = dictfetchone(c)["count"]
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        order_by = "f.id DESC"
        if tab == "global-folders" and not search_query:
            order_by = "is_favorite DESC, f.id DESC"

        if tab == "my-folders":
            fetch_sql = f"""
                SELECT f.id, f.title, f.visibility, f.likes,
                       (SELECT COUNT(*) FROM folder_likes WHERE folder_id = f.id) as like_count,
                       (SELECT COUNT(*) FROM cards WHERE folder_id = f.id) as card_count
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
                       (SELECT COUNT(*) FROM cards WHERE folder_id = f.id) as card_count,
                       EXISTS(SELECT 1 FROM folder_likes WHERE folder_id = f.id AND user_email = %s) as is_liked,
                       EXISTS(SELECT 1 FROM folder_favorites WHERE folder_id = f.id AND user_email = %s) as is_favorite
                FROM folders f
                LEFT JOIN users u ON f.user_email = u.email OR f.user_email = u.username
                {base_where}
                ORDER BY {order_by}
                LIMIT %s OFFSET %s
            """
            final_params = [user_email, user_email] + params + [limit, offset]

        with connection.cursor() as c:
            c.execute(fetch_sql, tuple(final_params))
            folders = dictfetchall(c)

        return JsonResponse(
            {
                "folders": folders,
                "totalPages": total_pages,
                "currentPage": page,
            }
        )
    except Exception as e:
        logger.error(f"get_folders error: {e}")
        return JsonResponse({"message": "フォルダ一覧の取得に失敗しました"}, status=500)


@xframe_options_exempt
def list_global_folders(request):
    try:
        with connection.cursor() as c:
            query = """
                SELECT f.id, f.title, f.visibility,
                       COALESCE(u.username, f.user_email) AS username
                FROM folders f
                LEFT JOIN users u ON f.user_email = u.email OR f.user_email = u.username
                WHERE f.visibility = 'public'
                ORDER BY f.id DESC
            """
            c.execute(query)
            folders = dictfetchall(c)
        return JsonResponse(folders, safe=False)
    except Exception as e:
        logger.error(f"Global folders fetch error: {e}")
        return JsonResponse({"message": "公開データの取得に失敗しました"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def update_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    login_id = data.get("userEmail")
    folder_id = data.get("folderId")
    raw_title = data.get("title")
    title = bleach.clean(raw_title, tags=[], strip=True) if raw_title else None

    if not login_id or not folder_id:
        return JsonResponse({"message": "ユーザー情報が必要です"}, status=400)

    user_email = get_user_email_from_login_id(login_id)

    with connection.cursor() as c:
        c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
        folder = dictfetchone(c)
        if not folder or folder["user_email"] != user_email:
            return JsonResponse(
                {"message": "このフォルダへのアクセス権限がありません"}, status=403
            )

        if title:
            c.execute(
                "SELECT id FROM folders WHERE user_email = %s AND title = %s AND id != %s",
                (user_email, title, folder_id),
            )
            if dictfetchone(c):
                return JsonResponse(
                    {"message": "同じ名前のフォルダが既に存在します"}, status=400
                )

        c.execute(
            "UPDATE folders SET title = %s, visibility = %s WHERE id = %s",
            (title, data.get("visibility"), folder_id),
        )

    return JsonResponse({"message": "Success"})


@csrf_exempt
@require_http_methods(["POST"])
def delete_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    login_id = data.get("userEmail")
    folder_id = data.get("folderId")

    if not login_id or not folder_id:
        return JsonResponse({"message": "ユーザー情報が必要です"}, status=400)

    user_email = get_user_email_from_login_id(login_id)

    with connection.cursor() as c:
        c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
        folder = dictfetchone(c)
        if not folder or folder["user_email"] != user_email:
            return JsonResponse(
                {"message": "このフォルダへのアクセス権限がありません"}, status=403
            )

        c.execute("DELETE FROM folders WHERE id = %s", (folder_id,))

    return JsonResponse({"message": "Deleted"})


@csrf_exempt
@require_http_methods(["POST"])
def toggle_action(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    user_email = data.get("userEmail")
    folder_id = data.get("folderId")
    action = data.get("action")

    if not user_email or not folder_id:
        return JsonResponse({"message": "Invalid request"}, status=400)

    table = "folder_likes" if action == "like" else "folder_favorites"

    with connection.cursor() as c:
        c.execute(
            f"SELECT 1 FROM {table} WHERE user_email = %s AND folder_id = %s",
            (user_email, folder_id),
        )
        if dictfetchone(c):
            c.execute(
                f"DELETE FROM {table} WHERE user_email = %s AND folder_id = %s",
                (user_email, folder_id),
            )
        else:
            c.execute(
                f"INSERT INTO {table} (user_email, folder_id) VALUES (%s, %s)",
                (user_email, folder_id),
            )

    return JsonResponse({"message": "Success"})


# ==========================================
# SEARCH ENDPOINTS
# ==========================================


@xframe_options_exempt
def global_search(request):
    query = request.GET.get("q", "")
    user_email = request.GET.get("userEmail", "")
    if not query:
        return JsonResponse({"results": []})

    user_email = get_user_email_from_login_id(user_email)
    search_term = f"%{query}%"

    try:
        with connection.cursor() as c:
            # Search in public folders or folders owned by the user
            c.execute(
                """
                SELECT f.title as folder_title, c.id as card_id, c.front_content, c.back_content
                FROM cards c
                JOIN folders f ON c.folder_id = f.id
                WHERE (f.visibility = 'public' OR f.user_email = %s)
                AND (c.front_content LIKE %s OR c.back_content LIKE %s OR f.title LIKE %s)
                LIMIT 50
                """,
                (user_email, search_term, search_term, search_term),
            )
            results = dictfetchall(c)
        return JsonResponse({"results": results}, safe=False)
    except Exception as e:
        logger.error(f"global_search error: {e}")
        return JsonResponse({"error": "Search failed"}, status=500)


# ==========================================
# IMPORT/EXPORT ENDPOINTS
# ==========================================


@csrf_exempt
@require_http_methods(["GET"])
def export_folder(request):
    folder_id = request.GET.get("folderId")
    user_email = request.GET.get("userEmail")
    if not folder_id or not user_email:
        return JsonResponse({"error": "Missing parameters"}, status=400)

    user_email = get_user_email_from_login_id(user_email)

    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT title, visibility FROM folders WHERE id = %s AND user_email = %s",
                (folder_id, user_email),
            )
            folder = dictfetchone(c)
            if not folder:
                return JsonResponse({"error": "Folder not found"}, status=404)

            c.execute(
                "SELECT front_content, back_content, front_bg, back_bg, tags FROM cards WHERE folder_id = %s ORDER BY order_index",
                (folder_id,),
            )
            cards = dictfetchall(c)

        data = {
            "folder_title": folder["title"],
            "visibility": folder["visibility"],
            "cards": cards,
        }
        return JsonResponse(data)
    except Exception as e:
        logger.error(f"export_folder error: {e}")
        return JsonResponse({"error": "Export failed"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def import_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    folder_data = data.get("folderData")
    user_email = data.get("userEmail")

    if not folder_data or not user_email:
        return JsonResponse({"error": "Missing data"}, status=400)

    user_email = get_user_email_from_login_id(user_email)

    try:
        with connection.cursor() as c:
            # Create new folder
            c.execute(
                "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
                (
                    user_email,
                    folder_data["folder_title"],
                    folder_data.get("visibility", "private"),
                ),
            )
            folder_id = c.lastrowid

            # Import cards
            for idx, card in enumerate(folder_data["cards"]):
                c.execute(
                    "INSERT INTO cards (folder_id, order_index, front_content, back_content, front_bg, back_bg, tags) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (
                        folder_id,
                        idx,
                        card["front_content"],
                        card["back_content"],
                        card["front_bg"],
                        card["back_bg"],
                        card.get("tags", ""),
                    ),
                )
            # connection.commit()

        return JsonResponse({"message": "Import successful", "folderId": folder_id})
    except Exception as e:
        logger.error(f"import_folder error: {e}")
        return JsonResponse({"error": "Import failed"}, status=500)


# ==========================================
# STUDY ENDPOINTS
# ==========================================


@xframe_options_exempt
def get_study_cards(request):
    user_email = request.GET.get("userEmail")
    folder_id = request.GET.get("folderId")
    if not user_email or not folder_id:
        return JsonResponse({"error": "Missing parameters"}, status=400)

    user_email = get_user_email_from_login_id(user_email)

    try:
        with connection.cursor() as c:
            c.execute(
                """
                SELECT c.id, c.front_content, c.back_content, c.front_bg, c.back_bg
                FROM cards c
                JOIN folders f ON c.folder_id = f.id
                WHERE f.id = %s AND f.user_email = %s 
                -- Include cards that have never been reviewed (NULL next review) so new cards appear in due mode
                AND (c.srs_next_review IS NULL OR c.srs_next_review <= CURRENT_TIMESTAMP)
                AND (c.front_content IS NOT NULL AND c.front_content != '')
                AND (c.back_content IS NOT NULL AND c.back_content != '')
                ORDER BY c.srs_next_review ASC
                """,
                (folder_id, user_email),
            )
            cards = dictfetchall(c)
        return JsonResponse(cards, safe=False)
    except Exception as e:
        logger.error(f"get_study_cards error: {e}")
        return JsonResponse({"error": "Failed to fetch study cards"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def update_srs(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    card_id = data.get("cardId")
    quality = data.get("quality")  # 0-5
    user_email = data.get("userEmail")

    if card_id is None or quality is None or not user_email:
        return JsonResponse({"error": "Missing parameters"}, status=400)

    user_email = get_user_email_from_login_id(user_email)

    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT srs_interval, srs_ease FROM cards WHERE id = %s", (card_id,)
            )
            row = dictfetchone(c)
            if not row:
                return JsonResponse({"error": "Card not found"}, status=404)

            interval = row["srs_interval"] or 0
            ease = row["srs_ease"] or 2.5

            # SM-2 Algorithm
            if quality >= 3:
                if interval == 0:
                    new_interval = 1
                elif interval == 1:
                    new_interval = 6
                else:
                    new_interval = math.ceil(interval * ease)
                new_ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            else:
                new_interval = 1
                new_ease = ease

            new_ease = max(1.3, new_ease)

            # Calculate next review date
            # Simple: interval is in days
            from datetime import datetime, timedelta

            next_review = datetime.now() + timedelta(days=new_interval)

            c.execute(
                "UPDATE cards SET srs_interval = %s, srs_ease = %s, srs_next_review = %s WHERE id = %s",
                (new_interval, new_ease, next_review, card_id),
            )
            # connection.commit()

        return JsonResponse({"message": "SRS updated"})
    except Exception as e:
        logger.error(f"update_srs error: {e}")
        return JsonResponse({"error": "Failed to update SRS"}, status=500)


# ==========================================
# CARD ENDPOINTS
# ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def upload_image(request):
    if not request.FILES.get("image"):
        return JsonResponse({"error": "No image provided"}, status=400)

    try:
        image_file = request.FILES["image"]
        fs = FileSystemStorage()
        filename = fs.save(f"uploads/{image_file.name}", image_file)
        url = fs.url(filename)
        return JsonResponse({"url": url})
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return JsonResponse({"error": "Upload failed"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def save_cards(request):
    import json as json_mod

    try:
        data = json_mod.loads(request.body)
        folder_id = data.get("folderId")
        cards_data = data.get("cards")
        login_id = data.get("userEmail")

        logger.error(
            f"SAVE DEBUG - folder_id: {folder_id}, login_id: {login_id}, cards_count: {len(cards_data) if cards_data else 0}"
        )

        if not login_id or not folder_id:
            return JsonResponse({"message": "ユーザー情報が必要です"}, status=400)

        user_email = get_user_email_from_login_id(login_id)

        with connection.cursor() as c:
            c.execute("SELECT user_email FROM folders WHERE id = %s", (folder_id,))
            folder = dictfetchone(c)
            if not folder or folder["user_email"] != user_email:
                return JsonResponse(
                    {"message": "このフォルダへのアクセス権限がありません"}, status=403
                )

            c.execute("DELETE FROM cards WHERE folder_id = %s", (folder_id,))

            for idx, card in enumerate(cards_data):
                front_html = sanitize_html(card.get("front", ""))
                back_html = sanitize_html(card.get("back", ""))
                front_bg = card.get("frontBg", "")
                back_bg = card.get("backBg", "")

                c.execute(
                    "INSERT INTO cards (folder_id, order_index, front_content, back_content, front_bg, back_bg, tags, srs_interval, srs_ease, srs_next_review) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        folder_id,
                        idx,
                        front_html,
                        back_html,
                        front_bg,
                        back_bg,
                        card.get("tags", ""),
                        0,  # default srs_interval
                        2.5,  # default srs_ease
                        None,  # srs_next_review NULL
                    ),
                )

            # connection.commit()
            logger.error(
                f"SAVE DEBUG - committed {len(cards_data)} cards for folder {folder_id}"
            )

        return JsonResponse({"message": "セーブ完了！"})
    except Exception as e:
        logger.error(f"Save Error: {e}")
        return JsonResponse({"message": "カードの保存に失敗しました"}, status=500)


@xframe_options_exempt
def load_cards(request, folder_id):
    login_id = request.GET.get("userEmail", "")
    user_email = get_user_email_from_login_id(login_id) if login_id else ""

    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT user_email, visibility FROM folders WHERE id = %s",
                (folder_id,),
            )
            folder = dictfetchone(c)

            if not folder:
                return JsonResponse({"message": "フォルダが見つかりません"}, status=404)

            if folder["visibility"] != "public" and folder["user_email"] != user_email:
                return JsonResponse(
                    {"message": "このフォルダにアクセスする権限がありません"},
                    status=403,
                )

            c.execute(
                "SELECT front_content, back_content, front_bg, back_bg, tags FROM cards WHERE folder_id = %s ORDER BY order_index",
                (folder_id,),
            )
            rows = dictfetchall(c)

        cards = []
        for row in rows:
            front = row.get("front_content", "")
            back = row.get("back_content", "")
            front_bg = row.get("front_bg", "")
            back_bg = row.get("back_bg", "")
            tags = row.get("tags", "")

            if front and front.startswith('"') and front.endswith('"'):
                try:
                    front = json.loads(front)
                except Exception:
                    pass
            if back and back.startswith('"') and back.endswith('"'):
                try:
                    back = json.loads(back)
                except Exception:
                    pass

            cards.append(
                {
                    "front": front,
                    "back": back,
                    "frontBg": front_bg,
                    "backBg": back_bg,
                    "tags": tags,
                }
            )

        return JsonResponse(cards, safe=False)
    except Exception as e:
        logger.error(f"Load Error: {e}")
        return JsonResponse({"message": "データの読み込みに失敗しました"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def delete_card(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    card_id = data.get("cardId")
    login_id = data.get("userEmail")

    if not card_id or not login_id:
        return JsonResponse({"message": "パラメータが指定されていません"}, status=400)

    try:
        user_email = get_user_email_from_login_id(login_id)

        with connection.cursor() as c:
            c.execute(
                """
                DELETE FROM cards
                WHERE id = %s AND folder_id IN (
                    SELECT id FROM folders WHERE user_email = %s
                )

            """,
                (card_id, user_email),
            )
            if c.rowcount == 0:
                return JsonResponse(
                    {"message": "このカードへのアクセス権限がありません"}, status=403
                )

        return JsonResponse({"message": "カードを削除しました"})
    except Exception as e:
        logger.error(f"Delete card error: {e}")
        return JsonResponse({"error": "削除に失敗しました"}, status=500)


# ==========================================
# ADMIN ENDPOINTS
# ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def admin_migrate_passwords(request):
    import json as json_mod

    try:
        data = json_mod.loads(request.body)
    except Exception:
        data = {}
    admin_key = request.headers.get("X-Admin-Key") or data.get("adminKey")
    expected_key = settings.ADMIN_API_KEY

    if not expected_key or admin_key != expected_key:
        return JsonResponse({"error": "管理者権限が必要です"}, status=403)

    with connection.cursor() as c:
        c.execute("SELECT email, password FROM users")
        users = dictfetchall(c)
        for user in users:
            stored_hash = user["password"]
            if stored_hash.startswith(("pbkdf2:sha256", "scrypt:", "bcrypt:")):
                if check_password_hash(stored_hash, stored_hash):
                    new_hash = generate_password_hash(stored_hash)
                    c.execute(
                        "UPDATE users SET password = %s WHERE email = %s",
                        (new_hash, user["email"]),
                    )
                    logger.info(f"Fixed double-hash for: {user['email']}")

    return JsonResponse({"message": "Password migration completed"})


# ==========================================
# EDITOR ROUTE
# ==========================================

from django.shortcuts import render


def editor(request, folder_id):
    return render(request, "editor.html", {"folder_id": folder_id})


def viewer(request, folder_id):
    return render(request, "viewer.html", {"folder_id": folder_id})


@xframe_options_exempt
def load_cards_fixed(request, folder_id):
    login_id = request.GET.get("userEmail", "")
    user_email = get_user_email_from_login_id(login_id) if login_id else ""
    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT c.id, c.front_content as front, c.back_content as back, c.front_bg as frontBg, c.back_bg as backBg FROM cards c WHERE c.folder_id = %s",
                (folder_id,),
            )
            cards = dictfetchall(c)
        for idx, card in enumerate(cards):
            if "id" not in card:
                card["id"] = idx + 1
        return JsonResponse(cards, safe=False)
    except Exception as e:
        logger.error(f"Load cards error: {e}")
        return JsonResponse({"error": "Failed to load cards"}, status=500)
