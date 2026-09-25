from django.db import migrations
from django.utils import timezone


def aprovar_existentes(apps, schema_editor):
    # Professores cadastrados antes da verificação de currículo existir não devem
    # sumir do site: consideramos "aprovado" (grandfathering) até serem revisados.
    PerfilProfessor = apps.get_model("contas", "PerfilProfessor")
    PerfilProfessor.objects.filter(status_verificacao="pendente").update(
        status_verificacao="aprovado", verificado_em=timezone.now()
    )


def reverter(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("contas", "0002_perfilprofessor_curriculo_and_more"),
    ]

    operations = [
        migrations.RunPython(aprovar_existentes, reverter),
    ]
