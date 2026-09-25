from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from contas.models import PerfilProfessor, Saque

from .carteira import saldo_disponivel, total_ganho, total_sacado
from .models import Disciplina, Disponibilidade
from .serializers import (
    AvatarUploadSerializer,
    CurriculoUploadSerializer,
    DisciplinaSerializer,
    DisponibilidadeSerializer,
    DocumentoIdentidadeUploadSerializer,
    MeuPerfilProfessorSerializer,
    ProfessorPublicSerializer,
    SaqueCreateSerializer,
    SaqueSerializer,
    VideoApresentacaoUploadSerializer,
)

TOP_DESTAQUE = 3


def _destaque_ids():
    # RN08: professores em destaque = maior número de agendamentos concluídos.
    qs = (
        PerfilProfessor.objects.annotate(
            concluidos=Count("agendamentos", filter=Q(agendamentos__status="concluido"))
        )
        .filter(concluidos__gt=0)
        .order_by("-concluidos")[:TOP_DESTAQUE]
    )
    return set(qs.values_list("id", flat=True))


class ProfessorListView(generics.ListAPIView):
    serializer_class = ProfessorPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Só professores com currículo aprovado por um revisor aparecem publicamente.
        qs = (
            PerfilProfessor.objects.filter(status_verificacao="aprovado")
            .select_related("user")
            .prefetch_related("disciplinas")
        )
        busca = self.request.query_params.get("busca")
        if busca:  # RN10: busca por nome do professor ou disciplina.
            qs = qs.filter(
                Q(user__first_name__icontains=busca)
                | Q(user__last_name__icontains=busca)
                | Q(disciplinas__nome__icontains=busca)
            ).distinct()
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["destaque_ids"] = _destaque_ids()
        return context


class ProfessorDetailView(generics.RetrieveAPIView):
    queryset = (
        PerfilProfessor.objects.filter(status_verificacao="aprovado")
        .select_related("user")
        .prefetch_related("disciplinas")
    )
    serializer_class = ProfessorPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["destaque_ids"] = _destaque_ids()
        return context


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def professores_destaque(request):
    ids = _destaque_ids()
    qs = (
        PerfilProfessor.objects.filter(id__in=ids, status_verificacao="aprovado")
        .select_related("user")
        .prefetch_related("disciplinas")
    )
    serializer = ProfessorPublicSerializer(qs, many=True, context={"destaque_ids": ids, "request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def disponibilidades_do_professor(request, professor_id):
    # RN11: só professor aprovado tem horários públicos para agendamento.
    qs = Disponibilidade.objects.filter(
        professor_id=professor_id, status="disponivel", professor__status_verificacao="aprovado"
    ).select_related("disciplina")
    serializer = DisponibilidadeSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def horarios_ocupados(request, disponibilidade_id):
    """Faixas de horário já reservadas numa janela, numa data específica.

    Usado pelo front pra avisar o aluno JÁ na hora de escolher o horário que
    aquele intervalo está ocupado — em vez de só descobrir isso depois, ao
    tentar confirmar o pagamento. Não expõe quem reservou, só os horários
    (a checagem que realmente impede o conflito continua sendo feita no
    backend, em AgendamentoCreateSerializer, sob lock — isto aqui é só UX).
    """
    from agendamento.models import Agendamento
    from agendamento.services import horario_fim_aula

    data = request.query_params.get("data")
    if not data:
        return Response({"detail": "Informe o parâmetro 'data' (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

    disponibilidade = get_object_or_404(Disponibilidade, pk=disponibilidade_id)

    # O professor é um só: uma aula de outra disciplina no mesmo horário também ocupa.
    agendamentos = Agendamento.objects.filter(
        professor_id=disponibilidade.professor_id,
        data=data,
        status__in=["pendente", "confirmado"],
    )

    ocupados = [
        {
            "horario": ag.horario.strftime("%H:%M"),
            "horarioFim": horario_fim_aula(ag.horario, ag.duracao_minutos).strftime("%H:%M"),
        }
        for ag in agendamentos
    ]
    return Response(ocupados)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def avaliacoes_do_professor(request, professor_id):
    from agendamento.models import Avaliacao
    from agendamento.serializers import AvaliacaoSerializer

    get_object_or_404(PerfilProfessor, pk=professor_id)
    qs = (
        Avaliacao.objects.filter(professor_id=professor_id)
        .select_related("aluno__user")
        .order_by("-criado_em")
    )
    serializer = AvaliacaoSerializer(qs, many=True)
    return Response(serializer.data)


class MeuPerfilProfessorView(generics.RetrieveUpdateAPIView):
    """GET retorna o perfil completo do professor logado; PATCH/PUT edita
    biografia/preco_hora/avatar (os campos de verificação de currículo
    permanecem somente leitura, só o admin altera via Django Admin)."""

    serializer_class = MeuPerfilProfessorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if not hasattr(self.request.user, "perfil_professor"):
            raise PermissionDenied("Apenas professores têm perfil profissional.")
        return self.request.user.perfil_professor


class CurriculoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not hasattr(request.user, "perfil_professor"):
            return Response(
                {"detail": "Apenas professores podem enviar currículo."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CurriculoUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        professor = serializer.save()

        output = MeuPerfilProfessorSerializer(professor, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Exclui o currículo (ex.: enviou o arquivo errado). Sem currículo o
        professor volta para "pendente" e sai das buscas até enviar outro e ser aprovado."""
        professor = getattr(request.user, "perfil_professor", None)
        if professor is None:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if professor.curriculo:
            professor.curriculo.delete(save=False)
        professor.curriculo = None
        professor.status_verificacao = "pendente"
        professor.verificacao_detalhe = ""
        professor.motivo_rejeicao = ""
        professor.verificado_em = None
        professor.save(update_fields=[
            "curriculo", "status_verificacao", "verificacao_detalhe", "motivo_rejeicao", "verificado_em",
        ])
        return Response(MeuPerfilProfessorSerializer(professor, context={"request": request}).data)

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not hasattr(request.user, "perfil_professor"):
            return Response(
                {"detail": "Apenas professores podem enviar foto de perfil."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AvatarUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        professor = serializer.save()

        output = MeuPerfilProfessorSerializer(professor, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class VideoApresentacaoUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not hasattr(request.user, "perfil_professor"):
            return Response(
                {"detail": "Apenas professores podem enviar vídeo de apresentação."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = VideoApresentacaoUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        professor = serializer.save()

        output = MeuPerfilProfessorSerializer(professor, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Remove o vídeo de apresentação (arquivo enviado e link)."""
        professor = getattr(request.user, "perfil_professor", None)
        if professor is None:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if professor.video_apresentacao:
            professor.video_apresentacao.delete(save=False)
        professor.video_apresentacao = None
        professor.video_apresentacao_url = ""
        professor.save(update_fields=["video_apresentacao", "video_apresentacao_url"])
        return Response(MeuPerfilProfessorSerializer(professor, context={"request": request}).data)

class DocumentoIdentidadeUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not hasattr(request.user, "perfil_professor"):
            return Response(
                {"detail": "Apenas professores podem enviar documento de identificação."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DocumentoIdentidadeUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        professor = serializer.save()

        output = MeuPerfilProfessorSerializer(professor, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Exclui o documento de identidade (o arquivo é apagado do servidor)."""
        professor = getattr(request.user, "perfil_professor", None)
        if professor is None:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if professor.documento_identidade:
            professor.documento_identidade.delete(save=False)
        professor.documento_identidade = None
        professor.status_documento = "pendente"
        professor.save(update_fields=["documento_identidade", "status_documento"])
        return Response(MeuPerfilProfessorSerializer(professor, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def minha_carteira(request):
    if not hasattr(request.user, "perfil_professor"):
        return Response(
            {"detail": "Apenas professores têm carteira financeira."},
            status=status.HTTP_403_FORBIDDEN,
        )

    professor = request.user.perfil_professor

    aulas_concluidas = (
        professor.agendamentos.filter(status="concluido")
        .select_related("aluno__user", "pagamento")
        .order_by("-data", "-horario")
    )
    extrato = [
        {
            "tipo": "recebimento",
            "descricao": f"Aula com {a.aluno.user.get_full_name() or a.aluno.user.username}",
            "valor": float(a.pagamento.valor) if hasattr(a, "pagamento") else 0.0,
            "data": a.data.strftime("%d/%m/%Y"),
        }
        for a in aulas_concluidas
    ] + [
        {
            "tipo": "saque",
            "descricao": f"Saque via PIX ({s.chave_pix_usada})",
            "valor": float(s.valor),
            "data": s.criado_em.strftime("%d/%m/%Y"),
        }
        for s in professor.saques.all()
    ]
    extrato.sort(key=lambda item: item["data"], reverse=True)

    return Response(
        {
            "saldoDisponivel": float(saldo_disponivel(professor)),
            "totalGanho": float(total_ganho(professor)),
            "totalSacado": float(total_sacado(professor)),
            "extrato": extrato,
        }
    )


class MeusSaquesView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return SaqueCreateSerializer if self.request.method == "POST" else SaqueSerializer

    def get_queryset(self):
        if not hasattr(self.request.user, "perfil_professor"):
            return Saque.objects.none()
        return Saque.objects.filter(professor=self.request.user.perfil_professor)

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, "perfil_professor"):
            return Response(
                {"detail": "Apenas professores podem solicitar saques."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saque = serializer.save()
        output = SaqueSerializer(saque)
        return Response(output.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def minhas_estatisticas(request):
    if not hasattr(request.user, "perfil_professor"):
        return Response(
            {"detail": "Apenas professores têm estatísticas de desempenho."},
            status=status.HTTP_403_FORBIDDEN,
        )

    professor = request.user.perfil_professor
    agendamentos = professor.agendamentos.all()

    aulas_concluidas = agendamentos.filter(status="concluido").count()
    alunos_atendidos = agendamentos.filter(status="concluido").values("aluno_id").distinct().count()

    # Taxa de resposta: entre as aulas em que o aluno mandou mensagem, em
    # quantas o professor também respondeu pelo menos uma vez.
    agendamentos_com_msg_aluno = agendamentos.filter(
        mensagens__remetente__perfil_aluno__isnull=False
    ).distinct()
    total_conversas = agendamentos_com_msg_aluno.count()
    conversas_respondidas = agendamentos_com_msg_aluno.filter(
        mensagens__remetente__perfil_professor=professor
    ).distinct().count()
    taxa_resposta = (
        round((conversas_respondidas / total_conversas) * 100) if total_conversas else None
    )

    return Response(
        {
            "aulasConcluidas": aulas_concluidas,
            "alunosAtendidos": alunos_atendidos,
            "taxaResposta": taxa_resposta,
            "avaliacaoMedia": float(professor.avaliacao_media),
            "totalAvaliacoes": professor.avaliacoes.count(),
        }
    )


class IsProfessorOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and hasattr(request.user, "perfil_professor")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.professor.user_id == request.user.id


class DisciplinaViewSet(viewsets.ModelViewSet):
    serializer_class = DisciplinaSerializer
    permission_classes = [IsProfessorOwnerOrReadOnly]

    def get_queryset(self):
        return Disciplina.objects.select_related("professor")

    def perform_create(self, serializer):
        serializer.save(professor=self.request.user.perfil_professor)

    def perform_destroy(self, instance):
        # Evita apagar (e derrubar em cascata, via FK) disciplinas que já têm
        # aulas agendadas/concluídas associadas a alguma disponibilidade dela.
        if instance.agendamento_set.exists():
            raise ValidationError(
                "Não é possível remover uma disciplina que já tem aulas agendadas. "
                "Cancele ou aguarde a conclusão dessas aulas primeiro."
            )
        instance.delete()


class DisponibilidadeViewSet(viewsets.ModelViewSet):
    serializer_class = DisponibilidadeSerializer
    permission_classes = [IsProfessorOwnerOrReadOnly]

    def get_queryset(self):
        return Disponibilidade.objects.select_related("professor", "disciplina")

    def perform_create(self, serializer):
        serializer.save(professor=self.request.user.perfil_professor)

    def perform_destroy(self, instance):
        # RN: nunca apagar uma janela com aula(s) ativa(s) marcada(s) dentro dela
        # (a FK Agendamento -> Disponibilidade é CASCADE, então apagar aqui
        # derrubaria a aula do aluno junto). Uma janela pode ter vários horários
        # agendados dentro dela, então checamos por qualquer aula ativa, não um
        # status único.
        if instance.agendamento_set.filter(status__in=["pendente", "confirmado"]).exists():
            raise ValidationError(
                "Não é possível remover uma janela com aula(s) agendada(s) dentro dela. "
                "Cancele as aulas primeiro."
            )
        instance.delete()
