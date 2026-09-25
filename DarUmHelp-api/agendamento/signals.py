from decimal import Decimal

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Avaliacao, Mensagem
from .serializers import MensagemSerializer


@receiver(post_save, sender=Mensagem)
def notificar_nova_mensagem(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    payload = MensagemSerializer(instance).data
    async_to_sync(channel_layer.group_send)(
        f"chat_{instance.agendamento_id}",
        {"type": "chat.message", "message": payload},
    )


@receiver(post_save, sender=Avaliacao)
@receiver(post_delete, sender=Avaliacao)
def atualizar_avaliacao_media(sender, instance, **kwargs):
    professor = instance.professor
    media = professor.avaliacoes.aggregate(media=Avg("nota"))["media"]
    professor.avaliacao_media = Decimal(str(round(media, 2))) if media is not None else Decimal("5.00")
    professor.save(update_fields=["avaliacao_media"])
