from django.db import models

from contas.models import PerfilProfessor


class Disciplina(models.Model):
    nome = models.CharField(max_length=100)
    professor = models.ForeignKey(
        PerfilProfessor, on_delete=models.CASCADE, related_name="disciplinas"
    )
    descricao = models.TextField(blank=True)

    def __str__(self):
        return self.nome


class Disponibilidade(models.Model):
    DIA_SEMANA_CHOICES = [
        ("segunda", "Segunda"),
        ("terca", "Terça"),
        ("quarta", "Quarta"),
        ("quinta", "Quinta"),
        ("sexta", "Sexta"),
        ("sabado", "Sábado"),
        ("domingo", "Domingo"),
    ]
    STATUS_CHOICES = [
        ("disponivel", "Disponível"),
        ("reservado", "Reservado"),
        ("indisponivel", "Indisponível"),
    ]

    professor = models.ForeignKey(
        PerfilProfessor, on_delete=models.CASCADE, related_name="disponibilidades"
    )
    disciplina = models.ForeignKey(
        Disciplina, on_delete=models.CASCADE, related_name="disponibilidades"
    )
    dia_semana = models.CharField(max_length=20, choices=DIA_SEMANA_CHOICES)
    horario_inicio = models.TimeField()
    horario_fim = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="disponivel")

    class Meta:
        # Mesma janela pode existir para disciplinas diferentes (o professor atende
        # várias matérias no mesmo horário); o que não pode é repetir a disciplina.
        unique_together = ("professor", "disciplina", "dia_semana", "horario_inicio")

    def __str__(self):
        return f"{self.professor} - {self.dia_semana} {self.horario_inicio}"
