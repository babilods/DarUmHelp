from django.contrib import admin
from django.utils import timezone

from .models import PerfilAluno, PerfilProfessor


@admin.register(PerfilProfessor)
class PerfilProfessorAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "preco_hora",
        "avaliacao_media",
        "status_verificacao",
        "criado_em",
    )
    list_filter = ("status_verificacao",)
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
    readonly_fields = ("verificacao_detalhe",)
    actions = ["aprovar_professores", "rejeitar_professores"]

    @admin.action(description="Aprovar professores selecionados")
    def aprovar_professores(self, request, queryset):
        atualizados = queryset.update(
            status_verificacao="aprovado", motivo_rejeicao="", verificado_em=timezone.now()
        )
        self.message_user(request, f"{atualizados} professor(es) aprovado(s).")

    @admin.action(description="Rejeitar professores selecionados")
    def rejeitar_professores(self, request, queryset):
        # O motivo específico da rejeição pode ser detalhado depois, editando
        # o campo "motivo_rejeicao" de cada professor individualmente.
        atualizados = queryset.update(status_verificacao="rejeitado", verificado_em=timezone.now())
        self.message_user(
            request,
            f"{atualizados} professor(es) rejeitado(s). "
            "Edite o campo 'motivo_rejeicao' de cada um para detalhar o motivo.",
        )


@admin.register(PerfilAluno)
class PerfilAlunoAdmin(admin.ModelAdmin):
    list_display = ("user", "criado_em")
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
