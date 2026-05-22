import os
import math
import json
import logging
import traceback

from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
import bleach
from bleach.css_sanitizer import CSSSanitizer

from api.rate_limiter import rate_limiter
from api.csrf import csrf_protector
from api.jwt_utils import (
    generate_jwt_token,
    jwt_required,
    verify_jwt_token,
)

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
            "font-family",
            "text-decoration",
            "text-align",
            "left",
            "top",
            "width",
            "height",
            "max-width",
            "max-height",
            "background-color",
            "position",
            "z-index",
            "transform",
        ]
    )
    return bleach.clean(
        html,
        tags=allowed_tags,
        attributes=allowed_attrs,
        css_sanitizer=css_sanitizer,
        strip=True,
    )


# ==========================================
# CLERK OAUTH ENDPOINT
# ==========================================


@csrf_exempt
@require_http_methods(["POST"])
def clerk_auth(request):
    """Verify Clerk JWT, find/create local user, return internal session."""
    import json as json_mod
    import requests as http_requests

    data = json_mod.loads(request.body)
    clerk_token = data.get("clerk_token")
    if not clerk_token:
        return JsonResponse({"message": "clerk_token is required"}, status=400)

    clerk_issuer = os.getenv("CLERK_ISSUER", "https://dear-boar-32.clerk.accounts.dev")
    jwks_url = f"{clerk_issuer}/.well-known/jwks.json"

    import jwt
    from jwt import PyJWKClient

    jwks_client = PyJWKClient(jwks_url, cache_keys=True, max_cached_keys=1)
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(clerk_token)
    except Exception as e:
        logger.error(f"Clerk JWKS key lookup error: {e}")
        return JsonResponse({"message": "Invalid token"}, status=401)

    try:
        payload = jwt.decode(
            clerk_token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=clerk_issuer,
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        return JsonResponse({"message": "Token expired"}, status=401)
    except Exception as e:
        logger.error(f"Clerk token verification error: {e}")
        return JsonResponse({"message": "Invalid token"}, status=401)

    azp = payload.get("azp")
    expected_azp = os.getenv("CLERK_PUBLISHABLE_KEY", "")
    if expected_azp and azp != expected_azp:
        logger.error(f"Clerk token azp mismatch: got {azp}, expected {expected_azp}")
        return JsonResponse({"message": "Invalid token"}, status=401)

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        return JsonResponse({"message": "Invalid token: missing sub"}, status=401)

    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    if not clerk_secret_key:
        logger.error("CLERK_SECRET_KEY env var is not set")
        return JsonResponse({"message": "Server configuration error"}, status=500)

    try:
        user_resp = http_requests.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {clerk_secret_key}"},
            timeout=10,
        )
        user_resp.raise_for_status()
        clerk_user = user_resp.json()
    except Exception as e:
        logger.error(f"Clerk Backend API error: {e}")
        return JsonResponse({"message": "Failed to fetch user from Clerk"}, status=502)

    email = None
    for addr in clerk_user.get("email_addresses", []):
        if addr.get("id") == clerk_user.get("primary_email_address_id"):
            email = addr.get("email_address")
            break
    if not email and clerk_user.get("email_addresses"):
        email = clerk_user["email_addresses"][0].get("email_address")
    if not email:
        return JsonResponse({"message": "Email not found in Clerk user"}, status=400)

    first_name = clerk_user.get("first_name") or ""
    last_name = clerk_user.get("last_name") or ""
    username = (first_name + " " + last_name).strip() or email.split("@")[0]

    with connection.cursor() as c:
        c.execute("SELECT * FROM users WHERE clerk_user_id = %s", (clerk_user_id,))
        user = dictfetchone(c)

        if user:
            if user["email"] != email:
                old_email = user["email"]
                c.execute("UPDATE users SET email = %s, username = %s WHERE clerk_user_id = %s", (email, username, clerk_user_id))
                c.execute("UPDATE folders SET user_email = %s WHERE user_email = %s", (email, old_email))
                c.execute("UPDATE folder_likes SET user_email = %s WHERE user_email = %s", (email, old_email))
                c.execute("UPDATE folder_favorites SET user_email = %s WHERE user_email = %s", (email, old_email))
                c.execute("SELECT * FROM users WHERE clerk_user_id = %s", (clerk_user_id,))
                user = dictfetchone(c)
        else:
            c.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = dictfetchone(c)

            if user:
                c.execute("UPDATE users SET clerk_user_id = %s, username = %s WHERE email = %s", (clerk_user_id, username, email))
                c.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = dictfetchone(c)

        if not user:
            try:
                c.execute(
                    "INSERT INTO users (email, username, password, clerk_user_id) VALUES (%s, %s, NULL, %s)",
                    (email, username, clerk_user_id),
                )
                c.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = dictfetchone(c)
            except Exception:
                return JsonResponse({"message": "Failed to create user"}, status=500)

    csrf_token = csrf_protector.generate_token(email)
    jwt_user_id = user.get("id") or user.get("email")
    jwt_token = generate_jwt_token(jwt_user_id, email)

    return JsonResponse(
        {
            "message": "ログイン成功！",
            "username": user["username"],
            "email": user["email"],
            "clerkUserId": clerk_user_id,
            "csrfToken": csrf_token,
            "token": jwt_token,
        }
    )


# ==========================================
# USER ENDPOINTS
# ==========================================


@xframe_options_exempt
@jwt_required
def get_user_stats(request):
    user_email = request.user_email

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


# ==========================================
# FOLDER ENDPOINTS
# ==========================================


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def create_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    user_email = request.user_email
    raw_title = data.get("title", "無題のフォルダ")
    title = bleach.clean(raw_title, tags=[], strip=True)

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
@jwt_required
def list_folders(request):
    user_email = request.user_email

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

        user_email = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            payload = verify_jwt_token(token)
            user_email = payload["email"] if payload else None

        if tab == "my-folders" and not user_email:
            return JsonResponse(
                {"data": None, "error": {"code": 401, "message": "Authorization token required"}},
                status=401,
            )

        limit = 12
        offset = (page - 1) * limit

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

        order_by_whitelist = {
            "f.id DESC": "f.id DESC",
            "is_favorite DESC, f.id DESC": "is_favorite DESC, f.id DESC",
        }
        safe_order_by = order_by_whitelist.get(order_by, "f.id DESC")

        if tab == "my-folders":
            fetch_sql = f"""
                SELECT f.id, f.title, f.visibility, f.likes,
                       (SELECT COUNT(*) FROM folder_likes WHERE folder_id = f.id) as like_count,
                       (SELECT COUNT(*) FROM cards WHERE folder_id = f.id) as card_count
                FROM folders f
                {base_where}
                ORDER BY {safe_order_by}
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
                ORDER BY {safe_order_by}
                LIMIT %s OFFSET %s
            """
            final_params = [user_email or '', user_email or ''] + params + [limit, offset]

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
@jwt_required
@require_http_methods(["POST"])
def update_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    folder_id = data.get("folderId")
    raw_title = data.get("title")
    title = bleach.clean(raw_title, tags=[], strip=True) if raw_title else None
    user_email = request.user_email

    if not folder_id:
        return JsonResponse({"message": "フォルダIDが必要です"}, status=400)

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

    connection.commit()
    return JsonResponse({"message": "Success"})


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def delete_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    folder_id = data.get("folderId")
    user_email = request.user_email

    if not folder_id:
        return JsonResponse({"message": "フォルダIDが必要です"}, status=400)

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
@jwt_required
@require_http_methods(["POST"])
def toggle_action(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    folder_id = data.get("folderId")
    action = data.get("action")
    user_email = request.user_email

    if not folder_id or action not in ("like", "favorite"):
        return JsonResponse({"message": "Invalid request"}, status=400)

    if action == "like":
        with connection.cursor() as c:
            c.execute(
                "SELECT 1 FROM folder_likes WHERE user_email = %s AND folder_id = %s",
                (user_email, folder_id),
            )
            if dictfetchone(c):
                c.execute(
                    "DELETE FROM folder_likes WHERE user_email = %s AND folder_id = %s",
                    (user_email, folder_id),
                )
            else:
                c.execute(
                    "INSERT INTO folder_likes (user_email, folder_id) VALUES (%s, %s)",
                    (user_email, folder_id),
                )
    else:
        with connection.cursor() as c:
            c.execute(
                "SELECT 1 FROM folder_favorites WHERE user_email = %s AND folder_id = %s",
                (user_email, folder_id),
            )
            if dictfetchone(c):
                c.execute(
                    "DELETE FROM folder_favorites WHERE user_email = %s AND folder_id = %s",
                    (user_email, folder_id),
                )
            else:
                c.execute(
                    "INSERT INTO folder_favorites (user_email, folder_id) VALUES (%s, %s)",
                    (user_email, folder_id),
                )

    return JsonResponse({"message": "Success"})


# ==========================================
# SEARCH ENDPOINTS
# ==========================================


@xframe_options_exempt
@jwt_required
def global_search(request):
    query = request.GET.get("q", "")
    user_email = request.user_email
    if not query:
        return JsonResponse({"results": []})
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
@jwt_required
@require_http_methods(["GET"])
def export_folder(request):
    folder_id = request.GET.get("folderId")
    user_email = request.user_email
    if not folder_id:
        return JsonResponse({"error": "Missing folderId"}, status=400)

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
@jwt_required
@require_http_methods(["POST"])
def import_folder(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    folder_data = data.get("folderData")
    user_email = request.user_email

    if not folder_data:
        return JsonResponse({"error": "Missing folderData"}, status=400)

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
                front_content = sanitize_html(card.get("front_content", ""))
                back_content = sanitize_html(card.get("back_content", ""))
                front_bg = card.get("front_bg", "")
                back_bg = card.get("back_bg", "")
                tags = card.get("tags", "")
                
            c.execute(
                "INSERT INTO cards (folder_id, order_index, front_content, back_content, front_bg, back_bg, tags, srs_interval, srs_ease, srs_next_review) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    folder_id,
                    idx,
                    front_content,
                    back_content,
                    front_bg,
                    back_bg,
                    tags,
                    0,
                    2.5,
                    None,
                ),
            )

        connection.commit()

        return JsonResponse({"message": "Import successful", "folderId": folder_id})
    except Exception as e:
        logger.error(f"import_folder error: {e}")
        return JsonResponse({"error": "Import failed"}, status=500)


# ==========================================
# STUDY ENDPOINTS
# ==========================================


@xframe_options_exempt
@jwt_required
def get_study_cards(request):
    user_email = request.user_email
    folder_id = request.GET.get("folderId")
    if not folder_id:
        return JsonResponse({"error": "Missing folderId"}, status=400)

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
@jwt_required
@require_http_methods(["POST"])
def update_srs(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    card_id = data.get("cardId")
    quality = data.get("quality")  # 0-5
    user_email = request.user_email

    if card_id is None or quality is None:
        return JsonResponse({"error": "Missing parameters"}, status=400)

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

            from datetime import datetime, timedelta

            next_review = datetime.now() + timedelta(days=new_interval)

            c.execute(
                "UPDATE cards SET srs_interval = %s, srs_ease = %s, srs_next_review = %s WHERE id = %s",
                (new_interval, new_ease, next_review, card_id),
            )

        connection.commit()
        return JsonResponse({"message": "SRS updated"})
    except Exception as e:
        logger.error(f"update_srs error: {e}")
        return JsonResponse({"error": "Failed to update SRS"}, status=500)


# ==========================================
# CARD ENDPOINTS
# ==========================================


@csrf_exempt
@jwt_required
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
@jwt_required
@require_http_methods(["POST"])
def save_cards(request):
    import json as json_mod

    try:
        data = json_mod.loads(request.body)
        folder_id = data.get("folderId")
        cards_data = data.get("cards")
        user_email = request.user_email

        logger.error(
            f"SAVE DEBUG - folder_id: {folder_id}, user_email: {user_email}, cards_count: {len(cards_data) if cards_data else 0}"
        )

        if not folder_id:
            logger.error("Save error: folderId is missing from request")
            return JsonResponse({"message": "フォルダIDが必要です"}, status=400)

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
                        0,
                        2.5,
                        None,
                    ),
                )

        connection.commit()
        logger.error(
            f"SAVE DEBUG - committed {len(cards_data)} cards for folder {folder_id}"
        )

        return JsonResponse({"message": "セーブ完了！"})
    except Exception as e:
        logger.error(f"Save Error: {e}")
        logger.error(f"Save Error with stack trace: {e}\n{traceback.format_exc()}")
        return JsonResponse({"message": "カードの保存に失敗しました"}, status=500)


@xframe_options_exempt
def load_cards_public(request, folder_id):
    """Public read-only loader for public folders only."""
    try:
        with connection.cursor() as c:
            c.execute("SELECT visibility FROM folders WHERE id = %s", (folder_id,))
            folder = dictfetchone(c)
            if not folder:
                return JsonResponse({"message": "Folder not found"}, status=404)
            if folder["visibility"] != "public":
                return JsonResponse({"message": "Access denied"}, status=403)

            c.execute(
                """
                SELECT c.id,
                       c.front_content as front,
                       c.back_content as back,
                       c.front_bg as frontBg,
                       c.back_bg as backBg,
                       c.tags as tags
                FROM cards c
                WHERE c.folder_id = %s
                ORDER BY c.order_index
                """,
                (folder_id,),
            )
            cards = dictfetchall(c)

        return JsonResponse(cards, safe=False)
    except Exception as e:
        logger.error(f"load_cards_public error: {e}")
        return JsonResponse({"message": "Failed to load cards"}, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def delete_card(request):
    import json as json_mod

    data = json_mod.loads(request.body)
    card_id = data.get("cardId")
    user_email = request.user_email

    if not card_id:
        return JsonResponse({"message": "カードIDが必要です"}, status=400)

    try:
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
# EDITOR ROUTE
# ==========================================

from django.shortcuts import render


def editor(request, folder_id):
    return render(request, "editor.html", {"folder_id": folder_id})


def viewer(request, folder_id):
    return render(request, "viewer.html", {"folder_id": folder_id})


@xframe_options_exempt
@jwt_required
def load_cards_fixed(request, folder_id):
    user_email = request.user_email
    try:
        with connection.cursor() as c:
            c.execute(
                "SELECT user_email, visibility FROM folders WHERE id = %s",
                (folder_id,),
            )
            folder = dictfetchone(c)
            if not folder:
                return JsonResponse({"message": "Folder not found"}, status=404)
            if folder["visibility"] != "public" and folder["user_email"] != user_email:
                return JsonResponse({"message": "Access denied"}, status=403)

            c.execute(
                """
                SELECT c.id,
                       c.front_content as front,
                       c.back_content as back,
                       c.front_bg as frontBg,
                       c.back_bg as backBg,
                       c.tags as tags
                FROM cards c
                WHERE c.folder_id = %s
                ORDER BY c.order_index
                """,
                (folder_id,),
            )
            cards = dictfetchall(c)
        return JsonResponse(cards, safe=False)
    except Exception as e:
        logger.error(f"Load cards error: {e}")
        return JsonResponse({"error": "Failed to load cards"}, status=500)


@xframe_options_exempt
def get_public_cards(request):
    try:
        search_query = request.GET.get("search", "").strip()
        page = int(request.GET.get("page", 1))
        limit = 20
        offset = (page - 1) * limit

        where_clause = "WHERE f.visibility = 'public'"
        params = []

        if search_query:
            where_clause += " AND (c.front_content LIKE %s OR c.back_content LIKE %s)"
            search_pattern = f"%{search_query}%"
            params = [search_pattern, search_pattern]

        count_sql = f"""
            SELECT COUNT(*) as count
            FROM cards c
            JOIN folders f ON c.folder_id = f.id
            {where_clause}
        """
        with connection.cursor() as c:
            c.execute(count_sql, tuple(params))
            total_count = dictfetchone(c)["count"]
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        fetch_sql = f"""
            SELECT c.id, c.front_content as front, c.back_content as back,
                   c.front_bg as frontBg, c.back_bg as backBg,
                   f.id as folder_id, f.title as folder_title,
                   COALESCE(u.username, f.user_email) as folder_owner
            FROM cards c
            JOIN folders f ON c.folder_id = f.id
            LEFT JOIN users u ON f.user_email = u.email OR f.user_email = u.username
            {where_clause}
            ORDER BY c.id DESC
            LIMIT %s OFFSET %s
        """
        final_params = params + [limit, offset]

        with connection.cursor() as c:
            c.execute(fetch_sql, tuple(final_params))
            cards = dictfetchall(c)

        for idx, card in enumerate(cards):
            if "id" not in card:
                card["id"] = idx + 1

        return JsonResponse(
            {
                "cards": cards,
                "totalPages": total_pages,
                "currentPage": page,
            }
        )
    except Exception as e:
        logger.error(f"Get public cards error: {e}")
        return JsonResponse({"message": "Failed to load public cards"}, status=500)
