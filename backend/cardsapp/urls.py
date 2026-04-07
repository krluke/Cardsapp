from django.urls import path, include
from django.contrib import admin
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
    path(
        "account/", TemplateView.as_view(template_name="account.html"), name="account"
    ),
    path(
        "change-password/",
        TemplateView.as_view(template_name="change_password.html"),
        name="change_password",
    ),
    # Editor and Viewer pages are handled in api/urls.py but need to be accessible directly
    # Direct route to the editor page (renders editor.html)
    # The viewer page is defined separately below.
    # Import the view from `api.views` and map the URL to it.
    # Note: trailing slash is added to avoid redirect loops.
    path(
        "editor/<int:folder_id>/", __import__("api.views").views.editor, name="editor"
    ),
    # Viewer page route (renders viewer.html)
    path(
        "viewer/<int:folder_id>/", __import__("api.views").views.viewer, name="viewer"
    ),
]
