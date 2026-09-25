from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartaoSalvo, Favorito
from .serializers import (
    AlterarEmailSerializer,
    AlunoAvatarUploadSerializer,
    CartaoSalvoSerializer,
    FavoritoCreateSerializer,
    FavoritoProfessorSerializer,
    LoginSerializer,
    PerfilAlunoSerializer,
    RegistroSerializer,
    usuario_para_payload,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def registro(request):
    serializer = RegistroSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    login(request, user)
    return Response(usuario_para_payload(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    login(request, user)
    return Response(usuario_para_payload(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def me(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Não autenticado."}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(usuario_para_payload(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def alterar_email(request):
    serializer = AlterarEmailSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(usuario_para_payload(user))


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    return Response({"csrfToken": get_token(request)})


class MeuPerfilAlunoView(generics.RetrieveUpdateAPIView):
    """GET retorna o perfil do aluno logado; PATCH/PUT edita nome/sobre.
    A foto tem upload dedicado em /api/contas/aluno/me/avatar/."""

    serializer_class = PerfilAlunoSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if not hasattr(self.request.user, "perfil_aluno"):
            raise PermissionDenied("Apenas alunos têm esse perfil.")
        return self.request.user.perfil_aluno


class AlunoAvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not hasattr(request.user, "perfil_aluno"):
            return Response(
                {"detail": "Apenas alunos podem enviar foto de perfil."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AlunoAvatarUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        aluno = serializer.save()

        output = PerfilAlunoSerializer(aluno, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class MeusFavoritosView(generics.ListAPIView):
    """Lista os professores que o aluno logado salvou como favoritos."""

    serializer_class = FavoritoProfessorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, "perfil_aluno"):
            return Favorito.objects.none()
        # RN11: professor rejeitado/pendente some também dos favoritos.
        return Favorito.objects.filter(
            aluno=self.request.user.perfil_aluno, professor__status_verificacao="aprovado"
        ).select_related("professor__user").prefetch_related("professor__disciplinas")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def adicionar_favorito(request):
    if not hasattr(request.user, "perfil_aluno"):
        return Response(
            {"detail": "Apenas alunos podem favoritar professores."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = FavoritoCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    favorito = serializer.save()

    output = FavoritoProfessorSerializer(favorito, context={"request": request})
    return Response(output.data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remover_favorito(request, professor_id):
    if not hasattr(request.user, "perfil_aluno"):
        return Response(status=status.HTTP_403_FORBIDDEN)

    Favorito.objects.filter(
        aluno=request.user.perfil_aluno, professor_id=professor_id
    ).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class CartoesSalvosView(generics.ListCreateAPIView):
    """Lista/cria os cartões salvos pelo aluno logado (dados fictícios de exibição)."""

    serializer_class = CartaoSalvoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, "perfil_aluno"):
            return CartaoSalvo.objects.none()
        return CartaoSalvo.objects.filter(aluno=self.request.user.perfil_aluno)


class CartaoSalvoDetailView(generics.DestroyAPIView):
    serializer_class = CartaoSalvoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, "perfil_aluno"):
            return CartaoSalvo.objects.none()
        return CartaoSalvo.objects.filter(aluno=self.request.user.perfil_aluno)
