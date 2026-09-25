import datetime
import os
import shutil
import tempfile
from decimal import Decimal
from unittest import mock

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from agendamento.models import Agendamento, Pagamento
from contas.models import PerfilAluno, PerfilProfessor, Saque

from .carteira import saldo_disponivel
from .models import Disciplina, Disponibilidade
from .verificacao import VerificadorHeuristico

SENHA = "Estudo@2026forte"
MEDIA_TESTE = tempfile.mkdtemp(prefix="darumhelp-media-teste-")


def criar_professor(email="prof@teste.com", nome="Carlos", status="aprovado", preco="80.00"):
    user = User.objects.create_user(email, email, SENHA, first_name=nome, last_name="Silva")
    return PerfilProfessor.objects.create(
        user=user, status_verificacao=status, preco_hora=Decimal(preco)
    )


def criar_aluno(email="aluno@teste.com"):
    user = User.objects.create_user(email, email, SENHA, first_name="Aluno")
    return PerfilAluno.objects.create(user=user)


class VerificadorHeuristicoTests(TestCase):
    """Unidade: triagem automática do currículo (professores/verificacao.py)."""

    def setUp(self):
        self.professor = criar_professor()
        Disciplina.objects.create(nome="Matemática", professor=self.professor)
        self.verificador = VerificadorHeuristico()

    def analisar_texto(self, texto):
        with mock.patch.object(VerificadorHeuristico, "_extrair_texto", return_value=texto):
            return self.verificador.analisar(self.professor, arquivo=None)

    def test_curriculo_completo_nao_gera_alertas(self):
        texto = (
            "Formação: Licenciatura em Matemática pela USP. Experiência de 5 anos como professor "
            "de Matemática no ensino médio, com aulas particulares e monitoria. " * 3
        )
        resultado = self.analisar_texto(texto)
        self.assertEqual(resultado.alertas, [])
        self.assertEqual(resultado.confianca, "alta")

    def test_curriculo_vazio_gera_alertas_e_confianca_baixa(self):
        resultado = self.analisar_texto("")
        self.assertGreaterEqual(len(resultado.alertas), 3)
        self.assertEqual(resultado.confianca, "baixa")

    def test_curriculo_sem_a_disciplina_cadastrada_e_sinalizado(self):
        texto = "Formação em Letras. Experiência como professor de redação e literatura. " * 5
        resultado = self.analisar_texto(texto)
        self.assertTrue(any("disciplinas cadastradas" in a for a in resultado.alertas))


@override_settings(MEDIA_ROOT=MEDIA_TESTE)
class CurriculoUploadTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TESTE, ignore_errors=True)

    def setUp(self):
        self.professor = criar_professor(status="aprovado")
        self.client = APIClient()
        self.client.force_authenticate(self.professor.user)

    def test_envio_de_curriculo_volta_status_para_pendente(self):
        arquivo = SimpleUploadedFile("cv.pdf", b"%PDF-1.4 conteudo", content_type="application/pdf")
        resp = self.client.post("/api/professores/me/curriculo/", {"curriculo": arquivo}, format="multipart")
        self.assertEqual(resp.status_code, 201)
        self.professor.refresh_from_db()
        self.assertEqual(self.professor.status_verificacao, "pendente")
        self.assertIn("Triagem automática", self.professor.verificacao_detalhe)
        self.assertTrue(self.professor.curriculo.name.startswith("curriculos/"))

    def enviar(self, url, campo, nome, conteudo=b"%PDF-1.4 x", extra=None):
        dados = {campo: SimpleUploadedFile(nome, conteudo)}
        dados.update(extra or {})
        return self.client.post(url, dados, format="multipart")

    def test_excluir_curriculo_apaga_arquivo_e_tira_o_professor_das_buscas(self):
        self.enviar("/api/professores/me/curriculo/", "curriculo", "cv.pdf")
        self.professor.refresh_from_db()
        caminho = self.professor.curriculo.path
        self.assertTrue(os.path.exists(caminho))
        # simula que o admin aprovou
        self.professor.status_verificacao = "aprovado"
        self.professor.save()

        resp = self.client.delete("/api/professores/me/curriculo/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["curriculoUrl"])
        self.professor.refresh_from_db()
        self.assertFalse(self.professor.curriculo)
        self.assertEqual(self.professor.status_verificacao, "pendente")
        self.assertFalse(os.path.exists(caminho))
        ids_publicos = [p["id"] for p in APIClient().get("/api/professores/").data]
        self.assertNotIn(self.professor.id, ids_publicos)

    def test_reenviar_curriculo_apaga_o_arquivo_antigo(self):
        self.enviar("/api/professores/me/curriculo/", "curriculo", "errado.pdf")
        self.professor.refresh_from_db()
        antigo = self.professor.curriculo.path
        self.enviar("/api/professores/me/curriculo/", "curriculo", "certo.pdf")
        self.professor.refresh_from_db()
        self.assertFalse(os.path.exists(antigo))
        self.assertTrue(os.path.exists(self.professor.curriculo.path))

    def test_excluir_documento_apaga_arquivo(self):
        self.enviar("/api/professores/me/documento/", "documento", "rg.pdf", extra={"cpf": "12345678901"})
        self.professor.refresh_from_db()
        caminho = self.professor.documento_identidade.path
        resp = self.client.delete("/api/professores/me/documento/")
        self.assertEqual(resp.status_code, 200)
        self.professor.refresh_from_db()
        self.assertFalse(self.professor.documento_identidade)
        self.assertEqual(self.professor.status_documento, "pendente")
        self.assertFalse(os.path.exists(caminho))

    def test_excluir_video_remove_arquivo_e_link(self):
        self.enviar("/api/professores/me/video/", "video", "apresentacao.mp4", conteudo=b"video")
        self.professor.refresh_from_db()
        caminho = self.professor.video_apresentacao.path
        self.professor.video_apresentacao_url = "https://youtube.com/watch?v=abc"
        self.professor.save()
        resp = self.client.delete("/api/professores/me/video/")
        self.assertEqual(resp.status_code, 200)
        self.professor.refresh_from_db()
        self.assertFalse(self.professor.video_apresentacao)
        self.assertEqual(self.professor.video_apresentacao_url, "")
        self.assertFalse(os.path.exists(caminho))

    def test_aluno_nao_pode_excluir_arquivos_de_professor(self):
        cliente_aluno = APIClient()
        cliente_aluno.force_authenticate(criar_aluno().user)
        for tipo in ("curriculo", "documento", "video"):
            self.assertEqual(cliente_aluno.delete(f"/api/professores/me/{tipo}/").status_code, 403)

    def test_curriculo_que_nao_e_pdf_e_recusado(self):
        arquivo = SimpleUploadedFile("cv.docx", b"abc", content_type="application/octet-stream")
        resp = self.client.post("/api/professores/me/curriculo/", {"curriculo": arquivo}, format="multipart")
        self.assertEqual(resp.status_code, 400)


class PerfilProfessorTests(TestCase):
    def setUp(self):
        self.professor = criar_professor(nome="Carlos")
        self.client = APIClient()
        self.client.force_authenticate(self.professor.user)

    def test_professor_edita_o_proprio_nome(self):
        resp = self.client.patch("/api/professores/me/", {"nome": "  Carlos   Eduardo Santos "}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["nome"], "Carlos Eduardo Santos")
        self.professor.user.refresh_from_db()
        self.assertEqual(self.professor.user.first_name, "Carlos")
        self.assertEqual(self.professor.user.last_name, "Eduardo Santos")
        publico = APIClient().get(f"/api/professores/{self.professor.id}/")
        self.assertEqual(publico.data["name"], "Carlos Eduardo Santos")

    def test_professor_salva_telefone_e_ve_email_mas_publico_nao_ve(self):
        resp = self.client.patch("/api/professores/me/", {"telefone": "(11) 98888-7777"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["telefone"], "(11) 98888-7777")
        self.assertEqual(resp.data["email"], "prof@teste.com")
        publico = APIClient().get(f"/api/professores/{self.professor.id}/").data
        self.assertNotIn("telefone", publico)
        self.assertNotIn("98888-7777", str(publico))
        self.assertNotIn("prof@teste.com", str(publico))

    def test_email_nao_pode_ser_alterado_pelo_perfil(self):
        self.client.patch("/api/professores/me/", {"email": "outro@teste.com"}, format="json")
        self.professor.user.refresh_from_db()
        self.assertEqual(self.professor.user.email, "prof@teste.com")

    def test_nome_em_branco_e_recusado(self):
        resp = self.client.patch("/api/professores/me/", {"nome": "   "}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.professor.user.refresh_from_db()
        self.assertEqual(self.professor.user.first_name, "Carlos")


class BuscaProfessoresTests(TestCase):
    """HU14/HU15 + RN10: busca pública só retorna professores aprovados."""

    def setUp(self):
        self.client = APIClient()
        self.aprovado = criar_professor("a@t.com", "Carlos", "aprovado")
        Disciplina.objects.create(nome="Física", professor=self.aprovado)
        self.pendente = criar_professor("b@t.com", "Paula", "pendente")
        Disciplina.objects.create(nome="Física", professor=self.pendente)

    def test_lista_publica_exclui_professores_nao_aprovados(self):
        resp = self.client.get("/api/professores/")
        ids = [p["id"] for p in resp.data]
        self.assertIn(self.aprovado.id, ids)
        self.assertNotIn(self.pendente.id, ids)

    def test_rn10_busca_por_disciplina(self):
        resp = self.client.get("/api/professores/", {"busca": "fís"})
        self.assertEqual([p["id"] for p in resp.data], [self.aprovado.id])

    def test_rn10_busca_por_nome(self):
        resp = self.client.get("/api/professores/", {"busca": "carl"})
        self.assertEqual([p["id"] for p in resp.data], [self.aprovado.id])

    def test_detalhe_de_professor_pendente_retorna_404(self):
        self.assertEqual(self.client.get(f"/api/professores/{self.pendente.id}/").status_code, 404)


class DisciplinaDisponibilidadeTests(TestCase):
    """HU03/HU04/HU05 + RN04: gestão de disciplinas e janelas de disponibilidade."""

    def setUp(self):
        self.professor = criar_professor()
        self.client = APIClient()
        self.client.force_authenticate(self.professor.user)
        resp = self.client.post("/api/disciplinas/", {"nome": "Química", "descricao": ""}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.disciplina_id = resp.data["id"]

    def criar_janela(self, dia="segunda", inicio="10:00", fim="12:00"):
        return self.client.post(
            "/api/disponibilidades/",
            {"disciplina": self.disciplina_id, "dia_semana": dia, "horario_inicio": inicio, "horario_fim": fim},
            format="json",
        )

    def test_cadastrar_janela_de_disponibilidade(self):
        resp = self.criar_janela()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Disponibilidade.objects.filter(professor=self.professor).count(), 1)

    def test_rn04_janela_sobreposta_no_mesmo_dia_e_recusada(self):
        self.criar_janela("segunda", "10:00", "12:00")
        resp = self.criar_janela("segunda", "11:00", "13:00")
        self.assertEqual(resp.status_code, 400)

    def test_mesma_janela_em_outra_disciplina_e_permitida(self):
        self.criar_janela("segunda", "10:00", "12:00")
        outra = self.client.post("/api/disciplinas/", {"nome": "Física", "descricao": ""}, format="json").data["id"]
        resp = self.client.post(
            "/api/disponibilidades/",
            {"disciplina": outra, "dia_semana": "segunda", "horario_inicio": "10:00", "horario_fim": "12:00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(Disponibilidade.objects.filter(professor=self.professor, dia_semana="segunda").count(), 2)

    def test_janelas_em_dias_diferentes_sao_permitidas(self):
        self.criar_janela("segunda", "10:00", "12:00")
        self.assertEqual(self.criar_janela("terca", "10:00", "12:00").status_code, 201)

    def test_horario_fim_antes_do_inicio_e_recusado(self):
        self.assertEqual(self.criar_janela("quarta", "15:00", "14:00").status_code, 400)

    def test_editar_janela_sem_aulas(self):
        janela_id = self.criar_janela().data["id"]
        resp = self.client.patch(f"/api/disponibilidades/{janela_id}/", {"horario_fim": "13:00"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Disponibilidade.objects.get(pk=janela_id).horario_fim, datetime.time(13, 0))

    def test_nao_remove_janela_com_aula_ativa(self):
        janela = Disponibilidade.objects.get(pk=self.criar_janela().data["id"])
        Agendamento.objects.create(
            aluno=criar_aluno(), professor=self.professor, disciplina=janela.disciplina,
            disponibilidade=janela, data=datetime.date.today() + datetime.timedelta(days=7),
            horario=datetime.time(10, 0), status="confirmado",
        )
        self.assertEqual(self.client.delete(f"/api/disponibilidades/{janela.id}/").status_code, 400)
        self.assertTrue(Disponibilidade.objects.filter(pk=janela.id).exists())

    def test_aluno_nao_pode_cadastrar_disciplina(self):
        cliente_aluno = APIClient()
        cliente_aluno.force_authenticate(criar_aluno().user)
        resp = cliente_aluno.post("/api/disciplinas/", {"nome": "X"}, format="json")
        self.assertEqual(resp.status_code, 403)


class CarteiraSaqueTests(TestCase):
    """Carteira do professor: saldo = aulas concluídas - saques."""

    def setUp(self):
        self.professor = criar_professor()
        self.professor.chave_pix = "prof@pix.com"
        self.professor.save()
        disciplina = Disciplina.objects.create(nome="Biologia", professor=self.professor)
        janela = Disponibilidade.objects.create(
            professor=self.professor, disciplina=disciplina, dia_semana="segunda",
            horario_inicio=datetime.time(8), horario_fim=datetime.time(18),
        )
        aluno = criar_aluno()
        ontem = datetime.date.today() - datetime.timedelta(days=1)
        for status_aula, valor in (("concluido", "100.00"), ("concluido", "50.00"), ("confirmado", "70.00")):
            aula = Agendamento.objects.create(
                aluno=aluno, professor=self.professor, disciplina=disciplina, disponibilidade=janela,
                data=ontem, horario=datetime.time(9), status=status_aula,
            )
            Pagamento.objects.create(agendamento=aula, valor=Decimal(valor), metodo="PIX", status="aprovado")
        self.client = APIClient()
        self.client.force_authenticate(self.professor.user)

    def test_saldo_considera_so_aulas_concluidas_menos_saques(self):
        self.assertEqual(saldo_disponivel(self.professor), Decimal("150.00"))
        Saque.objects.create(professor=self.professor, valor=Decimal("40.00"), chave_pix_usada="x")
        self.assertEqual(saldo_disponivel(self.professor), Decimal("110.00"))

    def test_carteira_mostra_total_recebido_saldo_e_extrato_em_ordem(self):
        # Aula concluída em agosto (R$ 30) — as de ontem (R$ 100 + R$ 50) vêm do setUp.
        disciplina = Disciplina.objects.get(professor=self.professor)
        janela = Disponibilidade.objects.get(professor=self.professor)
        antiga = Agendamento.objects.create(
            aluno=criar_aluno("antigo@teste.com"), professor=self.professor, disciplina=disciplina,
            disponibilidade=janela, data=datetime.date(2026, 8, 30), horario=datetime.time(9), status="concluido",
        )
        Pagamento.objects.create(agendamento=antiga, valor=Decimal("30.00"), metodo="PIX", status="aprovado")
        self.client.post("/api/professores/me/saques/", {"valor": "100.00"}, format="json")

        c = self.client.get("/api/professores/me/carteira/").data
        self.assertEqual(c["totalGanho"], 180.0)       # 100 + 50 + 30 (a aula só confirmada não conta)
        self.assertEqual(c["totalSacado"], 100.0)
        self.assertEqual(c["saldoDisponivel"], 80.0)   # 180 - 100
        # Mais recente primeiro: o saque de hoje, as aulas de ontem e, por último, a de 30/08.
        self.assertEqual(c["extrato"][0]["tipo"], "saque")
        self.assertEqual(c["extrato"][-1]["data"], "30/08/2026")

    def test_saque_valido_e_registrado(self):
        resp = self.client.post("/api/professores/me/saques/", {"valor": "100.00"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(saldo_disponivel(self.professor), Decimal("50.00"))

    def test_saque_acima_do_saldo_e_recusado(self):
        resp = self.client.post("/api/professores/me/saques/", {"valor": "150.01"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Saque.objects.count(), 0)

    def test_saque_sem_chave_pix_e_recusado(self):
        self.professor.chave_pix = ""
        self.professor.save()
        resp = self.client.post("/api/professores/me/saques/", {"valor": "10.00"}, format="json")
        self.assertEqual(resp.status_code, 400)
