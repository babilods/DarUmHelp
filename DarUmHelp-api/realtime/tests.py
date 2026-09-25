import datetime
from decimal import Decimal

from asgiref.sync import sync_to_async
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import User
from django.test import TransactionTestCase

from agendamento.models import Agendamento, Mensagem
from contas.models import PerfilAluno, PerfilProfessor
from professores.models import Disciplina, Disponibilidade

from .routing import websocket_urlpatterns

SENHA = "Estudo@2026forte"


class WebSocketTests(TransactionTestCase):
    """Integração com o serviço de tempo real (Django Channels)."""

    def setUp(self):
        prof_user = User.objects.create_user("p@t.com", "p@t.com", SENHA)
        self.professor = PerfilProfessor.objects.create(
            user=prof_user, status_verificacao="aprovado", preco_hora=Decimal("50")
        )
        disciplina = Disciplina.objects.create(nome="Inglês", professor=self.professor)
        janela = Disponibilidade.objects.create(
            professor=self.professor, disciplina=disciplina, dia_semana="segunda",
            horario_inicio=datetime.time(9), horario_fim=datetime.time(12),
        )
        self.aluno_user = User.objects.create_user("a@t.com", "a@t.com", SENHA)
        aluno = PerfilAluno.objects.create(user=self.aluno_user)
        self.intruso = User.objects.create_user("x@t.com", "x@t.com", SENHA)
        PerfilAluno.objects.create(user=self.intruso)
        self.aula = Agendamento.objects.create(
            aluno=aluno, professor=self.professor, disciplina=disciplina, disponibilidade=janela,
            data=datetime.date.today() + datetime.timedelta(days=3), horario=datetime.time(9),
            status="confirmado",
        )

    def comunicador(self, user, sala="chat"):
        com = WebsocketCommunicator(URLRouter(websocket_urlpatterns), f"/ws/{sala}/{self.aula.id}/")
        com.scope["user"] = user
        return com

    async def test_participante_recebe_nova_mensagem_em_tempo_real(self):
        com = self.comunicador(self.professor.user)
        conectado, _ = await com.connect()
        self.assertTrue(conectado)
        await sync_to_async(Mensagem.objects.create)(
            agendamento=self.aula, remetente=self.aluno_user, texto="Bom dia!"
        )
        evento = await com.receive_json_from(timeout=3)
        self.assertEqual(evento["text"], "Bom dia!")
        await com.disconnect()

    async def test_nao_participante_e_recusado_no_chat(self):
        conectado, codigo = await self.comunicador(self.intruso).connect()
        self.assertFalse(conectado)
        self.assertEqual(codigo, 4403)

    async def test_sala_de_video_repassa_sinalizacao_entre_professor_e_aluno(self):
        prof = self.comunicador(self.professor.user, "sala")
        aluno = self.comunicador(self.aluno_user, "sala")
        self.assertTrue((await prof.connect())[0])
        self.assertTrue((await aluno.connect())[0])
        self.assertEqual((await prof.receive_json_from(timeout=3))["type"], "peer_joined")
        self.assertEqual((await aluno.receive_json_from(timeout=3))["type"], "peer_joined")
        await prof.send_json_to({"type": "offer", "sdp": "v=0 teste"})
        recebido = await aluno.receive_json_from(timeout=3)
        self.assertEqual(recebido, {"type": "offer", "sdp": "v=0 teste"})
        await prof.disconnect()
        await aluno.disconnect()
