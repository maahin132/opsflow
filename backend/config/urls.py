from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # Authentication APIs
    path(
        "api/auth/",
        include("apps.accounts.urls"),
    ),

    # Organization APIs
    path(
        "api/",
        include("apps.organizations.urls"),
    ),

    # Projects APIs
    path(
        "api/",
        include("apps.projects.urls"),
    ),

    # Tasks APIs
    path(
        "api/",
        include("apps.tasks.urls"),
    ),
]