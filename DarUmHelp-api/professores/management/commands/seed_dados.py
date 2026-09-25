from datetime import time

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from agendamento.models import Agendamento, Pagamento
from contas.models import PerfilAluno, PerfilProfessor
from professores.models import Disciplina, Disponibilidade

PROFESSORES = [
    {
        "username": "ana.silva@darumhelp.com",
        "first_name": "Ana",
        "last_name": "Silva",
        "disciplina": "Matemática",
        "bio": "Professora de Matemática há 8 anos, especialista em preparação para vestibular.",
        "preco_hora": 60,
        "avaliacao_media": 4.9,
    },
    {
        "username": "carlos.souza@darumhelp.com",
        "first_name": "Carlos",
        "last_name": "Souza",
        "disciplina": "Física",
        "bio": "Engenheiro e professor de Física, foco em reforço escolar do ensino médio.",
        "preco_hora": 55,
        "avaliacao_media": 4.7,
    },
    {
        "username": "beatriz.lima@darumhelp.com",
        "first_name": "Beatriz",
        "last_name": "Lima",
        "disciplina": "Programação & Python",
        "bio": "Desenvolvedora e professora de programação, aulas para iniciantes e avançados.",
        "preco_hora": 70,
        "avaliacao_media": 5.0,
    },
    {
        "username": "joao.pereira@darumhelp.com",
        "first_name": "João",
        "last_name": "Pereira",
        "disciplina": "Inglês",
        "bio": "Professor de Inglês certificado, conversação e preparação para provas.",
        "preco_hora": 50,
        "avaliacao_media": 4.8,
    },
]

ALUNOS = [
    {"username": "maria.aluna@darumhelp.com", "first_name": "Maria", "last_name": "Souza"},
    {"username": "pedro.aluno@darumhelp.com", "first_name": "Pedro", "last_name": "Alves"},
    {"username": "julia.aluna@darumhelp.com", "first_name": "Julia", "last_name": "Costa"},
]

SENHA_PADRAO = "DarUmHelp123"
DIAS = ["segunda", "quarta", "sexta"]


class Command(BaseCommand):
    help = "Popula o banco com professores, alunos, disciplinas, disponibilidades e agendamentos de exemplo."

    @transaction.atomic
    def handle(self, *args, **options):
        professores_criados = []

        for dados in PROFESSORES:
            user, created = User.objects.get_or_create(
                username=dados["username"],
                defaults={
                    "email": dados["username"],
                    "first_name": dados["first_name"],
                    "last_name": dados["last_name"],
                },
            )
            if created:
                user.set_password(SENHA_PADRAO)
                user.save()

            perfil, _ = PerfilProfessor.objects.get_or_create(
                user=user,
                defaults={
                    "biografia": dados["bio"],
                    "preco_hora": dados["preco_hora"],
                    "avaliacao_media": dados["avaliacao_media"],
                },
            )

            disciplina, _ = Disciplina.objects.get_or_create(
                professor=perfil,
                nome=dados["disciplina"],
                defaults={"descricao": f"Aulas de {dados['disciplina']} sob medida."},
            )

            for i, dia in enumerate(DIAS):
                Disponibilidade.objects.get_or_create(
                    professor=perfil,
                    dia_semana=dia,
                    horario_inicio=time(9 + i * 2, 0),
                    defaults={
                        "disciplina": disciplina,
                        "horario_fim": time(10 + i * 2, 0),
                        "status": "disponivel",
                    },
                )

            professores_criados.append((perfil, disciplina))

        alunos_criados = []
        for dados in ALUNOS:
            user, created = User.objects.get_or_create(
                username=dados["username"],
                defaults={
                    "email": dados["username"],
                    "first_name": dados["first_name"],
                    "last_name": dados["last_name"],
                },
            )
            if created:
                user.set_password(SENHA_PADRAO)
                user.save()

            perfil, _ = PerfilAluno.objects.get_or_create(user=user)
            alunos_criados.append(perfil)

        # Um par de agendamentos já concluídos, para o RN08 (professores em destaque) ter dado pra exibir.
        professor_destaque, disciplina_destaque = professores_criados[0]
        disponibilidade_destaque = professor_destaque.disponibilidades.first()

        for aluno in alunos_criados[:2]:
            agendamento, created = Agendamento.objects.get_or_create(
                aluno=aluno,
                professor=professor_destaque,
                disciplina=disciplina_destaque,
                disponibilidade=disponibilidade_destaque,
                data="2026-08-01",
                horario=disponibilidade_destaque.horario_inicio,
                defaults={"conteudo": "Aula de exemplo (seed)", "status": "concluido"},
            )
            if created:
                Pagamento.objects.create(
                    agendamento=agendamento,
                    valor=professor_destaque.preco_hora,
                    status="aprovado",
                    codigo_pix="00020126360014BR.GOV.BCB.PIX0114+551199999999952040000",
                )

        self.stdout.write(self.style.SUCCESS("Dados de exemplo criados/atualizados com sucesso."))
        self.stdout.write(f"Senha padrão para todos os usuários de exemplo: {SENHA_PADRAO}")
