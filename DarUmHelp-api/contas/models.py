import uuid

from django.conf import settings
from django.db import models


def caminho_curriculo(instance, filename):
    # Nome aleatório: evita expor nome real do arquivo/professor na URL pública do arquivo.
    extensao = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    return f"curriculos/{uuid.uuid4().hex}.{extensao}"


def caminho_avatar(instance, filename):
    extensao = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"avatars/{uuid.uuid4().hex}.{extensao}"


def caminho_video_apresentacao(instance, filename):
    extensao = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
    return f"videos/{uuid.uuid4().hex}.{extensao}"


def caminho_documento_identidade(instance, filename):
    # Nome aleatório: este arquivo é sensível (RG/CNH) e nunca é exposto
    # publicamente (ver ProfessorPublicSerializer, que nunca inclui esse campo).
    extensao = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    return f"documentos/{uuid.uuid4().hex}.{extensao}"


class PerfilProfessor(models.Model):
    STATUS_VERIFICACAO_CHOICES = [
        ("pendente", "Pendente"),
        ("aprovado", "Aprovado"),
        ("rejeitado", "Rejeitado"),
    ]

    STATUS_DOCUMENTO_CHOICES = [
        ("pendente", "Pendente"),
        ("aprovado", "Aprovado"),
        ("rejeitado", "Rejeitado"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_professor",
    )
    biografia = models.TextField(blank=True)
    preco_hora = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    avatar = models.FileField(upload_to=caminho_avatar, blank=True, null=True)
    avaliacao_media = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    criado_em = models.DateTimeField(auto_now_add=True)

    # Verificação de currículo (RN: só professor com status "aprovado" aparece
    # nas buscas/pode ser agendado). Ver professores/verificacao.py.
    curriculo = models.FileField(upload_to=caminho_curriculo, blank=True, null=True)
    status_verificacao = models.CharField(
        max_length=20, choices=STATUS_VERIFICACAO_CHOICES, default="pendente"
    )
    verificacao_detalhe = models.TextField(blank=True)
    motivo_rejeicao = models.TextField(blank=True)
    verificado_em = models.DateTimeField(null=True, blank=True)

    # Vídeo de apresentação (1-2min): o professor escolhe um link do
    # YouTube/Vimeo OU faz upload de um arquivo — os dois campos são opcionais,
    # o front mostra o que estiver preenchido (prioridade pro link, mais leve).
    video_apresentacao_url = models.URLField(blank=True)
    video_apresentacao = models.FileField(
        upload_to=caminho_video_apresentacao, blank=True, null=True
    )

    # Como o professor conduz a aula (ex: resolução de exercícios, mapas
    # mentais, teoria do zero) — texto livre mostrado no perfil público.
    metodologia_ensino = models.TextField(blank=True)

    # Documento de identificação (RG/CNH) + CPF, usados só para reduzir
    # perfis fake — RN: nunca expostos no serializer público, só no "me" do
    # próprio professor e no Django Admin (revisão manual, como o currículo
    # era antes do verificador automático).
    cpf = models.CharField(max_length=14, blank=True)
    documento_identidade = models.FileField(
        upload_to=caminho_documento_identidade, blank=True, null=True
    )
    status_documento = models.CharField(
        max_length=20, choices=STATUS_DOCUMENTO_CHOICES, default="pendente"
    )

    # Repasse: chave PIX cadastrada pelo professor para receber os saques.
    chave_pix = models.CharField(max_length=150, blank=True)

    # Contato do professor — RN: nunca exposto no serializer público (a
    # plataforma proíbe combinar aulas por fora; ver moderacao.py), só no
    # "me" do próprio professor e no Django Admin, como o do aluno.
    telefone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class Saque(models.Model):
    """Saque do saldo disponível na carteira do professor.

    O pagamento nesta plataforma é sempre simulado (ver Pagamento em
    agendamento/models.py), então o saque também é instantâneo — não existe
    estado "pendente"/"processando" de um gateway bancário real.
    """

    professor = models.ForeignKey(PerfilProfessor, on_delete=models.CASCADE, related_name="saques")
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    chave_pix_usada = models.CharField(max_length=150)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Saque de R$ {self.valor} - {self.professor}"


class PerfilAluno(models.Model):
    NIVEL_ACADEMICO_CHOICES = [
        ("fundamental", "Ensino Fundamental"),
        ("medio", "Ensino Médio"),
        ("graduacao", "Graduação"),
        ("pos_graduacao", "Pós-graduação"),
        ("outro", "Outro"),
    ]

    OBJETIVO_CHOICES = [
        ("reforco_escolar", "Reforço escolar"),
        ("vestibular_enem", "Vestibular / ENEM"),
        ("concurso_publico", "Concurso público"),
        ("idioma", "Aprender um idioma"),
        ("curso_superior", "Apoio em disciplina da faculdade"),
        ("desenvolvimento_profissional", "Desenvolvimento profissional"),
        ("hobby_interesse_pessoal", "Hobby / interesse pessoal"),
        ("outro", "Outro"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_aluno",
    )
    sobre = models.TextField(blank=True)
    avatar = models.FileField(upload_to=caminho_avatar, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True)

    # Preferências de estudo — usadas para o aluno se descrever melhor e,
    # futuramente, para recomendar professores mais alinhados ao perfil dele.
    nivel_academico = models.CharField(
        max_length=20, choices=NIVEL_ACADEMICO_CHOICES, blank=True
    )
    objetivo = models.CharField(max_length=30, choices=OBJETIVO_CHOICES, blank=True)
    materias_interesse = models.JSONField(default=list, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class Favorito(models.Model):
    """Professor que um aluno salvou para achar mais fácil depois."""

    aluno = models.ForeignKey(PerfilAluno, on_delete=models.CASCADE, related_name="favoritos")
    professor = models.ForeignKey(
        PerfilProfessor, on_delete=models.CASCADE, related_name="favoritado_por"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("aluno", "professor")
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.aluno} favoritou {self.professor}"


class CartaoSalvo(models.Model):
    """Cartão salvo pelo aluno para pagamento mais rápido.

    RN: nunca armazenar número completo do cartão nem CVV — só os dados
    necessários para exibir um cartão "guardado" na tela (como qualquer
    app bancário faz), já que o pagamento em si é sempre simulado
    (ver Pagamento em agendamento/models.py).
    """

    BANDEIRA_CHOICES = [
        ("visa", "Visa"),
        ("mastercard", "Mastercard"),
        ("elo", "Elo"),
        ("amex", "American Express"),
        ("outro", "Outro"),
    ]

    aluno = models.ForeignKey(PerfilAluno, on_delete=models.CASCADE, related_name="cartoes")
    apelido = models.CharField(max_length=50, blank=True)
    bandeira = models.CharField(max_length=20, choices=BANDEIRA_CHOICES, default="outro")
    ultimos_digitos = models.CharField(max_length=4)
    validade = models.CharField(max_length=7)  # "MM/AAAA", só para exibição
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.get_bandeira_display()} •••• {self.ultimos_digitos}"
