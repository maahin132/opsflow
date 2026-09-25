from django.contrib import admin

from .models import Organization, OrganizationMember


class OrganizationMemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 1
    autocomplete_fields = ("user",)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "is_active",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "slug",
        "owner__username",
        "owner__email",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    autocomplete_fields = (
        "owner",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = (
        OrganizationMemberInline,
    )


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = (
        "organization",
        "user",
        "role",
        "joined_at",
        "updated_at",
    )

    list_filter = (
        "role",
        "joined_at",
    )

    search_fields = (
        "organization__name",
        "user__username",
        "user__email",
    )

    autocomplete_fields = (
        "organization",
        "user",
    )

    readonly_fields = (
        "joined_at",
        "updated_at",
    )