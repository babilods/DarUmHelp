# DarUmHelp

Plataforma web que conecta **alunos** a **professores particulares**: o aluno encontra professores verificados por disciplina, lê as avaliações, agenda a aula com a duração que precisa, paga (pagamento simulado), conversa com o professor por chat em tempo real e assiste à aula por videochamada. O professor gerencia disciplinas, janelas de disponibilidade, perfil, carteira e saques.

Projeto da disciplina **Soluções Computacionais** (turma GPE02M80093).
**Integrantes:** Bárbara Eloi, Brenda Brigida, Arthur Henry, Davi Silva e Gabriela Melo.

## Tecnologias

- **Back-end:** Python 3.12, Django 5.0, Django REST Framework, Django Channels + Daphne (WebSocket/ASGI)
- **Banco de dados:** MySQL 8.0
- **Front-end:** HTML5, JavaScript, Tailwind CSS e ícones Lucide
- **Tempo real:** chat por WebSocket e videochamada WebRTC
- **Infraestrutura:** Docker e Docker Compose

## Estrutura

```
DarUmHelp-api/     back-end Django
  darumhelp/       configurações, rotas HTTP e WebSocket, entrega do front-end
  contas/          cadastro, login, perfis, favoritos, cartões, troca de e-mail
  professores/     busca, disciplinas, disponibilidade, currículo (triagem automática), carteira e saques
  agendamento/     aulas, pagamento, cancelamento e reembolso, avaliações, chat, denúncias, moderação
  realtime/        consumers WebSocket (chat e sinalização da videochamada)
DarUmHelp-web/     front-end (index.html e script.js)
diagramas-png/     diagramas UML e de banco de dados (fontes em diagramas-png/fontes)
```

## Como executar

Pré-requisito: Git e Docker com Docker Compose.

```bash
git clone https://github.com/babilods/DarUmHelp.git
cd DarUmHelp/DarUmHelp-api
cp .env.example .env          # ajuste as senhas se quiser
docker compose up -d --build  # sobe o MySQL e a aplicação (as migrations rodam sozinhas)
docker compose exec api python manage.py createsuperuser   # usuário do painel /admin/
docker compose exec api python manage.py seed_dados        # (opcional) dados de exemplo
```

Acesse **http://localhost:8000** (site) e **http://localhost:8000/admin/** (painel administrativo).

## Testes

```bash
cd DarUmHelp-api
docker compose exec -e DATABASE_USER=root -e DATABASE_PASSWORD=<senha root do .env> api python manage.py test
```

A suíte tem 106 testes automatizados (unidade, funcionais e integração com o MySQL e com os WebSockets), com cobertura de 88%.

## Observações

- Pagamentos, reembolsos e saques são **simulados** (não há gateway bancário real).
- Arquivos enviados pelos usuários (fotos, currículos e documentos) ficam em `DarUmHelp-api/media/`, que **não** é versionado por conter dados pessoais.
