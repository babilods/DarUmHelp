"""Regras compartilhadas entre as views REST e os consumers de WebSocket."""

import datetime

from django.db.models import Count, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Agendamento

# Duração padrão quando não informada explicitamente (ver Agendamento.DURACAO_CHOICES
# para as opções que o aluno pode escolher, de 30min até 2h30).
DURACAO_AULA_MINUTOS = 60


def momento_aula(agendamento):
    """Retorna um datetime timezone-aware combinando data + horario da aula."""
    return timezone.make_aware(
        datetime.datetime.combine(agendamento.data, agendamento.horario),
        timezone.get_current_timezone(),
    )


def horario_fim_aula(horario_inicio, duracao_minutos=DURACAO_AULA_MINUTOS):
    """Soma `duracao_minutos` a um horario_inicio (datetime.time), sem envolver data."""
    fim = (
        datetime.datetime.combine(datetime.date.today(), horario_inicio)
        + datetime.timedelta(minutes=duracao_minutos)
    ).time()
    return fim


def aula_terminou(agendamento):
    """Já passou do horário de término (início + duração da aula)?"""
    fim = momento_aula(agendamento) + datetime.timedelta(minutes=agendamento.duracao_minutos)
    return timezone.now() >= fim


def horas_restantes(agendamento):
    delta = momento_aula(agendamento) - timezone.now()
    return delta.total_seconds() / 3600


def usuario_participa(agendamento, user):
    if not getattr(user, "is_authenticated", False):
        return False
    return (
        hasattr(user, "perfil_aluno") and agendamento.aluno.user_id == user.id
    ) or (hasattr(user, "perfil_professor") and agendamento.professor.user_id == user.id)


def get_agendamento_para_usuario(pk, user):
    """Busca o agendamento e garante que `user` é aluno ou professor dele.

    Levanta Http404 (via get_object_or_404) se não existir, ou
    PermissionDenied (403) se o usuário não participa daquele agendamento.
    Usada tanto por MensagemListCreateView quanto pelos consumers realtime,
    para manter a regra de "só participantes" em um único lugar.
    """
    agendamento = get_object_or_404(Agendamento, pk=pk)

    # RN09: mensagens/sala sempre associadas ao agendamento, só entre os participantes.
    if not usuario_participa(agendamento, user):
        raise PermissionDenied("Você não participa deste agendamento.")

    return agendamento


def _campo_leitura(user):
    """Qual coluna de "lido até" pertence a esse usuário (aluno ou professor)."""
    if hasattr(user, "perfil_professor"):
        return "chat_lido_professor_em"
    if hasattr(user, "perfil_aluno"):
        return "chat_lido_aluno_em"
    return None


def marcar_chat_lido(agendamento, user):
    campo = _campo_leitura(user)
    if campo:
        Agendamento.objects.filter(pk=agendamento.pk).update(**{campo: timezone.now()})


def mensagens_nao_lidas(user):
    """{agendamento_id: quantidade} de mensagens do OUTRO participante que
    chegaram depois da última vez que `user` abriu o chat de cada aula."""
    campo = _campo_leitura(user)
    if campo is None:
        return {}
    if campo == "chat_lido_professor_em":
        aulas = Agendamento.objects.filter(professor=user.perfil_professor)
    else:
        aulas = Agendamento.objects.filter(aluno=user.perfil_aluno)

    nova = Q(**{f"{campo}__isnull": True}) | Q(mensagens__criado_em__gt=F(campo))
    aulas = aulas.annotate(
        nao_lidas=Count("mensagens", filter=nova & ~Q(mensagens__remetente=user))
    ).filter(nao_lidas__gt=0)
    return {a.id: a.nao_lidas for a in aulas}
