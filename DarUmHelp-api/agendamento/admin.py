from django.contrib import admin

from .models import Agendamento, Avaliacao, DenunciaMensagem, Mensagem, Pagamento


@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "aluno",
        "professor",
        "disciplina",
        "data",
        "horario",
        "status",
        "motivo_cancelamento",
    )
    list_filter = ("status", "motivo_cancelamento", "data")


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "agendamento",
        "valor",
        "metodo",
        "status",
        "status_reembolso",
        "valor_reembolsado",
        "criado_em",
    )
    list_filter = ("status", "status_reembolso")


@admin.register(Mensagem)
class MensagemAdmin(admin.ModelAdmin):
    list_display = ("id", "agendamento", "remetente", "criado_em")


@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "professor", "aluno", "nota", "criado_em")
    list_filter = ("nota",)
    search_fields = ("professor__user__first_name", "professor__user__last_name", "comentario")


@admin.register(DenunciaMensagem)
class DenunciaMensagemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "agendamento",
        "denunciante",
        "denunciado",
        "motivo",
        "status",
        "criado_em",
    )
    list_filter = ("status", "motivo", "criado_em")
    readonly_fields = ("texto_mensagem_snapshot", "criado_em")
