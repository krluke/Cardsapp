from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("login", views.login, name="login"),
    path("signup", views.signup, name="signup"),
    path("send-code", views.send_code, name="send_code"),
    # User
    path("user/change-password", views.change_password, name="change_password"),
    path("user/stats", views.get_user_stats, name="user_stats"),
    # Folders
    path("folders/list", views.list_folders, name="list_folders"),
    path("folders/create", views.create_folder, name="create_folder"),
    path("folders", views.get_folders, name="get_folders"),
    path("folders/global", views.list_global_folders, name="global_folders"),
    path("folders/update", views.update_folder, name="update_folder"),
    path("folders/delete", views.delete_folder, name="delete_folder"),
    path("folders/toggle-action", views.toggle_action, name="toggle_action"),
    # Cards
    path("cards/save", views.save_cards, name="save_cards"),
    path("cards/load/<int:folder_id>", views.load_cards, name="load_cards"),
    path("cards/delete", views.delete_card, name="delete_card"),
    # Editor/Viewer pages
    path("editor/<int:folder_id>", views.editor, name="editor"),
    path("viewer/<int:folder_id>", views.viewer, name="viewer"),
    # Admin
    path(
        "admin/migrate-passwords", views.admin_migrate_passwords, name="admin_migrate"
    ),
]
