"""Consumers WebSocket: chat em tempo real (push-only) e sinalização WebRTC.

A checagem de "quem pode participar deste agendamento" é a mesma usada pelas
views REST (ver agendamento.services.get_agendamento_para_usuario), para não
duplicar a regra de negócio em dois lugares.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.http import Http404
from rest_framework.exceptions import PermissionDenied

from agendamento.services import get_agendamento_para_usuario

# Estado de salas de vídeo em memória (só válido para um único processo —
# ver limitação do InMemoryChannelLayer documentada no plano).
SALAS: dict[int, dict[str, str]] = {}


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Só recebe pushes de novas mensagens (ver agendamento.signals).

    O envio de mensagens continua exclusivamente via POST REST em
    /api/aulas/<pk>/mensagens/, que já aplica moderação antes de salvar.
    """

    async def connect(self):
        self.agendamento_id = self.scope["url_route"]["kwargs"]["agendamento_id"]
        autorizado = await self._autorizado(self.scope["user"])
        if not autorizado:
            await self.close(code=4403)
            return

        self.group_name = f"chat_{self.agendamento_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def _autorizado(self, user):
        try:
            get_agendamento_para_usuario(self.agendamento_id, user)
            return True
        except (Http404, PermissionDenied):
            return False

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Nenhuma escrita é aceita via WebSocket — ver docstring da classe.
        pass

    async def chat_message(self, event):
        await self.send_json(event["message"])


class SinalizacaoConsumer(AsyncJsonWebsocketConsumer):
    """Relay ponto-a-ponto de sinalização WebRTC (offer/answer/ice-candidate).

    Sala fixa de no máximo 2 participantes: o aluno e o professor daquele
    agendamento específico. Quem sempre cria a oferta SDP é o professor; o
    aluno sempre responde (evita glare sem precisar de perfect-negotiation).
    """

    async def connect(self):
        self.agendamento_id = self.scope["url_route"]["kwargs"]["agendamento_id"]
        self.role = await self._autorizar(self.scope["user"])
        if self.role is None:
            await self.close(code=4403)
            return

        sala = SALAS.setdefault(self.agendamento_id, {})
        if sala.get(self.role) not in (None, self.channel_name):
            await self.close(code=4409)  # já existe uma conexão ativa desse papel
            return
        if len(sala) >= 2 and self.role not in sala:
            await self.accept()
            await self.send_json({"type": "room_full"})
            await self.close(code=4408)
            return

        sala[self.role] = self.channel_name
        await self.accept()

        outro_papel = "professor" if self.role == "aluno" else "aluno"
        outro_channel = sala.get(outro_papel)
        if outro_channel:
            await self.channel_layer.send(outro_channel, {"type": "peer.joined", "role": self.role})
            await self.send_json({"type": "peer_joined", "role": outro_papel})

    @database_sync_to_async
    def _autorizar(self, user):
        try:
            agendamento = get_agendamento_para_usuario(self.agendamento_id, user)
        except (Http404, PermissionDenied):
            return None
        if hasattr(user, "perfil_professor") and agendamento.professor_id == user.perfil_professor.id:
            return "professor"
        return "aluno"

    async def disconnect(self, close_code):
        sala = SALAS.get(self.agendamento_id)
        role = getattr(self, "role", None)
        if not sala or not role or sala.get(role) != self.channel_name:
            return

        del sala[role]
        outro_papel = "professor" if role == "aluno" else "aluno"
        outro_channel = sala.get(outro_papel)
        if outro_channel:
            await self.channel_layer.send(outro_channel, {"type": "peer.left", "role": role})
        if not sala:
            SALAS.pop(self.agendamento_id, None)

    async def receive_json(self, content, **kwargs):
        if content.get("type") not in ("offer", "answer", "ice-candidate", "leave"):
            return

        sala = SALAS.get(self.agendamento_id, {})
        outro_papel = "professor" if self.role == "aluno" else "aluno"
        outro_channel = sala.get(outro_papel)
        if outro_channel:
            await self.channel_layer.send(outro_channel, {"type": "signal.relay", "payload": content})

    async def peer_joined(self, event):
        await self.send_json({"type": "peer_joined", "role": event["role"]})

    async def peer_left(self, event):
        await self.send_json({"type": "peer_left", "role": event["role"]})

    async def signal_relay(self, event):
        await self.send_json(event["payload"])
