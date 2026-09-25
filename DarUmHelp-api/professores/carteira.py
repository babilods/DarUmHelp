"""Cálculo da carteira/saldo do professor.

Saldo disponível = soma dos valores pagos em aulas já concluídas - soma dos
saques já realizados. O pagamento e o saque são sempre simulados/instantâneos
nesta plataforma (não há gateway bancário real por trás).
"""

from decimal import Decimal

from django.db.models import Sum

from agendamento.models import Pagamento


def total_ganho(professor):
    total = Pagamento.objects.filter(
        agendamento__professor=professor, agendamento__status="concluido"
    ).aggregate(soma=Sum("valor"))["soma"]
    return total or Decimal("0.00")


def total_sacado(professor):
    total = professor.saques.aggregate(soma=Sum("valor"))["soma"]
    return total or Decimal("0.00")


def saldo_disponivel(professor):
    return total_ganho(professor) - total_sacado(professor)
