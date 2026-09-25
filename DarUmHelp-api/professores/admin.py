from django.contrib import admin

from .models import Disciplina, Disponibilidade


@admin.register(Disciplina)
class DisciplinaAdmin(admin.ModelAdmin):
    list_display = ("nome", "professor")
    search_fields = ("nome", "professor__user__first_name", "professor__user__last_name")


@admin.register(Disponibilidade)
class DisponibilidadeAdmin(admin.ModelAdmin):
    list_display = ("professor", "disciplina", "dia_semana", "horario_inicio", "horario_fim", "status")
    list_filter = ("dia_semana", "status")
