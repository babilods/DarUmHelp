from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<agendamento_id>\d+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"^ws/sala/(?P<agendamento_id>\d+)/$", consumers.SinalizacaoConsumer.as_asgi()),
]
