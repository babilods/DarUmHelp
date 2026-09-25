from django.urls import path

from . import views

urlpatterns = [
    path("registro/", views.registro, name="contas-registro"),
    path("login/", views.login_view, name="contas-login"),
    path("logout/", views.logout_view, name="contas-logout"),
    path("me/", views.me, name="contas-me"),
    path("me/email/", views.alterar_email, name="contas-alterar-email"),
    path("csrf/", views.csrf, name="contas-csrf"),
    path("aluno/me/", views.MeuPerfilAlunoView.as_view(), name="contas-aluno-me"),
    path("aluno/me/avatar/", views.AlunoAvatarUploadView.as_view(), name="contas-aluno-avatar"),
    path("aluno/me/favoritos/", views.MeusFavoritosView.as_view(), name="contas-aluno-favoritos"),
    path("aluno/me/favoritos/adicionar/", views.adicionar_favorito, name="contas-aluno-favoritos-add"),
    path(
        "aluno/me/favoritos/<int:professor_id>/",
        views.remover_favorito,
        name="contas-aluno-favoritos-remove",
    ),
    path("aluno/me/cartoes/", views.CartoesSalvosView.as_view(), name="contas-aluno-cartoes"),
    path("aluno/me/cartoes/<int:pk>/", views.CartaoSalvoDetailView.as_view(), name="contas-aluno-cartao-detail"),
]
