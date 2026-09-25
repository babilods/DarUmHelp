import re

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from professores.serializers import AVATAR_PADRAO

from .models import CartaoSalvo, Favorito, PerfilAluno, PerfilProfessor

MAX_MATERIAS_INTERESSE = 10


def _nome_para_first_last(nome):
    partes = nome.strip().split(" ", 1)
    first_name = partes[0]
    last_name = partes[1] if len(partes) > 1 else ""
    return first_name, last_name


def usuario_para_payload(user):
    if user.is_superuser:
        role = "admin"
    elif hasattr(user, "perfil_professor"):
        role = "teacher"
    elif hasattr(user, "perfil_aluno"):
        role = "student"
    else:
        role = None

    return {
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "role": role,
    }


class RegistroSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)
    tipo = serializers.ChoiceField(choices=["student", "teacher"])

    def validate_email(self, value):
        # RN01: não permitir cadastro de dois usuários com o mesmo e-mail.
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Já existe uma conta cadastrada com este e-mail.")
        return value

    def validate_senha(self, value):
        # RN06: formato/robustez de senha via validadores nativos do Django.
        validate_password(value)
        return value

    def create(self, validated_data):
        first_name, last_name = _nome_para_first_last(validated_data["nome"])
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["senha"],
            first_name=first_name,
            last_name=last_name,
        )

        if validated_data["tipo"] == "teacher":
            PerfilProfessor.objects.create(user=user)
        else:
            PerfilAluno.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            self.context["request"], username=attrs["email"], password=attrs["senha"]
        )
        if user is None:
            raise serializers.ValidationError("E-mail ou senha inválidos.")
        attrs["user"] = user
        return attrs


class AlterarEmailSerializer(serializers.Serializer):
    """Troca o e-mail do usuário logado (aluno ou professor).

    O e-mail também é o login (username = e-mail, ver RegistroSerializer), então
    os dois mudam juntos. Exige a senha atual: sem isso, quem pegasse uma sessão
    esquecida aberta poderia tomar a conta trocando o e-mail.
    """

    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate_senha(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        user = self.context["request"].user
        # RN01: e-mail único, sem diferenciar maiúsculas/minúsculas.
        em_uso = User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists() or (
            User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists()
        )
        if em_uso:
            raise serializers.ValidationError("Já existe uma conta cadastrada com este e-mail.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.email = self.validated_data["email"]
        user.username = self.validated_data["email"]
        user.save(update_fields=["email", "username"])
        return user


class PerfilAlunoSerializer(serializers.ModelSerializer):
    """Perfil editável do aluno logado: nome, um pouco sobre si e foto.

    `nome` edita o User (first_name/last_name) por trás — não é um campo do
    model PerfilAluno — por isso o update() é sobrescrito. A foto tem upload
    dedicado em /api/contas/aluno/me/avatar/ (ver AvatarUploadSerializer),
    por isso aqui ela só aparece como avatarUrl, somente leitura.
    """

    nome = serializers.CharField(required=False, max_length=150)
    email = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = PerfilAluno
        fields = [
            "id",
            "nome",
            "email",
            "telefone",
            "sobre",
            "avatarUrl",
            "nivel_academico",
            "objetivo",
            "materias_interesse",
        ]

    def get_email(self, obj):
        return obj.user.email

    def get_avatarUrl(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def validate_materias_interesse(self, value):
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError("Envie uma lista de nomes de matérias.")
        if len(value) > MAX_MATERIAS_INTERESSE:
            raise serializers.ValidationError(
                f"Escolha no máximo {MAX_MATERIAS_INTERESSE} matérias de interesse."
            )
        return [item.strip() for item in value if item.strip()]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["nome"] = instance.user.get_full_name() or instance.user.username
        return data

    def update(self, instance, validated_data):
        nome = validated_data.pop("nome", None)
        if nome:
            first_name, last_name = _nome_para_first_last(nome)
            instance.user.first_name = first_name
            instance.user.last_name = last_name
            instance.user.save(update_fields=["first_name", "last_name"])
        return super().update(instance, validated_data)


class AlunoAvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.FileField()

    EXTENSOES_PERMITIDAS = ("jpg", "jpeg", "png", "webp")
    TAMANHO_MAXIMO = 5 * 1024 * 1024  # 5MB

    def validate_avatar(self, value):
        extensao = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extensao not in self.EXTENSOES_PERMITIDAS:
            raise serializers.ValidationError("Envie uma imagem em JPG, PNG ou WEBP.")
        if value.size > self.TAMANHO_MAXIMO:
            raise serializers.ValidationError("A imagem deve ter no máximo 5MB.")
        return value

    def save(self, **kwargs):
        aluno = self.context["request"].user.perfil_aluno
        aluno.avatar = self.validated_data["avatar"]
        aluno.save(update_fields=["avatar"])
        return aluno


class FavoritoProfessorSerializer(serializers.Serializer):
    """Resumo do professor favoritado, para a lista 'Meus Favoritos' do aluno."""

    favoritoId = serializers.IntegerField(source="pk")
    id = serializers.IntegerField(source="professor.pk")
    name = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.professor.user.get_full_name() or obj.professor.user.username

    def get_subject(self, obj):
        disciplina = next(iter(obj.professor.disciplinas.all()), None)
        return disciplina.nome if disciplina else "Geral"

    def get_price(self, obj):
        return float(obj.professor.preco_hora)

    def get_rating(self, obj):
        return float(obj.professor.avaliacao_media)

    def get_avatar(self, obj):
        if not obj.professor.avatar:
            return AVATAR_PADRAO
        request = self.context.get("request")
        url = obj.professor.avatar.url
        return request.build_absolute_uri(url) if request else url


class FavoritoCreateSerializer(serializers.Serializer):
    professor = serializers.PrimaryKeyRelatedField(
        queryset=PerfilProfessor.objects.filter(status_verificacao="aprovado")
    )

    def create(self, validated_data):
        request = self.context["request"]
        favorito, _criado = Favorito.objects.get_or_create(
            aluno=request.user.perfil_aluno, professor=validated_data["professor"]
        )
        return favorito


class CartaoSalvoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartaoSalvo
        fields = ["id", "apelido", "bandeira", "ultimos_digitos", "validade", "criado_em"]

    def validate_ultimos_digitos(self, value):
        if not (value.isdigit() and len(value) == 4):
            raise serializers.ValidationError("Informe exatamente os 4 últimos dígitos do cartão.")
        return value

    def validate_validade(self, value):
        if not re.match(r"^(0[1-9]|1[0-2])/\d{4}$", value):
            raise serializers.ValidationError("Use o formato MM/AAAA.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        if not hasattr(request.user, "perfil_aluno"):
            raise serializers.ValidationError("Apenas alunos podem salvar cartões.")
        return CartaoSalvo.objects.create(aluno=request.user.perfil_aluno, **validated_data)
