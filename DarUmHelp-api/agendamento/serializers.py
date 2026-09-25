import datetime
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from professores.models import Disponibilidade
from professores.serializers import AVATAR_PADRAO

from .models import Agendamento, Avaliacao, DenunciaMensagem, Mensagem, Pagamento
from .moderacao import get_moderador
from .services import horario_fim_aula, horas_restantes

CODIGO_PIX_DEMO = "00020126360014BR.GOV.BCB.PIX0114+551199999999952040000"

# RN: a aula pode ser marcada para o mesmo dia, mas precisa começar pelo menos
# esse tempo depois do momento do agendamento (o professor precisa de tempo
# para ver a aula) — isso também impede agendar horários que já passaram.
ANTECEDENCIA_MINIMA_MINUTOS = 60

# date.weekday(): 0=segunda ... 6=domingo — usado para validar que a data
# escolhida cai no mesmo dia da semana da disponibilidade selecionada.
DIA_SEMANA_WEEKDAY = {
    "segunda": 0,
    "terca": 1,
    "quarta": 2,
    "quinta": 3,
    "sexta": 4,
    "sabado": 5,
    "domingo": 6,
}

def formatar_reais(valor):
    """Decimal -> "R$ 80,00" (formato brasileiro, para mensagens ao usuário)."""
    return f"R$ {valor:.2f}".replace(".", ",")


class AgendamentoSerializer(serializers.ModelSerializer):
    studentName = serializers.SerializerMethodField()
    studentEmail = serializers.SerializerMethodField()
    studentAvatar = serializers.SerializerMethodField()
    teacherId = serializers.IntegerField(source="professor_id")
    teacherName = serializers.SerializerMethodField()
    teacherAvatar = serializers.SerializerMethodField()
    subject = serializers.CharField(source="disciplina.nome")
    content = serializers.CharField(source="conteudo")
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    endTime = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    paymentMethod = serializers.SerializerMethodField()
    motivoCancelamento = serializers.CharField(source="motivo_cancelamento", read_only=True)
    refundStatus = serializers.SerializerMethodField()
    refundPercentage = serializers.SerializerMethodField()
    refundAmount = serializers.SerializerMethodField()
    canCancel = serializers.SerializerMethodField()
    canMarkNoShow = serializers.SerializerMethodField()
    canMarkConcluido = serializers.SerializerMethodField()
    canAvaliar = serializers.SerializerMethodField()
    avaliacao = serializers.SerializerMethodField()

    class Meta:
        model = Agendamento
        fields = [
            "id",
            "studentName",
            "studentEmail",
            "studentAvatar",
            "teacherId",
            "teacherName",
            "teacherAvatar",
            "subject",
            "content",
            "date",
            "time",
            "endTime",
            "price",
            "paymentMethod",
            "status",
            "motivoCancelamento",
            "refundStatus",
            "refundPercentage",
            "refundAmount",
            "canCancel",
            "canMarkNoShow",
            "canMarkConcluido",
            "canAvaliar",
            "avaliacao",
        ]

    def get_studentName(self, obj):
        return obj.aluno.user.get_full_name() or obj.aluno.user.username

    def get_studentEmail(self, obj):
        return obj.aluno.user.email

    def get_studentAvatar(self, obj):
        # None = aluno sem foto: o front mostra as iniciais do nome.
        if not obj.aluno.avatar:
            return None
        request = self.context.get("request")
        url = obj.aluno.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_teacherName(self, obj):
        return obj.professor.user.get_full_name() or obj.professor.user.username

    def get_teacherAvatar(self, obj):
        if not obj.professor.avatar:
            return AVATAR_PADRAO
        request = self.context.get("request")
        url = obj.professor.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_date(self, obj):
        return obj.data.strftime("%d/%m/%Y")

    def get_time(self, obj):
        return obj.horario.strftime("%H:%M")

    def get_endTime(self, obj):
        return horario_fim_aula(obj.horario, obj.duracao_minutos).strftime("%H:%M")

    def get_price(self, obj):
        pagamento = getattr(obj, "pagamento", None)
        return float(pagamento.valor) if pagamento else 0.0

    def get_paymentMethod(self, obj):
        pagamento = getattr(obj, "pagamento", None)
        return pagamento.get_metodo_display() if pagamento else "PIX"

    def get_refundStatus(self, obj):
        pagamento = getattr(obj, "pagamento", None)
        if not pagamento or pagamento.status_reembolso == "nao_aplicavel":
            return None
        percentual = pagamento.percentual_reembolso
        if pagamento.status_reembolso == "sem_direito" or not percentual:
            return "Sem direito a reembolso"
        valor = formatar_reais(pagamento.valor_reembolsado)
        if percentual >= 100:
            return f"Reembolso integral de {valor}"
        return f"Reembolso de {percentual:.0f}% ({valor})"

    def get_refundPercentage(self, obj):
        pagamento = getattr(obj, "pagamento", None)
        if not pagamento or pagamento.percentual_reembolso is None:
            return None
        return float(pagamento.percentual_reembolso)

    def get_refundAmount(self, obj):
        pagamento = getattr(obj, "pagamento", None)
        if not pagamento or pagamento.valor_reembolsado is None:
            return None
        return float(pagamento.valor_reembolsado)

    def get_canCancel(self, obj):
        # Só antes da aula começar — depois disso o caminho é o professor
        # concluir a aula ou registrar o não comparecimento.
        return obj.status not in ("cancelado", "concluido") and horas_restantes(obj) > 0

    def get_canMarkNoShow(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not hasattr(user, "perfil_professor"):
            return False
        if obj.professor_id != user.perfil_professor.id:
            return False
        if obj.status in ("cancelado", "concluido"):
            return False
        return horas_restantes(obj) < 0

    def get_canMarkConcluido(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not hasattr(user, "perfil_professor"):
            return False
        if obj.professor_id != user.perfil_professor.id:
            return False
        if obj.status in ("cancelado", "concluido"):
            return False
        return horas_restantes(obj) < 0

    def get_canAvaliar(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not hasattr(user, "perfil_aluno"):
            return False
        if obj.aluno_id != user.perfil_aluno.id:
            return False
        if obj.status != "concluido":
            return False
        return not hasattr(obj, "avaliacao")

    def get_avaliacao(self, obj):
        avaliacao = getattr(obj, "avaliacao", None)
        if avaliacao is None:
            return None
        return {"nota": avaliacao.nota, "comentario": avaliacao.comentario}


class AgendamentoCreateSerializer(serializers.Serializer):
    """Cria um agendamento dentro de uma janela de disponibilidade do professor.

    A `disponibilidade` representa uma JANELA (ex.: segunda 10h-17h), não um
    horário único — o aluno escolhe o `horario` de início e a `duracao_minutos`
    (até 2h30, ver Agendamento.DURACAO_CHOICES) dentro dessa janela. Várias
    aulas podem coexistir na mesma janela, desde que não se sobreponham.
    O preço é proporcional: preco_hora do professor × (duração / 60min).
    """

    disponibilidade = serializers.PrimaryKeyRelatedField(queryset=Disponibilidade.objects.all())
    data = serializers.DateField()
    horario = serializers.TimeField()
    duracao_minutos = serializers.ChoiceField(
        choices=Agendamento.DURACAO_CHOICES, required=False, default=60
    )
    conteudo = serializers.CharField(required=False, allow_blank=True, default="")
    metodo = serializers.ChoiceField(
        choices=Pagamento.METODO_CHOICES, required=False, default="PIX"
    )

    def validate(self, attrs):
        request = self.context["request"]
        if not hasattr(request.user, "perfil_aluno"):
            raise serializers.ValidationError("Apenas alunos podem realizar agendamentos.")

        disponibilidade = attrs["disponibilidade"]
        horario = attrs["horario"]
        data = attrs["data"]
        duracao = attrs.get("duracao_minutos", 60)
        fim = horario_fim_aula(horario, duracao)

        # RN: a data escolhida precisa cair no mesmo dia da semana da disponibilidade
        # (ex.: não deixar marcar numa quarta uma disponibilidade de segunda/sexta).
        if data.weekday() != DIA_SEMANA_WEEKDAY.get(disponibilidade.dia_semana):
            dia = disponibilidade.get_dia_semana_display()
            artigo = "aos" if disponibilidade.dia_semana in ("sabado", "domingo") else "às"
            raise serializers.ValidationError(
                f"A data escolhida não é {dia.lower()} — esse professor só atende nesse "
                f"horário {artigo} {dia.lower()}s. Escolha outra data."
            )

        # RN: o horário + duração escolhidos precisam caber dentro da janela do professor.
        if horario < disponibilidade.horario_inicio or fim > disponibilidade.horario_fim:
            raise serializers.ValidationError(
                f"Essa duração não cabe nessa janela. Escolha um horário de início entre "
                f"{disponibilidade.horario_inicio.strftime('%H:%M')} e "
                f"{disponibilidade.horario_fim.strftime('%H:%M')} que caiba a duração escolhida."
            )

        inicio_aula = timezone.make_aware(
            datetime.datetime.combine(data, horario), timezone.get_current_timezone()
        )
        limite = timezone.now() + datetime.timedelta(minutes=ANTECEDENCIA_MINIMA_MINUTOS)
        if inicio_aula < limite:
            raise serializers.ValidationError(
                "A aula precisa ser agendada com pelo menos 1 hora de antecedência. "
                "Escolha um horário mais tarde ou outra data."
            )

        if disponibilidade.status == "indisponivel":
            raise serializers.ValidationError(
                "Esse horário não está mais disponível para agendamento."
            )

        # RN11: só professor com currículo aprovado pode ser agendado.
        if disponibilidade.professor.status_verificacao != "aprovado":
            raise serializers.ValidationError(
                "Este professor não está disponível para agendamentos no momento."
            )

        return attrs

    def create(self, validated_data):
        from django.db import transaction

        request = self.context["request"]
        aluno = request.user.perfil_aluno
        metodo = validated_data.get("metodo", "PIX")
        horario = validated_data["horario"]
        data = validated_data["data"]
        duracao = validated_data.get("duracao_minutos", 60)
        fim = horario_fim_aula(horario, duracao)

        with transaction.atomic():
            from contas.models import PerfilProfessor

            disponibilidade = Disponibilidade.objects.get(pk=validated_data["disponibilidade"].pk)
            # Trava o PROFESSOR (não só a janela): ele pode ter janelas de disciplinas
            # diferentes no mesmo horário, e duas reservas simultâneas em janelas
            # diferentes não podem virar duas aulas ao mesmo tempo.
            PerfilProfessor.objects.select_for_update().get(pk=disponibilidade.professor_id)

            # RN02: não pode sobrepor outra aula ativa do professor nessa data, em
            # qualquer disciplina (checagem feita sob lock, contra corrida). Cada
            # aula tem sua própria duração, então o "fim" de cada uma é calculado.
            conflitos = Agendamento.objects.filter(
                professor_id=disponibilidade.professor_id,
                data=data,
                status__in=["pendente", "confirmado"],
            )
            for outra in conflitos:
                outro_fim = horario_fim_aula(outra.horario, outra.duracao_minutos)
                if horario < outro_fim and fim > outra.horario:
                    raise serializers.ValidationError(
                        "Esse horário já está ocupado na agenda do professor. Escolha outro horário."
                    )

            agendamento = Agendamento.objects.create(
                aluno=aluno,
                professor=disponibilidade.professor,
                disciplina=disponibilidade.disciplina,
                disponibilidade=disponibilidade,
                data=data,
                horario=horario,
                duracao_minutos=duracao,
                conteudo=validated_data.get("conteudo", ""),
                status="confirmado",
            )

            # Preço proporcional à duração escolhida (preco_hora é por 60min).
            valor = (
                disponibilidade.professor.preco_hora * Decimal(duracao) / Decimal(60)
            ).quantize(Decimal("0.01"))

            # Pagamento sempre simulado/instantâneo (sem gateway real), independente
            # do método escolhido — só o código PIX faz sentido fora do método PIX.
            Pagamento.objects.create(
                agendamento=agendamento,
                valor=valor,
                metodo=metodo,
                status="aprovado",
                codigo_pix=CODIGO_PIX_DEMO if metodo == "PIX" else "",
            )

        return agendamento


class MensagemSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    senderAvatar = serializers.SerializerMethodField()
    text = serializers.CharField(source="texto")
    time = serializers.SerializerMethodField()

    class Meta:
        model = Mensagem
        fields = ["id", "sender", "senderAvatar", "text", "time"]

    def get_sender(self, obj):
        return obj.remetente.get_full_name() or obj.remetente.username

    def get_senderAvatar(self, obj):
        # Foto de quem enviou (professor ou aluno). None = sem foto: o front
        # mostra as iniciais. Sem `request` (push via WebSocket, ver signals.py)
        # a URL sai relativa, o que funciona porque front e API têm a mesma origem.
        perfil = getattr(obj.remetente, "perfil_professor", None) or getattr(obj.remetente, "perfil_aluno", None)
        if perfil is None or not perfil.avatar:
            return None
        request = self.context.get("request")
        url = perfil.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_time(self, obj):
        return obj.criado_em.strftime("%H:%M")


class DenunciaMensagemInputSerializer(serializers.Serializer):
    motivo = serializers.ChoiceField(choices=DenunciaMensagem.MOTIVO_CHOICES)
    detalhes = serializers.CharField(required=False, allow_blank=True, default="")


class AvaliacaoSerializer(serializers.ModelSerializer):
    studentName = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Avaliacao
        fields = ["id", "studentName", "nota", "comentario", "date"]

    def get_studentName(self, obj):
        return obj.aluno.user.get_full_name() or obj.aluno.user.username

    def get_date(self, obj):
        return obj.criado_em.strftime("%d/%m/%Y")


class AvaliacaoCreateSerializer(serializers.Serializer):
    nota = serializers.IntegerField(min_value=1, max_value=5)
    comentario = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        agendamento = self.context["agendamento"]
        request = self.context["request"]

        # RN: só o aluno que participou da aula concluída pode avaliar, uma vez só.
        if not hasattr(request.user, "perfil_aluno") or agendamento.aluno_id != request.user.perfil_aluno.id:
            raise serializers.ValidationError("Apenas o aluno da aula pode avaliar o professor.")

        if agendamento.status != "concluido":
            raise serializers.ValidationError("Só é possível avaliar aulas concluídas.")

        if hasattr(agendamento, "avaliacao"):
            raise serializers.ValidationError("Esta aula já foi avaliada.")

        comentario = attrs.get("comentario", "")
        if comentario:
            resultado = get_moderador().analisar(comentario)
            if not resultado.aprovado:
                raise serializers.ValidationError(
                    "Esse comentário não pode ser publicado porque viola as regras de uso do DarUmHelp."
                )

        return attrs

    def create(self, validated_data):
        agendamento = self.context["agendamento"]
        return Avaliacao.objects.create(
            agendamento=agendamento,
            aluno=agendamento.aluno,
            professor=agendamento.professor,
            nota=validated_data["nota"],
            comentario=validated_data.get("comentario", ""),
        )
