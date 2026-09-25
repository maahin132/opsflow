
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet


router = DefaultRouter(trailing_slash=True)
router.include_format_suffixes = False

router.register(
    r"projects",
    ProjectViewSet,
    basename="project",
)

urlpatterns = router.urls