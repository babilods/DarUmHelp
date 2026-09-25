from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Agendamento, DenunciaMensagem, Mensagem
from .moderacao import get_moderador
from .serializers import (
    formatar_reais,
    AgendamentoCreateSerializer,
    AgendamentoSerializer,
    AvaliacaoCreateSerializer,
    AvaliacaoSerializer,
    DenunciaMensagemInputSerializer,
    MensagemSerializer,
)
from .services import (
    aula_terminou,
    get_agendamento_para_usuario,
    horas_restantes,
    marcar_chat_lido,
    mensagens_nao_lidas,
)

MENSAGEM_MODERACAO_BLOQUEADA = (
    "⚠️ Essa mensagem não pode ser enviada porque viola as regras de uso do DarUmHelp."
)


def _agendamentos_do_usuario(user):
    if hasattr(user, "perfil_professor"):
        return Agendamento.objects.filter(professor=user.perfil_professor)
    if hasattr(user, "perfil_aluno"):
        return Agendamento.objects.filter(aluno=user.perfil_aluno)
    return Agendamento.objects.none()


class AgendamentoListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return AgendamentoCreateSerializer if self.request.method == "POST" else AgendamentoSerializer

    def get_queryset(self):
        return (
            _agendamentos_do_usuario(self.request.user)
            .select_related("aluno__user", "professor__user", "disciplina", "pagamento")
            .order_by("-criado_em")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agendamento = serializer.save()
        output = AgendamentoSerializer(agendamento, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)


class AgendamentoDetailView(generics.RetrieveAPIView):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _agendamentos_do_usuario(self.request.user).select_related(
            "aluno__user", "professor__user", "disciplina", "pagamento"
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancelar_agendamento(request, pk):
    with transaction.atomic():
        agendamento = get_object_or_404(
            Agendamento.objects.select_for_update().select_related("pagamento", "disponibilidade"),
            pk=pk,
        )
        user = request.user

        eh_aluno = hasattr(user, "perfil_aluno") and agendamento.aluno_id == user.perfil_aluno.id
        eh_professor = (
            hasattr(user, "perfil_professor")
            and agendamento.professor_id == user.perfil_professor.id
        )

        # RN05: só aluno ou professor responsável pode cancelar.
        if not (eh_aluno or eh_professor):
            return Response(
                {"mensagem": "Você não tem permissão para cancelar esta aula."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if agendamento.status in ("cancelado", "concluido"):
            return Response(
                {"mensagem": "Esta aula já estava cancelada ou concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # RN: aula que já começou (ou terminou) não pode mais ser cancelada — senão
        # o professor poderia "cancelar" uma aula dada e devolver 100% ao aluno.
        if horas_restantes(agendamento) <= 0:
            return Response(
                {"mensagem": "Esta aula já começou ou terminou e não pode mais ser cancelada. "
                             "O professor deve marcá-la como concluída ou registrar o não comparecimento."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pagamento = getattr(agendamento, "pagamento", None)

        if eh_professor:
            motivo = "cancelado_professor"
            percentual = Decimal(100)
        else:
            motivo = "cancelado_aluno"
            # RN05: regra fixa da plataforma — cancelamento do aluno com pelo
            # menos 24h de antecedência tem reembolso integral; depois disso,
            # sem reembolso. Falta do professor sempre reembolsa 100%.
            percentual = Decimal(100) if horas_restantes(agendamento) >= 24 else Decimal(0)

        agendamento.status = "cancelado"
        agendamento.motivo_cancelamento = motivo
        agendamento.cancelado_por = user
        agendamento.cancelado_em = timezone.now()
        agendamento.save(
            update_fields=["status", "motivo_cancelamento", "cancelado_por", "cancelado_em"]
        )

        if pagamento is not None:
            pagamento.percentual_reembolso = percentual
            pagamento.valor_reembolsado = (pagamento.valor * percentual / Decimal(100)).quantize(
                Decimal("0.01")
            )
            # 0% (aluno com menos de 24h) não é "reembolso solicitado": é sem direito.
            pagamento.status_reembolso = "solicitado" if percentual > 0 else "sem_direito"
            pagamento.reembolsado_em = timezone.now()
            pagamento.save(
                update_fields=[
                    "percentual_reembolso",
                    "valor_reembolsado",
                    "status_reembolso",
                    "reembolsado_em",
                ]
            )

        # Nota: `disponibilidade.status` não é mais tocado aqui — desde que a
        # janela de disponibilidade passou a comportar múltiplos horários
        # (ver AgendamentoCreateSerializer), esse campo é só o professor quem
        # controla (disponivel/indisponivel), nunca as ações de aluno/cancelamento.

    if pagamento is None:
        mensagem = "Aula cancelada."
    elif percentual == 0:
        mensagem = "Aula cancelada sem direito a reembolso (menos de 24h de antecedência)."
    else:
        valor = formatar_reais(pagamento.valor_reembolsado)
        if eh_professor:
            mensagem = f"Aula cancelada. O aluno receberá o reembolso integral de {valor}."
        else:
            mensagem = f"Aula cancelada. Você receberá o reembolso integral de {valor} (100% do valor pago)."
    output = AgendamentoSerializer(agendamento, context={"request": request})
    return Response({"mensagem": mensagem, "agendamento": output.data})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def marcar_no_show(request, pk):
    with transaction.atomic():
        agendamento = get_object_or_404(
            Agendamento.objects.select_for_update().select_related("pagamento", "disponibilidade"),
            pk=pk,
        )
        user = request.user

        eh_professor = (
            hasattr(user, "perfil_professor")
            and agendamento.professor_id == user.perfil_professor.id
        )
        if not eh_professor:
            return Response(
                {"mensagem": "Apenas o professor responsável pode marcar não comparecimento."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if agendamento.status in ("cancelado", "concluido"):
            return Response(
                {"mensagem": "Esta aula já estava cancelada ou concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if horas_restantes(agendamento) >= 0:
            return Response(
                {"mensagem": "Só é possível marcar não comparecimento após o horário da aula."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        agendamento.status = "cancelado"
        agendamento.motivo_cancelamento = "no_show"
        agendamento.cancelado_por = user
        agendamento.cancelado_em = timezone.now()
        agendamento.save(
            update_fields=["status", "motivo_cancelamento", "cancelado_por", "cancelado_em"]
        )

        pagamento = getattr(agendamento, "pagamento", None)
        if pagamento is not None:
            pagamento.percentual_reembolso = Decimal(0)
            pagamento.valor_reembolsado = Decimal(0)
            pagamento.status_reembolso = "sem_direito"
            pagamento.reembolsado_em = timezone.now()
            pagamento.save(
                update_fields=[
                    "percentual_reembolso",
                    "valor_reembolsado",
                    "status_reembolso",
                    "reembolsado_em",
                ]
            )

    output = AgendamentoSerializer(agendamento, context={"request": request})
    return Response({"mensagem": "Sem direito a reembolso", "agendamento": output.data})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def marcar_concluido(request, pk):
    with transaction.atomic():
        agendamento = get_object_or_404(
            Agendamento.objects.select_for_update(), pk=pk
        )
        user = request.user

        eh_professor = (
            hasattr(user, "perfil_professor")
            and agendamento.professor_id == user.perfil_professor.id
        )
        if not eh_professor:
            return Response(
                {"mensagem": "Apenas o professor responsável pode concluir a aula."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if agendamento.status in ("cancelado", "concluido"):
            return Response(
                {"mensagem": "Esta aula já estava cancelada ou concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if horas_restantes(agendamento) >= 0:
            return Response(
                {"mensagem": "Só é possível concluir a aula após o horário previsto."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        agendamento.status = "concluido"
        agendamento.save(update_fields=["status"])

    output = AgendamentoSerializer(agendamento, context={"request": request})
    return Response({"mensagem": "Aula marcada como concluída.", "agendamento": output.data})


class MensagemListCreateView(generics.ListCreateAPIView):
    serializer_class = MensagemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_agendamento(self):
        return get_agendamento_para_usuario(self.kwargs["pk"], self.request.user)

    def get_queryset(self):
        return self.get_agendamento().mensagens.select_related(
            "remetente__perfil_professor", "remetente__perfil_aluno"
        )

    def list(self, request, *args, **kwargs):
        # Abrir o chat (carregar o histórico) = leu tudo até agora.
        resposta = super().list(request, *args, **kwargs)
        marcar_chat_lido(self.get_agendamento(), request.user)
        return resposta

    def create(self, request, *args, **kwargs):
        agendamento = self.get_agendamento()
        # RN: depois que a aula termina (horário encerrado, concluída) ou é
        # cancelada, a conversa fica só para leitura — ninguém envia mensagem nova.
        if agendamento.status in ("cancelado", "concluido") or aula_terminou(agendamento):
            return Response(
                {"mensagem": "Esta aula já foi encerrada. A conversa fica disponível apenas para leitura."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = get_moderador().analisar(serializer.validated_data["texto"])
        if not resultado.aprovado:
            return Response({"mensagem": MENSAGEM_MODERACAO_BLOQUEADA}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(agendamento=agendamento, remetente=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def marcar_mensagens_lidas(request, pk):
    """Chamado pelo front quando chega mensagem com o chat aberto (via WebSocket)."""
    marcar_chat_lido(get_agendamento_para_usuario(pk, request.user), request.user)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def mensagens_nao_lidas_view(request):
    """Resumo para o aviso de mensagem nova: total e quantidade por aula."""
    por_aula = mensagens_nao_lidas(request.user)
    return Response({"total": sum(por_aula.values()), "porAula": {str(k): v for k, v in por_aula.items()}})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def denunciar_mensagem(request, pk, mensagem_id):
    agendamento = get_agendamento_para_usuario(pk, request.user)
    mensagem = get_object_or_404(Mensagem, pk=mensagem_id, agendamento=agendamento)

    if mensagem.remetente_id == request.user.id:
        return Response(
            {"mensagem": "Não é possível denunciar sua própria mensagem."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entrada = DenunciaMensagemInputSerializer(data=request.data)
    entrada.is_valid(raise_exception=True)

    DenunciaMensagem.objects.create(
        mensagem=mensagem,
        agendamento=agendamento,
        denunciante=request.user,
        denunciado=mensagem.remetente,
        texto_mensagem_snapshot=mensagem.texto,
        motivo=entrada.validated_data["motivo"],
        detalhes=entrada.validated_data.get("detalhes", ""),
    )

    return Response({"mensagem": "Denúncia registrada com sucesso."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def avaliar_agendamento(request, pk):
    agendamento = get_agendamento_para_usuario(pk, request.user)

    serializer = AvaliacaoCreateSerializer(
        data=request.data, context={"request": request, "agendamento": agendamento}
    )
    serializer.is_valid(raise_exception=True)
    avaliacao = serializer.save()

    return Response(AvaliacaoSerializer(avaliacao).data, status=status.HTTP_201_CREATED)
