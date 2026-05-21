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
        "editor/<int:folder_id>/", __import__("api.views").views.editor, name="editor"
    ),
    path(
        "viewer/<int:folder_id>/", __import__("api.views").views.viewer, name="viewer"
    ),
]
