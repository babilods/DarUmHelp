import datetime
from decimal import Decimal
from unittest import mock

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from contas.models import PerfilAluno, PerfilProfessor
from professores.models import Disciplina, Disponibilidade

from .models import Agendamento, Avaliacao, DenunciaMensagem, Mensagem, Pagamento
from .moderacao import ModeradorPalavrasChave
from .services import horario_fim_aula, horas_restantes

SENHA = "Estudo@2026forte"


def proxima_data(weekday, minimo_dias=3):
    """Próxima data (a partir de hoje + minimo_dias) que cai no dia da semana pedido."""
    data = timezone.localdate() + datetime.timedelta(days=minimo_dias)
    while data.weekday() != weekday:
        data += datetime.timedelta(days=1)
    return data


class BaseAgendamentoTestCase(TestCase):
    def setUp(self):
        u = User.objects.create_user("prof@t.com", "prof@t.com", SENHA, first_name="Carlos")
        self.professor = PerfilProfessor.objects.create(
            user=u, status_verificacao="aprovado", preco_hora=Decimal("80.00")
        )
        self.disciplina = Disciplina.objects.create(nome="Matemática", professor=self.professor)
        # Janela: segunda-feira das 10h às 17h.
        self.janela = Disponibilidade.objects.create(
            professor=self.professor, disciplina=self.disciplina, dia_semana="segunda",
            horario_inicio=datetime.time(10), horario_fim=datetime.time(17),
        )
        self.aluno = self.novo_aluno("aluno@t.com")
        self.aluno2 = self.novo_aluno("aluno2@t.com")
        self.segunda = proxima_data(0)

        self.c_aluno = self.cliente(self.aluno.user)
        self.c_aluno2 = self.cliente(self.aluno2.user)
        self.c_prof = self.cliente(self.professor.user)

    def novo_aluno(self, email):
        return PerfilAluno.objects.create(
            user=User.objects.create_user(email, email, SENHA, first_name=email.split("@")[0])
        )

    def cliente(self, user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    def agendar(self, cliente=None, horario="10:00", duracao=60, data=None, metodo="PIX"):
        return (cliente or self.c_aluno).post(
            "/api/aulas/",
            {
                "disponibilidade": self.janela.id,
                "data": (data or self.segunda).isoformat(),
                "horario": horario,
                "duracao_minutos": duracao,
                "metodo": metodo,
            },
            format="json",
        )

    def aula_direta(self, momento, status="confirmado", valor="80.00", aluno=None):
        """Cria a aula direto no banco num momento arbitrário (passado ou < 24h)."""
        local = timezone.localtime(momento)
        aula = Agendamento.objects.create(
            aluno=aluno or self.aluno, professor=self.professor, disciplina=self.disciplina,
            disponibilidade=self.janela, data=local.date(), horario=local.time().replace(microsecond=0),
            status=status,
        )
        Pagamento.objects.create(agendamento=aula, valor=Decimal(valor), metodo="PIX", status="aprovado")
        return aula


class ServicosUnitTests(TestCase):
    """Unidade: funções auxiliares de agendamento/services.py e o moderador."""

    def test_horario_fim_soma_duracao(self):
        self.assertEqual(horario_fim_aula(datetime.time(10, 0), 90), datetime.time(11, 30))
        self.assertEqual(horario_fim_aula(datetime.time(14, 30), 150), datetime.time(17, 0))

    def test_horas_restantes_positiva_para_aula_futura(self):
        futuro = timezone.localtime(timezone.now() + datetime.timedelta(hours=30))
        aula = Agendamento(data=futuro.date(), horario=futuro.time())
        self.assertAlmostEqual(horas_restantes(aula), 30, delta=0.1)

    def test_moderador_aprova_texto_normal(self):
        self.assertTrue(ModeradorPalavrasChave().analisar("Olá professor, podemos revisar derivadas?").aprovado)

    def test_moderador_bloqueia_pedidos_de_contato_por_fora(self):
        moderador = ModeradorPalavrasChave()
        for texto in ["me passa seu wpp", "me passa seu número de telefone", "qual seu numero?", "manda teu zap",
                      "me chama no insta", "me dá seu telefone", "passa o contato", "me passa seu email",
                      "me adiciona no whats", "tem telegram?", "me liga pelo celular"]:
            with self.subTest(texto=texto):
                self.assertFalse(moderador.analisar(texto).aprovado)

    def test_moderador_libera_frases_normais_de_aula(self):
        moderador = ModeradorPalavrasChave()
        for texto in ["qual é o número da questão 3?", "me manda o número da página", "o número de mols é 2",
                      "entre em contato comigo pelo chat", "posso te chamar aqui no chat?", "qual o número do exercício?"]:
            with self.subTest(texto=texto):
                self.assertTrue(moderador.analisar(texto).aprovado)

    def test_moderador_bloqueia_contato_externo(self):
        resultado = ModeradorPalavrasChave().analisar("me chama no whatsapp 11 91234-5678")
        self.assertFalse(resultado.aprovado)
        self.assertIn("contato_externo", resultado.categorias_violadas)


class AgendarAulaTests(BaseAgendamentoTestCase):
    """HU10/HU11 + RN02/RN03/RN07: agendamento dentro da janela, sem sobreposição."""

    def test_agendamento_valido_cria_aula_e_pagamento_proporcional(self):
        resp = self.agendar(horario="10:00", duracao=90, metodo="cartao")
        self.assertEqual(resp.status_code, 201, resp.data)
        aula = Agendamento.objects.get()
        self.assertEqual(aula.status, "confirmado")
        self.assertEqual(aula.duracao_minutos, 90)
        self.assertEqual(aula.pagamento.valor, Decimal("120.00"))  # 80 x 1,5h
        self.assertEqual(aula.pagamento.metodo, "cartao")
        self.assertEqual(resp.data["endTime"], "11:30")

    def test_rn03_data_em_dia_da_semana_diferente_da_janela_e_recusada(self):
        terca = self.segunda + datetime.timedelta(days=1)
        resp = self.agendar(data=terca)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Agendamento.objects.count(), 0)

    def test_rn03_aula_que_ultrapassa_o_fim_da_janela_e_recusada(self):
        resp = self.agendar(horario="16:30", duracao=60)  # terminaria 17h30, janela fecha 17h
        self.assertEqual(resp.status_code, 400)

    def test_rn02_horario_sobreposto_por_outro_aluno_e_recusado(self):
        self.assertEqual(self.agendar(horario="10:00", duracao=60).status_code, 201)
        resp = self.agendar(cliente=self.c_aluno2, horario="10:30", duracao=60)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Agendamento.objects.count(), 1)

    def test_rn02_horarios_encostados_sem_sobreposicao_sao_permitidos(self):
        self.assertEqual(self.agendar(horario="10:00", duracao=60).status_code, 201)
        self.assertEqual(self.agendar(cliente=self.c_aluno2, horario="11:00", duracao=60).status_code, 201)
        self.assertEqual(Agendamento.objects.count(), 2)

    def test_professor_nao_fica_com_duas_aulas_ao_mesmo_tempo_em_materias_diferentes(self):
        # Mesmo professor atende Física na mesma janela de segunda (10h-17h).
        fisica = Disciplina.objects.create(nome="Física", professor=self.professor)
        janela_fisica = Disponibilidade.objects.create(
            professor=self.professor, disciplina=fisica, dia_semana="segunda",
            horario_inicio=datetime.time(10), horario_fim=datetime.time(17),
        )
        self.assertEqual(self.agendar(horario="10:00", duracao=60).status_code, 201)  # Matemática 10h-11h

        def agendar_fisica(horario):
            return self.c_aluno2.post("/api/aulas/", {
                "disponibilidade": janela_fisica.id, "data": self.segunda.isoformat(),
                "horario": horario, "duracao_minutos": 60,
            }, format="json")

        self.assertEqual(agendar_fisica("10:30").status_code, 400)  # choca com a de Matemática
        # A janela de Física já mostra o horário ocupado pela aula de Matemática.
        ocupados = APIClient().get(f"/api/disponibilidades/{janela_fisica.id}/ocupados/", {"data": self.segunda.isoformat()}).data
        self.assertEqual(ocupados, [{"horario": "10:00", "horarioFim": "11:00"}])
        self.assertEqual(agendar_fisica("11:00").status_code, 201)  # logo depois, tudo bem

    def test_horario_de_aula_cancelada_volta_a_ficar_livre(self):
        self.agendar(horario="10:00")
        aula = Agendamento.objects.get()
        self.c_aluno.post(f"/api/aulas/{aula.id}/cancelar/")
        self.assertEqual(self.agendar(cliente=self.c_aluno2, horario="10:00").status_code, 201)

    def congelar_relogio_na_segunda_as(self, hora, minuto=0):
        """Faz o 'agora' do sistema ser self.segunda no horário pedido."""
        agora = timezone.make_aware(
            datetime.datetime.combine(self.segunda, datetime.time(hora, minuto)),
            timezone.get_current_timezone(),
        )
        return mock.patch("django.utils.timezone.now", return_value=agora)

    def test_aula_no_mesmo_dia_com_1h_de_antecedencia_e_aceita(self):
        with self.congelar_relogio_na_segunda_as(11, 0):
            resp = self.agendar(horario="12:00", duracao=60)
        self.assertEqual(resp.status_code, 201, resp.data)

    def test_aula_no_mesmo_dia_com_menos_de_1h_e_recusada(self):
        with self.congelar_relogio_na_segunda_as(11, 0):
            resp = self.agendar(horario="11:30", duracao=60)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Agendamento.objects.count(), 0)

    def test_horario_que_ja_passou_e_recusado(self):
        with self.congelar_relogio_na_segunda_as(15, 0):
            resp = self.agendar(horario="10:00", duracao=60)
        self.assertEqual(resp.status_code, 400)

    def test_data_passada_e_recusada(self):
        semana_passada = timezone.localdate() - datetime.timedelta(days=7)
        while semana_passada.weekday() != 0:
            semana_passada -= datetime.timedelta(days=1)
        self.assertEqual(self.agendar(data=semana_passada).status_code, 400)

    def test_rn07_janela_indisponivel_nao_aceita_agendamento(self):
        self.janela.status = "indisponivel"
        self.janela.save()
        self.assertEqual(self.agendar().status_code, 400)

    def test_professor_nao_pode_agendar(self):
        self.assertEqual(self.agendar(cliente=self.c_prof).status_code, 400)

    def test_horarios_ocupados_lista_a_faixa_reservada(self):
        self.agendar(horario="14:00", duracao=120)
        resp = APIClient().get(
            f"/api/disponibilidades/{self.janela.id}/ocupados/", {"data": self.segunda.isoformat()}
        )
        self.assertEqual(resp.data, [{"horario": "14:00", "horarioFim": "16:00"}])

    def test_professor_ve_a_foto_do_aluno_na_aula(self):
        self.agendar()
        self.assertIsNone(self.c_prof.get("/api/aulas/").data[0]["studentAvatar"])  # sem foto → iniciais
        self.aluno.avatar = "avatars/foto-aluno.jpg"
        self.aluno.save()
        self.assertTrue(self.c_prof.get("/api/aulas/").data[0]["studentAvatar"].endswith("/media/avatars/foto-aluno.jpg"))

    def test_hu12_hu06_aluno_e_professor_veem_a_aula_na_lista(self):
        self.agendar()
        self.assertEqual(len(self.c_aluno.get("/api/aulas/").data), 1)
        self.assertEqual(len(self.c_prof.get("/api/aulas/").data), 1)
        self.assertEqual(len(self.c_aluno2.get("/api/aulas/").data), 0)


class ProfessorRejeitadoTests(BaseAgendamentoTestCase):
    """RN11: professor rejeitado pelo administrador some de tudo que é público."""

    def setUp(self):
        super().setUp()
        from contas.models import Favorito
        Favorito.objects.create(aluno=self.aluno, professor=self.professor)  # favoritado antes da rejeição
        self.professor.status_verificacao = "rejeitado"
        self.professor.motivo_rejeicao = "Currículo incompleto"
        self.professor.save()

    def test_nao_aparece_na_busca_nem_no_perfil(self):
        anonimo = APIClient()
        self.assertNotIn(self.professor.id, [p["id"] for p in anonimo.get("/api/professores/").data])
        self.assertEqual(anonimo.get(f"/api/professores/{self.professor.id}/").status_code, 404)

    def test_some_dos_favoritos_do_aluno(self):
        self.assertEqual(self.c_aluno.get("/api/contas/aluno/me/favoritos/").data, [])

    def test_nao_tem_horarios_publicos_nem_pode_ser_agendado(self):
        self.assertEqual(APIClient().get(f"/api/professores/{self.professor.id}/disponibilidades/").data, [])
        self.assertEqual(self.agendar().status_code, 400)
        self.assertEqual(Agendamento.objects.count(), 0)

    def test_volta_a_aparecer_quando_aprovado(self):
        self.professor.status_verificacao = "aprovado"
        self.professor.save()
        self.assertIn(self.professor.id, [p["id"] for p in APIClient().get("/api/professores/").data])
        self.assertEqual(self.agendar().status_code, 201)


class CancelamentoReembolsoTests(BaseAgendamentoTestCase):
    """HU07/HU13 + RN05: cancelamento e política de reembolso."""

    def test_aluno_cancela_com_24h_ou_mais_recebe_100(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=48))
        resp = self.c_aluno.post(f"/api/aulas/{aula.id}/cancelar/")
        self.assertEqual(resp.status_code, 200)
        aula.refresh_from_db()
        self.assertEqual(aula.status, "cancelado")
        self.assertEqual(aula.motivo_cancelamento, "cancelado_aluno")
        self.assertEqual(aula.pagamento.percentual_reembolso, Decimal("100"))
        self.assertEqual(aula.pagamento.valor_reembolsado, Decimal("80.00"))
        # O aluno vê o valor na mensagem e no selo da aula.
        self.assertIn("R$ 80,00", resp.data["mensagem"])
        self.assertEqual(resp.data["agendamento"]["refundStatus"], "Reembolso integral de R$ 80,00")
        self.assertEqual(resp.data["agendamento"]["refundAmount"], 80.0)

    def test_aluno_cancela_com_menos_de_24h_nao_recebe_reembolso(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=5))
        resp = self.c_aluno.post(f"/api/aulas/{aula.id}/cancelar/")
        aula.refresh_from_db()
        self.assertEqual(aula.pagamento.percentual_reembolso, Decimal("0"))
        self.assertEqual(aula.pagamento.valor_reembolsado, Decimal("0.00"))
        self.assertEqual(aula.pagamento.status_reembolso, "sem_direito")
        # Antes o selo dizia "Reembolso de 50% solicitado" por engano.
        self.assertEqual(resp.data["agendamento"]["refundStatus"], "Sem direito a reembolso")
        self.assertIn("sem direito a reembolso", resp.data["mensagem"])

    def test_professor_cancela_aluno_sempre_recebe_100(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=2), valor="120.00")
        resp = self.c_prof.post(f"/api/aulas/{aula.id}/cancelar/")
        aula.refresh_from_db()
        self.assertEqual(aula.motivo_cancelamento, "cancelado_professor")
        self.assertEqual(aula.pagamento.valor_reembolsado, Decimal("120.00"))
        self.assertIn("O aluno receberá o reembolso integral de R$ 120,00", resp.data["mensagem"])
        self.assertEqual(aula.pagamento.percentual_reembolso, Decimal("100"))

    def test_rn05_usuario_que_nao_participa_nao_pode_cancelar(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=48))
        self.assertEqual(self.c_aluno2.post(f"/api/aulas/{aula.id}/cancelar/").status_code, 403)
        aula.refresh_from_db()
        self.assertEqual(aula.status, "confirmado")

    def test_aula_que_ja_comecou_ou_terminou_nao_pode_ser_cancelada(self):
        em_andamento = self.aula_direta(timezone.now() - datetime.timedelta(minutes=10))
        terminada = self.aula_direta(timezone.now() - datetime.timedelta(hours=3))
        for aula in (em_andamento, terminada):
            for cliente in (self.c_aluno, self.c_prof):
                self.assertEqual(cliente.post(f"/api/aulas/{aula.id}/cancelar/").status_code, 400)
            aula.refresh_from_db()
            self.assertEqual(aula.status, "confirmado")
            self.assertIsNone(aula.pagamento.percentual_reembolso)

    def test_botao_cancelar_so_aparece_antes_da_aula(self):
        futura = self.aula_direta(timezone.now() + datetime.timedelta(hours=5))
        passada = self.aula_direta(timezone.now() - datetime.timedelta(hours=3))
        dados = {a["id"]: a for a in self.c_aluno.get("/api/aulas/").data}
        self.assertTrue(dados[futura.id]["canCancel"])
        self.assertFalse(dados[passada.id]["canCancel"])
        self.assertTrue(dados[passada.id]["canMarkConcluido"] is False)  # só o professor conclui
        dados_prof = {a["id"]: a for a in self.c_prof.get("/api/aulas/").data}
        self.assertTrue(dados_prof[passada.id]["canMarkConcluido"])

    def test_nao_cancela_aula_ja_cancelada(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=48), status="cancelado")
        self.assertEqual(self.c_aluno.post(f"/api/aulas/{aula.id}/cancelar/").status_code, 400)


class ConclusaoNoShowAvaliacaoTests(BaseAgendamentoTestCase):
    """Conclusão, não comparecimento e avaliação do professor."""

    def test_professor_conclui_aula_apos_o_horario(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(hours=3))
        self.assertEqual(self.c_prof.post(f"/api/aulas/{aula.id}/concluir/").status_code, 200)
        aula.refresh_from_db()
        self.assertEqual(aula.status, "concluido")

    def test_nao_conclui_aula_antes_do_horario(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(hours=3))
        self.assertEqual(self.c_prof.post(f"/api/aulas/{aula.id}/concluir/").status_code, 400)

    def test_aluno_nao_pode_concluir_aula(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(hours=3))
        self.assertEqual(self.c_aluno.post(f"/api/aulas/{aula.id}/concluir/").status_code, 403)

    def test_no_show_cancela_sem_reembolso(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(hours=1))
        self.assertEqual(self.c_prof.post(f"/api/aulas/{aula.id}/no-show/").status_code, 200)
        aula.refresh_from_db()
        self.assertEqual(aula.motivo_cancelamento, "no_show")
        self.assertEqual(aula.pagamento.status_reembolso, "sem_direito")

    def test_avaliacao_de_aula_concluida_atualiza_media_do_professor(self):
        a1 = self.aula_direta(timezone.now() - datetime.timedelta(days=2), status="concluido")
        a2 = self.aula_direta(timezone.now() - datetime.timedelta(days=1), status="concluido", aluno=self.aluno2)
        self.assertEqual(self.c_aluno.post(f"/api/aulas/{a1.id}/avaliacao/", {"nota": 5, "comentario": "Ótima aula"}, format="json").status_code, 201)
        self.assertEqual(self.c_aluno2.post(f"/api/aulas/{a2.id}/avaliacao/", {"nota": 4}, format="json").status_code, 201)
        self.professor.refresh_from_db()
        self.assertEqual(self.professor.avaliacao_media, Decimal("4.50"))

    def test_avaliacoes_podem_ser_vistas_antes_de_agendar_sem_login(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(days=1), status="concluido")
        self.c_aluno.post(f"/api/aulas/{aula.id}/avaliacao/", {"nota": 4, "comentario": "Explica muito bem"}, format="json")
        resp = APIClient().get(f"/api/professores/{self.professor.id}/avaliacoes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["nota"], 4)
        self.assertEqual(resp.data[0]["comentario"], "Explica muito bem")

    def test_nao_avalia_aula_nao_concluida(self):
        aula = self.aula_direta(timezone.now() + datetime.timedelta(days=2))
        resp = self.c_aluno.post(f"/api/aulas/{aula.id}/avaliacao/", {"nota": 5}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_nao_avalia_a_mesma_aula_duas_vezes(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(days=1), status="concluido")
        self.c_aluno.post(f"/api/aulas/{aula.id}/avaliacao/", {"nota": 5}, format="json")
        resp = self.c_aluno.post(f"/api/aulas/{aula.id}/avaliacao/", {"nota": 1}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Avaliacao.objects.count(), 1)

    def test_comentario_ofensivo_na_avaliacao_e_bloqueado(self):
        aula = self.aula_direta(timezone.now() - datetime.timedelta(days=1), status="concluido")
        resp = self.c_aluno.post(
            f"/api/aulas/{aula.id}/avaliacao/", {"nota": 1, "comentario": "me chama no whatsapp"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Avaliacao.objects.count(), 0)


class ChatDenunciaTests(BaseAgendamentoTestCase):
    """HU16/HU17 + RN09: chat da aula, moderação e denúncia."""

    def setUp(self):
        super().setUp()
        self.aula = self.aula_direta(timezone.now() + datetime.timedelta(days=2))
        self.url = f"/api/aulas/{self.aula.id}/mensagens/"

    def test_mensagem_aprovada_e_salva_e_listada_para_os_participantes(self):
        resp = self.c_aluno.post(self.url, {"text": "Professor, vamos revisar funções?"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Mensagem.objects.get().remetente, self.aluno.user)
        self.assertEqual(len(self.c_prof.get(self.url).data), 1)

    def test_mensagem_traz_foto_de_quem_enviou(self):
        self.aluno.avatar = "avatars/foto-aluno.jpg"
        self.aluno.save()
        Mensagem.objects.create(agendamento=self.aula, remetente=self.aluno.user, texto="oi")
        Mensagem.objects.create(agendamento=self.aula, remetente=self.professor.user, texto="olá")
        dados = self.c_prof.get(self.url).data
        self.assertTrue(dados[0]["senderAvatar"].endswith("/media/avatars/foto-aluno.jpg"))
        self.assertIsNone(dados[1]["senderAvatar"])  # professor sem foto → front mostra iniciais

    def test_mensagens_nao_lidas_contam_so_as_do_outro_e_zeram_ao_abrir_o_chat(self):
        self.c_aluno.post(self.url, {"text": "Professor, tudo bem?"}, format="json")
        self.c_aluno.post(self.url, {"text": "Podemos ver funções?"}, format="json")
        # Professor tem 2 não lidas; o aluno não conta as próprias mensagens.
        self.assertEqual(self.c_prof.get("/api/aulas/nao-lidas/").data, {"total": 2, "porAula": {str(self.aula.id): 2}})
        self.assertEqual(self.c_aluno.get("/api/aulas/nao-lidas/").data["total"], 0)
        # Abrir o chat (carregar as mensagens) marca como lido.
        self.c_prof.get(self.url)
        self.assertEqual(self.c_prof.get("/api/aulas/nao-lidas/").data["total"], 0)
        # Resposta do professor vira não lida para o aluno, até ele marcar como lida.
        self.c_prof.post(self.url, {"text": "Claro!"}, format="json")
        self.assertEqual(self.c_aluno.get("/api/aulas/nao-lidas/").data["total"], 1)
        self.assertEqual(self.c_aluno.post(f"{self.url}lidas/").status_code, 204)
        self.assertEqual(self.c_aluno.get("/api/aulas/nao-lidas/").data["total"], 0)

    def test_aula_encerrada_mantem_conversa_so_para_leitura(self):
        Mensagem.objects.create(agendamento=self.aula, remetente=self.professor.user, texto="Até a próxima!")
        for status_final in ("concluido", "cancelado"):
            self.aula.status = status_final
            self.aula.save()
            # Os dois lados continuam lendo o histórico...
            self.assertEqual(len(self.c_aluno.get(self.url).data), 1)
            self.assertEqual(len(self.c_prof.get(self.url).data), 1)
            # ...mas ninguém envia mensagem nova.
            self.assertEqual(self.c_aluno.post(self.url, {"text": "oi"}, format="json").status_code, 400)
            self.assertEqual(self.c_prof.post(self.url, {"text": "oi"}, format="json").status_code, 400)
        self.assertEqual(Mensagem.objects.count(), 1)

    def test_chat_fica_so_leitura_quando_o_horario_da_aula_termina(self):
        # Aula de 60 min que começou há 2h: horário encerrado, mas o professor
        # ainda não marcou como concluída (status continua "confirmado").
        passada = self.aula_direta(timezone.now() - datetime.timedelta(hours=2))
        url = f"/api/aulas/{passada.id}/mensagens/"
        Mensagem.objects.create(agendamento=passada, remetente=self.aluno.user, texto="Obrigado pela aula!")
        self.assertEqual(len(self.c_prof.get(url).data), 1)
        self.assertEqual(self.c_prof.post(url, {"text": "De nada!"}, format="json").status_code, 400)
        self.assertEqual(self.c_aluno.post(url, {"text": "oi"}, format="json").status_code, 400)
        # Durante a aula (começou há 10 min) ainda dá para conversar.
        agora = self.aula_direta(timezone.now() - datetime.timedelta(minutes=10))
        self.assertEqual(self.c_aluno.post(f"/api/aulas/{agora.id}/mensagens/", {"text": "Estou entrando"}, format="json").status_code, 201)

    def test_quem_nao_participa_nao_marca_chat_como_lido(self):
        self.assertEqual(self.c_aluno2.post(f"{self.url}lidas/").status_code, 403)

    def test_mensagem_com_contato_externo_e_bloqueada(self):
        resp = self.c_aluno.post(self.url, {"text": "me passa seu whatsapp"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Mensagem.objects.count(), 0)

    def test_quem_nao_participa_nao_le_nem_envia(self):
        self.assertEqual(self.c_aluno2.get(self.url).status_code, 403)
        self.assertEqual(self.c_aluno2.post(self.url, {"text": "oi"}, format="json").status_code, 403)

    def test_denunciar_mensagem_do_outro_participante(self):
        msg = Mensagem.objects.create(agendamento=self.aula, remetente=self.professor.user, texto="texto")
        resp = self.c_aluno.post(f"{self.url}{msg.id}/denunciar/", {"motivo": "ofensa_assedio"}, format="json")
        self.assertEqual(resp.status_code, 201)
        denuncia = DenunciaMensagem.objects.get()
        self.assertEqual(denuncia.denunciado, self.professor.user)
        self.assertEqual(denuncia.texto_mensagem_snapshot, "texto")
        self.assertEqual(denuncia.status, "pendente")

    def test_nao_pode_denunciar_a_propria_mensagem(self):
        msg = Mensagem.objects.create(agendamento=self.aula, remetente=self.aluno.user, texto="minha")
        resp = self.c_aluno.post(f"{self.url}{msg.id}/denunciar/", {"motivo": "outro"}, format="json")
        self.assertEqual(resp.status_code, 400)


class IntegracaoBancoTests(BaseAgendamentoTestCase):
    """Integração aplicação <-> MySQL: inserção, consulta, atualização e exclusão."""

    def test_insercao_persiste_aula_e_pagamento_na_mesma_transacao(self):
        self.agendar()
        self.assertEqual(Agendamento.objects.count(), 1)
        self.assertEqual(Pagamento.objects.count(), 1)
        self.assertEqual(Pagamento.objects.get().agendamento, Agendamento.objects.get())

    def test_insercao_com_conflito_nao_deixa_registro_parcial(self):
        self.agendar(horario="10:00")
        self.agendar(cliente=self.c_aluno2, horario="10:00")
        self.assertEqual(Agendamento.objects.count(), 1)
        self.assertEqual(Pagamento.objects.count(), 1)

    def test_consulta_com_filtro_e_relacionamentos(self):
        self.agendar(horario="10:00")
        self.agendar(cliente=self.c_aluno2, horario="12:00")
        qs = Agendamento.objects.filter(professor=self.professor, status="confirmado").select_related("aluno__user")
        self.assertEqual(sorted(a.aluno.user.email for a in qs), ["aluno2@t.com", "aluno@t.com"])

    def test_atualizacao_de_status_e_persistida(self):
        self.agendar()
        aula = Agendamento.objects.get()
        self.c_aluno.post(f"/api/aulas/{aula.id}/cancelar/")
        self.assertEqual(Agendamento.objects.get(pk=aula.id).status, "cancelado")

    def test_exclusao_em_cascata_remove_dependentes(self):
        self.agendar()
        aula = Agendamento.objects.get()
        Mensagem.objects.create(agendamento=aula, remetente=self.aluno.user, texto="oi")
        aula.delete()
        self.assertEqual(Pagamento.objects.count(), 0)
        self.assertEqual(Mensagem.objects.count(), 0)
