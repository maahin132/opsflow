from rest_framework import serializers

from .models import Organization, OrganizationMember


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.ReadOnlyField(source="user.username")
    email = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = OrganizationMember
        fields = ["id", "user_id", "username", "email", "role"]
        read_only_fields = fields


class OrganizationSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.email")
    member_count = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    members = OrganizationMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo_url",
            "owner",
            "member_count",
            "current_user_role",
            "members",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "member_count",
            "current_user_role",
            "members",
            "created_at",
            "updated_at",
        ]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_current_user_role(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None

        return obj.members.filter(
            user=request.user
        ).values_list("role", flat=True).first()