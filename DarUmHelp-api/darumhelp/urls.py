from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from darumhelp import front

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/contas/", include("contas.urls")),
    path("api/", include("professores.urls")),
    path("api/", include("agendamento.urls")),
]

if settings.DEBUG:
    # Só em dev: serve os uploads (ex.: currículos) para o admin poder revisar.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("", front.index, name="front-index"),
    re_path(r"^(?P<path>.*)$", front.asset, name="front-asset"),
]
