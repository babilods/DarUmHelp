"""
ASGI config for darumhelp project.

Expõe HTTP (WSGI-like, via get_asgi_application) e WebSocket (chat/sinalização
WebRTC, via Channels) no mesmo processo/porta.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'darumhelp.settings')

# get_asgi_application() precisa rodar antes de importar qualquer coisa que
# toque o app registry do Django (ex.: realtime.routing -> agendamento.services
# -> agendamento.models), senão estoura AppRegistryNotReady.
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

import realtime.routing  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(realtime.routing.websocket_urlpatterns))
        ),
    }
)
