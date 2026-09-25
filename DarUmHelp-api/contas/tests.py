from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from .models import PerfilAluno, PerfilProfessor

SENHA_FORTE = "Estudo@2026forte"


class RegistroLoginTests(TestCase):
    """HU01/HU02/HU08/HU09 + RN01/RN06: cadastro e autenticação."""

    def setUp(self):
        self.client = APIClient()

    def registrar(self, email="ana@teste.com", tipo="student", senha=SENHA_FORTE):
        return self.client.post(
            "/api/contas/registro/",
            {"nome": "Ana Souza", "email": email, "senha": senha, "tipo": tipo},
            format="json",
        )

    def test_cadastro_aluno_cria_usuario_e_perfil_aluno(self):
        resp = self.registrar()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["role"], "student")
        user = User.objects.get(email="ana@teste.com")
        self.assertTrue(PerfilAluno.objects.filter(user=user).exists())
        self.assertEqual(user.first_name, "Ana")
        self.assertEqual(user.last_name, "Souza")

    def test_cadastro_professor_cria_perfil_professor_pendente(self):
        resp = self.registrar(email="prof@teste.com", tipo="teacher")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["role"], "teacher")
        perfil = PerfilProfessor.objects.get(user__email="prof@teste.com")
        self.assertEqual(perfil.status_verificacao, "pendente")

    def test_senha_e_armazenada_com_hash(self):
        self.registrar()
        user = User.objects.get(email="ana@teste.com")
        self.assertNotEqual(user.password, SENHA_FORTE)
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(SENHA_FORTE))

    def test_rn01_email_duplicado_e_recusado(self):
        self.registrar()
        resp = self.registrar(email="ANA@teste.com")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", resp.data)
        self.assertEqual(User.objects.filter(email__iexact="ana@teste.com").count(), 1)

    def test_rn06_email_invalido_e_recusado(self):
        resp = self.registrar(email="nao-e-email")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", resp.data)

    def test_rn06_senha_fraca_e_recusada(self):
        resp = self.registrar(senha="123")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("senha", resp.data)

    def test_login_com_credenciais_validas(self):
        self.registrar()
        self.client.post("/api/contas/logout/")
        resp = self.client.post(
            "/api/contas/login/", {"email": "ana@teste.com", "senha": SENHA_FORTE}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        me = self.client.get("/api/contas/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["email"], "ana@teste.com")

    def test_login_com_senha_errada_e_recusado(self):
        self.registrar()
        self.client.post("/api/contas/logout/")
        resp = self.client.post(
            "/api/contas/login/", {"email": "ana@teste.com", "senha": "errada"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(self.client.get("/api/contas/me/").status_code, 401)


class AlterarEmailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("ana@teste.com", "ana@teste.com", SENHA_FORTE, first_name="Ana")
        PerfilAluno.objects.create(user=self.user)
        User.objects.create_user("outro@teste.com", "outro@teste.com", SENHA_FORTE)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def trocar(self, email, senha=SENHA_FORTE):
        return self.client.post("/api/contas/me/email/", {"email": email, "senha": senha}, format="json")

    def test_troca_email_e_passa_a_logar_com_o_novo(self):
        resp = self.trocar("Ana.Nova@Teste.com")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["email"], "ana.nova@teste.com")
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "ana.nova@teste.com")
        c = APIClient()
        self.assertEqual(c.post("/api/contas/login/", {"email": "ana.nova@teste.com", "senha": SENHA_FORTE}, format="json").status_code, 200)
        self.assertEqual(c.post("/api/contas/login/", {"email": "ana@teste.com", "senha": SENHA_FORTE}, format="json").status_code, 400)

    def test_senha_errada_nao_troca(self):
        self.assertEqual(self.trocar("ana.nova@teste.com", senha="errada").status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "ana@teste.com")

    def test_email_de_outra_conta_e_recusado(self):
        resp = self.trocar("OUTRO@teste.com")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", resp.data)

    def test_email_invalido_e_recusado(self):
        self.assertEqual(self.trocar("nao-e-email").status_code, 400)

    def test_professor_tambem_pode_trocar(self):
        prof = User.objects.create_user("prof@teste.com", "prof@teste.com", SENHA_FORTE)
        PerfilProfessor.objects.create(user=prof)
        c = APIClient()
        c.force_authenticate(prof)
        resp = c.post("/api/contas/me/email/", {"email": "prof2@teste.com", "senha": SENHA_FORTE}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["role"], "teacher")

    def test_sem_login_nao_pode(self):
        self.assertEqual(APIClient().post("/api/contas/me/email/", {"email": "x@t.com", "senha": "x"}, format="json").status_code, 403)


class PerfilAlunoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        user = User.objects.create_user("bia@teste.com", "bia@teste.com", SENHA_FORTE, first_name="Bia")
        self.aluno = PerfilAluno.objects.create(user=user)
        user2 = User.objects.create_user("p@teste.com", "p@teste.com", SENHA_FORTE)
        self.professor = PerfilProfessor.objects.create(user=user2, status_verificacao="aprovado")
        self.client.force_authenticate(user)

    def test_editar_perfil_aluno_atualiza_nome_e_preferencias(self):
        resp = self.client.patch(
            "/api/contas/aluno/me/",
            {"nome": "Beatriz Lima", "objetivo": "vestibular_enem", "sobre": "Quero passar no ENEM"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.aluno.refresh_from_db()
        self.aluno.user.refresh_from_db()
        self.assertEqual(self.aluno.user.get_full_name(), "Beatriz Lima")
        self.assertEqual(self.aluno.objetivo, "vestibular_enem")

    def test_favoritar_e_desfavoritar_professor(self):
        resp = self.client.post(
            "/api/contas/aluno/me/favoritos/adicionar/", {"professor": self.professor.id}, format="json"
        )
        self.assertIn(resp.status_code, (200, 201))
        self.assertEqual(self.aluno.favoritos.count(), 1)
        resp = self.client.delete(f"/api/contas/aluno/me/favoritos/{self.professor.id}/")
        self.assertIn(resp.status_code, (200, 204))
        self.assertEqual(self.aluno.favoritos.count(), 0)
