from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("disciplinas", views.DisciplinaViewSet, basename="disciplina")
router.register("disponibilidades", views.DisponibilidadeViewSet, basename="disponibilidade")

urlpatterns = [
    path("professores/destaque/", views.professores_destaque, name="professores-destaque"),
    path(
        "professores/me/",
        views.MeuPerfilProfessorView.as_view(),
        name="professor-me",
    ),
    path(
        "professores/me/curriculo/",
        views.CurriculoUploadView.as_view(),
        name="professor-curriculo-upload",
    ),
    path(
        "professores/me/avatar/",
        views.AvatarUploadView.as_view(),
        name="professor-avatar-upload",
    ),
    path(
        "professores/me/video/",
        views.VideoApresentacaoUploadView.as_view(),
        name="professor-video-upload",
    ),
    path(
        "professores/me/documento/",
        views.DocumentoIdentidadeUploadView.as_view(),
        name="professor-documento-upload",
    ),
    path("professores/me/carteira/", views.minha_carteira, name="professor-carteira"),
    path("professores/me/saques/", views.MeusSaquesView.as_view(), name="professor-saques"),
    path(
        "professores/me/estatisticas/",
        views.minhas_estatisticas,
        name="professor-estatisticas",
    ),
    path(
        "professores/<int:professor_id>/disponibilidades/",
        views.disponibilidades_do_professor,
        name="professor-disponibilidades",
    ),
    path(
        "disponibilidades/<int:disponibilidade_id>/ocupados/",
        views.horarios_ocupados,
        name="disponibilidade-ocupados",
    ),
    path(
        "professores/<int:professor_id>/avaliacoes/",
        views.avaliacoes_do_professor,
        name="professor-avaliacoes",
    ),
    path("professores/<int:pk>/", views.ProfessorDetailView.as_view(), name="professor-detail"),
    path("professores/", views.ProfessorListView.as_view(), name="professor-list"),
    path("", include(router.urls)),
]
