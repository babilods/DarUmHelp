from django.urls import path

from . import views

urlpatterns = [
    path("aulas/", views.AgendamentoListCreateView.as_view(), name="aulas-list-create"),
    path("aulas/nao-lidas/", views.mensagens_nao_lidas_view, name="aulas-nao-lidas"),
    path("aulas/<int:pk>/", views.AgendamentoDetailView.as_view(), name="aulas-detail"),
    path("aulas/<int:pk>/cancelar/", views.cancelar_agendamento, name="aulas-cancelar"),
    path("aulas/<int:pk>/no-show/", views.marcar_no_show, name="aulas-no-show"),
    path("aulas/<int:pk>/concluir/", views.marcar_concluido, name="aulas-concluir"),
    path("aulas/<int:pk>/avaliacao/", views.avaliar_agendamento, name="aulas-avaliacao"),
    path("aulas/<int:pk>/mensagens/", views.MensagemListCreateView.as_view(), name="aulas-mensagens"),
    path("aulas/<int:pk>/mensagens/lidas/", views.marcar_mensagens_lidas, name="aulas-mensagens-lidas"),
    path(
        "aulas/<int:pk>/mensagens/<int:mensagem_id>/denunciar/",
        views.denunciar_mensagem,
        name="aulas-mensagens-denunciar",
    ),
]
