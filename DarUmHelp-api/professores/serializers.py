from rest_framework import serializers

from contas.models import PerfilProfessor, Saque

from .carteira import saldo_disponivel
from .models import Disciplina, Disponibilidade
from .verificacao import get_verificador

AVATAR_PADRAO = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
TAMANHO_MAXIMO_CURRICULO = 5 * 1024 * 1024  # 5MB
TAMANHO_MAXIMO_AVATAR = 5 * 1024 * 1024  # 5MB
TAMANHO_MAXIMO_VIDEO = 50 * 1024 * 1024  # 50MB — suficiente para 1-2min de vídeo
TAMANHO_MAXIMO_DOCUMENTO = 5 * 1024 * 1024  # 5MB
EXTENSOES_AVATAR_PERMITIDAS = ("jpg", "jpeg", "png", "webp")
EXTENSOES_VIDEO_PERMITIDAS = ("mp4", "webm", "mov")
EXTENSOES_DOCUMENTO_PERMITIDAS = ("jpg", "jpeg", "png", "pdf")
DOMINIOS_VIDEO_PERMITIDOS = ("youtube.com", "youtu.be", "vimeo.com")


class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ["id", "nome", "descricao", "professor"]
        read_only_fields = ["professor"]


class DisponibilidadeSerializer(serializers.ModelSerializer):
    disciplinaNome = serializers.CharField(source="disciplina.nome", read_only=True)

    class Meta:
        model = Disponibilidade
        fields = [
            "id",
            "professor",
            "disciplina",
            "disciplinaNome",
            "dia_semana",
            "horario_inicio",
            "horario_fim",
            "status",
        ]
        read_only_fields = ["professor"]

    def validate(self, attrs):
        request = self.context["request"]
        professor = getattr(self.instance, "professor", None) or request.user.perfil_professor

        # RN: uma janela com aula(s) ativa(s) marcada(s) dentro dela não pode ter
        # dia/horário editado (encolher a janela poderia deixar uma aula já
        # marcada fora do novo intervalo). Só pode editar/remover depois que
        # essas aulas forem canceladas/concluídas.
        if self.instance and self.instance.agendamento_set.filter(
            status__in=["pendente", "confirmado"]
        ).exists():
            raise serializers.ValidationError(
                "Não é possível editar uma janela com aula(s) agendada(s) dentro dela."
            )

        inicio = attrs.get("horario_inicio", getattr(self.instance, "horario_inicio", None))
        fim = attrs.get("horario_fim", getattr(self.instance, "horario_fim", None))
        dia = attrs.get("dia_semana", getattr(self.instance, "dia_semana", None))
        disciplina = attrs.get("disciplina", getattr(self.instance, "disciplina", None))

        if inicio and fim and fim <= inicio:
            raise serializers.ValidationError(
                "Horário de fim deve ser depois do horário de início."
            )

        # RN04: professor não pode ter duas janelas sobrepostas da MESMA disciplina no
        # mesmo dia. Disciplinas diferentes podem compartilhar o horário — quem impede
        # duas aulas ao mesmo tempo é a checagem de conflito do agendamento, que olha
        # todas as aulas do professor (ver AgendamentoCreateSerializer).
        conflitos = Disponibilidade.objects.filter(professor=professor, dia_semana=dia, disciplina=disciplina)
        if self.instance:
            conflitos = conflitos.exclude(pk=self.instance.pk)
        for disponibilidade in conflitos:
            if inicio < disponibilidade.horario_fim and fim > disponibilidade.horario_inicio:
                raise serializers.ValidationError(
                    "Você já tem essa disciplina cadastrada num horário que se sobrepõe a esse, nesse dia."
                )

        return attrs


class ProfessorPublicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="pk")
    name = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()
    bio = serializers.CharField(source="biografia")
    metodologia = serializers.CharField(source="metodologia_ensino")
    rating = serializers.SerializerMethodField()
    reviewsCount = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()
    curriculoUrl = serializers.SerializerMethodField()
    videoUrl = serializers.SerializerMethodField()
    identidadeVerificada = serializers.SerializerMethodField()
    aulasConcluidas = serializers.SerializerMethodField()

    class Meta:
        model = PerfilProfessor
        fields = [
            "id",
            "name",
            "subject",
            "subjects",
            "bio",
            "metodologia",
            "rating",
            "reviewsCount",
            "price",
            "avatar",
            "badge",
            "curriculoUrl",
            "videoUrl",
            "identidadeVerificada",
            "aulasConcluidas",
        ]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_subject(self, obj):
        # Texto de exibição no card/cabeçalho: todas as disciplinas, não só a primeira
        # (RN: professor pode lecionar várias matérias — ex: Inglês, Espanhol, Francês).
        nomes = [d.nome for d in obj.disciplinas.all()]
        return ", ".join(nomes) if nomes else "Geral"

    def get_subjects(self, obj):
        # Lista separada, usada pra busca casar com qualquer disciplina do professor.
        return [d.nome for d in obj.disciplinas.all()]

    def get_rating(self, obj):
        return float(obj.avaliacao_media)

    def get_reviewsCount(self, obj):
        return obj.avaliacoes.count()

    def get_price(self, obj):
        return float(obj.preco_hora)

    def get_avatar(self, obj):
        if not obj.avatar:
            return AVATAR_PADRAO
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_badge(self, obj):
        destaque_ids = self.context.get("destaque_ids", set())
        return "Destaque" if obj.pk in destaque_ids else "Verificado"

    def get_curriculoUrl(self, obj):
        # Só professores aprovados chegam a este serializer (ver querysets das
        # views), então mostrar o currículo aqui é seguro: o aluno pode
        # conferir a formação/experiência antes de agendar.
        if not obj.curriculo:
            return None
        request = self.context.get("request")
        url = obj.curriculo.url
        return request.build_absolute_uri(url) if request else url

    def get_videoUrl(self, obj):
        # Prioriza o link (YouTube/Vimeo, mais leve de embutir); usa o
        # arquivo enviado só se não houver link cadastrado.
        if obj.video_apresentacao_url:
            return obj.video_apresentacao_url
        if obj.video_apresentacao:
            request = self.context.get("request")
            url = obj.video_apresentacao.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_identidadeVerificada(self, obj):
        return obj.status_documento == "aprovado"

    def get_aulasConcluidas(self, obj):
        return obj.agendamentos.filter(status="concluido").count()


class MeuPerfilProfessorSerializer(serializers.ModelSerializer):
    """Perfil completo do professor autenticado.

    biografia/preco_hora são editáveis pelo próprio professor via PATCH
    (JSON) em /api/professores/me/. A foto tem upload dedicado em
    /api/professores/me/avatar/ (multipart) — ver AvatarUploadSerializer —
    por isso aqui ela só aparece como avatarUrl, somente leitura. Os campos
    de verificação de currículo também ficam somente leitura: só o admin
    altera via Django Admin.
    """

    # `nome` edita o User (first_name/last_name) por trás — não é campo do
    # PerfilProfessor — por isso o update() é sobrescrito (mesmo padrão do
    # PerfilAlunoSerializer em contas/serializers.py).
    nome = serializers.CharField(required=False, max_length=150)
    email = serializers.EmailField(source="user.email", read_only=True)
    curriculoUrl = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()
    videoApresentacaoArquivoUrl = serializers.SerializerMethodField()
    documentoIdentidadeUrl = serializers.SerializerMethodField()

    class Meta:
        model = PerfilProfessor
        fields = [
            "id",
            "nome",
            "email",
            "telefone",
            "biografia",
            "preco_hora",
            "avatarUrl",
            "status_verificacao",
            "verificacao_detalhe",
            "motivo_rejeicao",
            "verificado_em",
            "curriculoUrl",
            "video_apresentacao_url",
            "videoApresentacaoArquivoUrl",
            "metodologia_ensino",
            "cpf",
            "documentoIdentidadeUrl",
            "status_documento",
            "chave_pix",
        ]
        read_only_fields = [
            "status_verificacao",
            "verificacao_detalhe",
            "motivo_rejeicao",
            "verificado_em",
            "status_documento",
        ]

    def validate_preco_hora(self, value):
        if value <= 0:
            raise serializers.ValidationError("O preço da aula deve ser maior que zero.")
        return value

    def validate_nome(self, value):
        value = " ".join(value.split())
        if not value:
            raise serializers.ValidationError("Informe seu nome.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["nome"] = instance.user.get_full_name() or instance.user.username
        return data

    def update(self, instance, validated_data):
        nome = validated_data.pop("nome", None)
        if nome:
            partes = nome.split(" ", 1)
            instance.user.first_name = partes[0]
            instance.user.last_name = partes[1] if len(partes) > 1 else ""
            instance.user.save(update_fields=["first_name", "last_name"])
        return super().update(instance, validated_data)

    def validate_video_apresentacao_url(self, value):
        if value and not any(dominio in value for dominio in DOMINIOS_VIDEO_PERMITIDOS):
            raise serializers.ValidationError(
                "Use um link do YouTube ou Vimeo, ou envie o arquivo de vídeo diretamente."
            )
        return value

    def get_avatarUrl(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_curriculoUrl(self, obj):
        if not obj.curriculo:
            return None
        request = self.context.get("request")
        url = obj.curriculo.url
        return request.build_absolute_uri(url) if request else url

    def get_videoApresentacaoArquivoUrl(self, obj):
        if not obj.video_apresentacao:
            return None
        request = self.context.get("request")
        url = obj.video_apresentacao.url
        return request.build_absolute_uri(url) if request else url

    def get_documentoIdentidadeUrl(self, obj):
        # RN: só aparece aqui (perfil do próprio professor) — nunca no
        # ProfessorPublicSerializer, já que é um documento de identidade.
        if not obj.documento_identidade:
            return None
        request = self.context.get("request")
        url = obj.documento_identidade.url
        return request.build_absolute_uri(url) if request else url


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.FileField()

    def validate_avatar(self, value):
        extensao = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extensao not in EXTENSOES_AVATAR_PERMITIDAS:
            raise serializers.ValidationError("Envie uma imagem em JPG, PNG ou WEBP.")
        if value.size > TAMANHO_MAXIMO_AVATAR:
            raise serializers.ValidationError("A imagem deve ter no máximo 5MB.")
        return value

    def save(self, **kwargs):
        professor = self.context["request"].user.perfil_professor
        professor.avatar = self.validated_data["avatar"]
        professor.save(update_fields=["avatar"])
        return professor


def apagar_arquivo_antigo(campo_arquivo, nome_antigo):
    """Remove do disco o arquivo que foi substituído (ou excluído), para não
    deixar cópias esquecidas no servidor — importante no documento de identidade."""
    if nome_antigo and nome_antigo != campo_arquivo.name:
        campo_arquivo.storage.delete(nome_antigo)


class CurriculoUploadSerializer(serializers.Serializer):
    curriculo = serializers.FileField()

    def validate_curriculo(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Envie o currículo em formato PDF.")
        if value.size > TAMANHO_MAXIMO_CURRICULO:
            raise serializers.ValidationError("O arquivo deve ter no máximo 5MB.")
        return value

    def save(self, **kwargs):
        professor = self.context["request"].user.perfil_professor
        arquivo = self.validated_data["curriculo"]

        resultado = get_verificador().analisar(professor, arquivo)
        arquivo.seek(0)

        nome_antigo = professor.curriculo.name if professor.curriculo else None
        professor.curriculo = arquivo
        # Toda troca de currículo volta para "pendente": precisa de nova revisão humana.
        professor.status_verificacao = "pendente"
        professor.motivo_rejeicao = ""
        professor.verificado_em = None
        if resultado.alertas:
            professor.verificacao_detalhe = (
                f"{resultado.resumo} (confiança: {resultado.confianca}). Alertas: "
                + "; ".join(resultado.alertas)
            )
        else:
            professor.verificacao_detalhe = f"{resultado.resumo} Nenhum alerta encontrado."
        professor.save(
            update_fields=[
                "curriculo",
                "status_verificacao",
                "motivo_rejeicao",
                "verificacao_detalhe",
                "verificado_em",
            ]
        )
        apagar_arquivo_antigo(professor.curriculo, nome_antigo)
        return professor


class VideoApresentacaoUploadSerializer(serializers.Serializer):
    video = serializers.FileField()

    def validate_video(self, value):
        extensao = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extensao not in EXTENSOES_VIDEO_PERMITIDAS:
            raise serializers.ValidationError("Envie um vídeo em MP4, WEBM ou MOV.")
        if value.size > TAMANHO_MAXIMO_VIDEO:
            raise serializers.ValidationError("O vídeo deve ter no máximo 50MB.")
        return value

    def save(self, **kwargs):
        professor = self.context["request"].user.perfil_professor
        nome_antigo = professor.video_apresentacao.name if professor.video_apresentacao else None
        professor.video_apresentacao = self.validated_data["video"]
        # Upload de arquivo substitui o link, pra não ficar os dois ativos ao mesmo tempo.
        professor.video_apresentacao_url = ""
        professor.save(update_fields=["video_apresentacao", "video_apresentacao_url"])
        apagar_arquivo_antigo(professor.video_apresentacao, nome_antigo)
        return professor


class DocumentoIdentidadeUploadSerializer(serializers.Serializer):
    documento = serializers.FileField()
    cpf = serializers.CharField(required=False, allow_blank=True, max_length=14)

    def validate_documento(self, value):
        extensao = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extensao not in EXTENSOES_DOCUMENTO_PERMITIDAS:
            raise serializers.ValidationError("Envie o documento em JPG, PNG ou PDF.")
        if value.size > TAMANHO_MAXIMO_DOCUMENTO:
            raise serializers.ValidationError("O arquivo deve ter no máximo 5MB.")
        return value

    def validate_cpf(self, value):
        digitos = "".join(filter(str.isdigit, value))
        if digitos and len(digitos) != 11:
            raise serializers.ValidationError("CPF deve ter 11 dígitos.")
        return digitos

    def save(self, **kwargs):
        professor = self.context["request"].user.perfil_professor
        nome_antigo = professor.documento_identidade.name if professor.documento_identidade else None
        professor.documento_identidade = self.validated_data["documento"]
        # Todo novo envio volta para "pendente": precisa de nova revisão manual.
        professor.status_documento = "pendente"
        campos = ["documento_identidade", "status_documento"]
        if self.validated_data.get("cpf"):
            professor.cpf = self.validated_data["cpf"]
            campos.append("cpf")
        professor.save(update_fields=campos)
        apagar_arquivo_antigo(professor.documento_identidade, nome_antigo)
        return professor


class SaqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saque
        fields = ["id", "valor", "chave_pix_usada", "criado_em"]


class SaqueCreateSerializer(serializers.Serializer):
    valor = serializers.DecimalField(max_digits=8, decimal_places=2)

    def validate_valor(self, value):
        if value <= 0:
            raise serializers.ValidationError("O valor do saque deve ser maior que zero.")
        return value

    def validate(self, attrs):
        professor = self.context["request"].user.perfil_professor
        if not professor.chave_pix:
            raise serializers.ValidationError(
                "Cadastre uma chave PIX antes de solicitar um saque."
            )
        if attrs["valor"] > saldo_disponivel(professor):
            raise serializers.ValidationError(
                "O valor do saque não pode ser maior que o saldo disponível."
            )
        return attrs

    def create(self, validated_data):
        professor = self.context["request"].user.perfil_professor
        return Saque.objects.create(
            professor=professor,
            valor=validated_data["valor"],
            chave_pix_usada=professor.chave_pix,
        )
