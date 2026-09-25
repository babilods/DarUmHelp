from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from contas.models import PerfilAluno, PerfilProfessor
from professores.models import Disciplina, Disponibilidade


class Agendamento(models.Model):
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("confirmado", "Confirmado"),
        ("cancelado", "Cancelado"),
        ("concluido", "Concluído"),
    ]

    MOTIVO_CANCELAMENTO_CHOICES = [
        ("cancelado_aluno", "Cancelado pelo aluno"),
        ("cancelado_professor", "Cancelado pelo professor"),
        ("no_show", "Não comparecimento (no-show)"),
    ]

    # RN: duração escolhida pelo aluno na hora de agendar (até 2h30, em
    # incrementos de 30min) — o preço é proporcional ao preco_hora do professor.
    DURACAO_CHOICES = [
        (30, "30 minutos"),
        (60, "1 hora"),
        (90, "1h30"),
        (120, "2 horas"),
        (150, "2h30"),
    ]

    aluno = models.ForeignKey(PerfilAluno, on_delete=models.CASCADE, related_name="agendamentos")
    professor = models.ForeignKey(
        PerfilProfessor, on_delete=models.CASCADE, related_name="agendamentos"
    )
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    disponibilidade = models.ForeignKey(Disponibilidade, on_delete=models.CASCADE)
    data = models.DateField()
    horario = models.TimeField()
    duracao_minutos = models.PositiveSmallIntegerField(choices=DURACAO_CHOICES, default=60)
    conteudo = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    criado_em = models.DateTimeField(auto_now_add=True)

    cancelado_em = models.DateTimeField(null=True, blank=True)
    cancelado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agendamentos_cancelados",
    )
    motivo_cancelamento = models.CharField(
        max_length=30, choices=MOTIVO_CANCELAMENTO_CHOICES, blank=True
    )

    # Até quando cada participante já leu o chat desta aula — mensagens do
    # outro participante criadas depois disso contam como "não lidas" (ver
    # services.mensagens_nao_lidas). Null = nunca abriu o chat.
    chat_lido_aluno_em = models.DateTimeField(null=True, blank=True)
    chat_lido_professor_em = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.aluno} com {self.professor} em {self.data}"


class Pagamento(models.Model):
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("aprovado", "Aprovado"),
        ("recusado", "Recusado"),
    ]

    METODO_CHOICES = [
        ("PIX", "PIX"),
        ("cartao", "Cartão de Crédito"),
        ("boleto", "Boleto Bancário"),
    ]

    STATUS_REEMBOLSO_CHOICES = [
        ("nao_aplicavel", "Não aplicável"),
        ("solicitado", "Solicitado"),
        ("sem_direito", "Sem direito a reembolso"),
    ]

    agendamento = models.OneToOneField(
        Agendamento, on_delete=models.CASCADE, related_name="pagamento"
    )
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    metodo = models.CharField(max_length=20, choices=METODO_CHOICES, default="PIX")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="aprovado")
    codigo_pix = models.CharField(max_length=255, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    percentual_reembolso = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    valor_reembolsado = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    status_reembolso = models.CharField(
        max_length=20, choices=STATUS_REEMBOLSO_CHOICES, default="nao_aplicavel"
    )
    reembolsado_em = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Pagamento #{self.id} - {self.agendamento}"


class Mensagem(models.Model):
    agendamento = models.ForeignKey(
        Agendamento, on_delete=models.CASCADE, related_name="mensagens"
    )
    remetente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    texto = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["criado_em"]

    def __str__(self):
        return f"Mensagem de {self.remetente} em {self.agendamento}"


class Avaliacao(models.Model):
    """Avaliação de um aluno sobre o professor, referente a uma aula concluída.

    Uma avaliação por agendamento (RN: só depois que a aula foi concluída,
    só quem participou como aluno pode avaliar).
    """

    agendamento = models.OneToOneField(
        Agendamento, on_delete=models.CASCADE, related_name="avaliacao"
    )
    aluno = models.ForeignKey(
        PerfilAluno, on_delete=models.CASCADE, related_name="avaliacoes_feitas"
    )
    professor = models.ForeignKey(
        PerfilProfessor, on_delete=models.CASCADE, related_name="avaliacoes"
    )
    nota = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Avaliação de {self.aluno} para {self.professor} ({self.nota}/5)"


class DenunciaMensagem(models.Model):
    MOTIVO_CHOICES = [
        ("ofensa_assedio", "Ofensa/Assédio"),
        ("ameaca", "Ameaça"),
        ("conteudo_sexual", "Conteúdo sexual impróprio"),
        ("discriminacao", "Discriminação"),
        ("contato_externo", "Tentativa de contato fora da plataforma"),
        ("outro", "Outro"),
    ]

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("em_analise", "Em análise"),
        ("resolvida", "Resolvida"),
        ("rejeitada", "Rejeitada"),
    ]

    mensagem = models.ForeignKey(
        Mensagem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="denuncias",
    )
    agendamento = models.ForeignKey(
        Agendamento, on_delete=models.CASCADE, related_name="denuncias_mensagens"
    )
    denunciante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="denuncias_feitas",
    )
    denunciado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="denuncias_recebidas",
    )
    texto_mensagem_snapshot = models.TextField()
    motivo = models.CharField(max_length=30, choices=MOTIVO_CHOICES)
    detalhes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    criado_em = models.DateTimeField(auto_now_add=True)
    resolvido_em = models.DateTimeField(null=True, blank=True)
    resolvido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="denuncias_resolvidas",
    )

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Denúncia #{self.id} - {self.agendamento}"
