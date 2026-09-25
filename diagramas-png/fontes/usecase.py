import math, html
RX, RY = 150, 40
W, H = 2000, 1740
UC = {}  # id -> (x, y, label, kind)
def uc(i, x, y, label, kind='n'): UC[i] = (x, y, label, kind)
L, C, R = 430, 1000, 1520
# Visitante
uc('cad', L, 190, 'Cadastrar-se'); uc('log', L, 285, 'Fazer login')
uc('bus', L, 380, 'Buscar professores'); uc('ver', L, 475, 'Ver perfil do professor')
# Aluno
uc('age', L, 610, 'Agendar aula'); uc('ava', L, 705, 'Avaliar professor')
uc('fav', L, 1070, 'Favoritar professor'); uc('car', L, 1165, 'Gerenciar cartões salvos')
uc('pal', L, 1260, 'Editar perfil e|preferências de estudo')
# Compartilhados
uc('msg', C, 800, 'Enviar mensagem no chat'); uc('den', C, 890, 'Denunciar mensagem')
uc('vid', C, 1070, 'Entrar em videochamada'); uc('can', C, 1160, 'Cancelar aula')
# Include (sistema)
uc('pag', 820, 515, 'Processar pagamento|(simulado)', 'i'); uc('mod', C, 700, 'Moderar conteúdo|automaticamente', 'i')
uc('med', C, 610, 'Atualizar média|de avaliações', 'i')
uc('ree', C, 1270, 'Calcular reembolso', 'i')
uc('ema', C, 980, 'Alterar e-mail')
uc('tri', 1180, 380, 'Triagem automática|do currículo', 'i')
# Professor
uc('dis', R, 170, 'Gerenciar disciplinas'); uc('dsp', R, 265, 'Definir disponibilidade|semanal')
uc('ppr', R, 360, 'Editar perfil profissional|(bio, preço, foto, vídeo)'); uc('cur', R, 455, 'Enviar ou excluir|currículo')
uc('doc', R, 550, 'Enviar ou excluir|documento'); uc('con', R, 645, 'Concluir aula')
uc('mal', R, 740, 'Ver meus alunos')
uc('nsh', R, 1120, 'Marcar não|comparecimento'); uc('saq', R, 1215, 'Solicitar saque')
uc('ctr', R, 1310, 'Ver carteira e|estatísticas')
# Admin
uc('rcu', R, 1435, 'Revisar currículo|(aprovar / rejeitar)'); uc('rdo', R, 1530, 'Revisar documento|de identidade')
uc('rde', R, 1625, 'Moderar denúncias')

ACT = {'Visitante': (110, 330), 'Aluno': (110, 870), 'Professor': (1890, 960), 'Administrador': (1890, 1530)}
ASSOC = {'Visitante': ['cad', 'log', 'bus', 'ver'],
         'Aluno': ['age', 'ava', 'fav', 'car', 'pal', 'msg', 'den', 'vid', 'can', 'ema'],
         'Professor': ['dis', 'dsp', 'ppr', 'cur', 'doc', 'con', 'mal', 'msg', 'den', 'vid', 'can', 'ema', 'nsh', 'saq', 'ctr'],
         'Administrador': ['rcu', 'rdo', 'rde']}
INC = [('age', 'pag'), ('ava', 'mod'), ('ava', 'med'), ('msg', 'mod'), ('can', 'ree'), ('cur', 'tri')]


def edge_pt(i, tx, ty):
    x, y = UC[i][:2]
    dx, dy = tx - x, ty - y
    t = 1 / math.sqrt((dx / RX) ** 2 + (dy / RY) ** 2)
    return x + dx * t, y + dy * t


def inside(i, px, py, pad=6):
    x, y = UC[i][:2]
    return ((px - x) / (RX + pad)) ** 2 + ((py - y) / (RY + pad)) ** 2 < 1


def check(a, b, skip):
    bad = set()
    for k in range(1, 200):
        px = a[0] + (b[0] - a[0]) * k / 200
        py = a[1] + (b[1] - a[1]) * k / 200
        for i in UC:
            if i not in skip and inside(i, px, py):
                bad.add(i)
    return bad


out = []
problems = []
A = out.append
A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Segoe UI, Arial, sans-serif">')
A('<defs><marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M1,1 L11,6 L1,11" fill="none" stroke="#7C3AED" stroke-width="1.6"/></marker>'
  '<marker id="tri" viewBox="0 0 20 20" refX="19" refY="10" markerWidth="20" markerHeight="20" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L19,10 L1,19 Z" fill="#fff" stroke="#18181B" stroke-width="2"/></marker></defs>')
A(f'<rect width="{W}" height="{H}" fill="#fff"/>')
A('<rect x="250" y="95" width="1500" height="1580" rx="18" fill="#FCFCFD" stroke="#A1A1AA" stroke-width="2"/>')
A('<text x="1000" y="130" text-anchor="middle" font-size="24" font-weight="700" fill="#3F3F46">Sistema DarUmHelp</text>')
for act, ids in ASSOC.items():
    ax, ay = ACT[act]
    ay2 = ay - 15
    for i in ids:
        ux, uy = UC[i][:2]
        ex, ey = (ux - RX, uy) if ax < ux else (ux + RX, uy)
        sx = ax + (30 if ex > ax else -30)
        bad = check((sx, ay2), (ex, ey), {i})
        if bad:
            problems.append(f'{act}->{i} cruza {bad}')
        A(f'<line x1="{sx}" y1="{ay2}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="#71717A" stroke-width="1.6"/>')
for a, b in INC:
    bx, by = UC[b][:2]
    ax_, ay_ = UC[a][:2]
    p1 = edge_pt(a, bx, by)
    p2 = edge_pt(b, ax_, ay_)
    bad = check(p1, p2, {a, b})
    if bad:
        problems.append(f'include {a}->{b} cruza {bad}')
    A(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="#7C3AED" stroke-width="1.8" stroke-dasharray="7 5" marker-end="url(#open)"/>')
    mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
    if abs(p2[0] - p1[0]) < 40:
        mx += 48
    A(f'<text x="{mx:.0f}" y="{my + 5:.0f}" text-anchor="middle" font-size="14" font-style="italic" fill="#7C3AED" stroke="#fff" stroke-width="5" paint-order="stroke">«include»</text>')
# generalização Aluno -> Visitante
A(f'<line x1="110" y1="{ACT["Aluno"][1] - 78}" x2="110" y2="{ACT["Visitante"][1] + 98}" stroke="#18181B" stroke-width="2" marker-end="url(#tri)"/>')
for i, (x, y, label, kind) in UC.items():
    if kind == 'i':
        A(f'<ellipse cx="{x}" cy="{y}" rx="{RX}" ry="{RY}" fill="#F5F3FF" stroke="#A78BFA" stroke-width="2" stroke-dasharray="6 4"/>')
    else:
        A(f'<ellipse cx="{x}" cy="{y}" rx="{RX}" ry="{RY}" fill="#EEF0FF" stroke="#4F46E5" stroke-width="2.2"/>')
    lines = label.split('|')
    fs = 17 if len(lines) == 1 else 16
    for k, t in enumerate(lines):
        dy = (k - (len(lines) - 1) / 2) * 20 + 6
        A(f'<text x="{x}" y="{y + dy:.0f}" text-anchor="middle" font-size="{fs}" fill="#18181B">{html.escape(t)}</text>')
for name, (x, y) in ACT.items():
    A(f'<g stroke="#18181B" stroke-width="2.6" fill="#fff"><circle cx="{x}" cy="{y - 55}" r="20"/><line x1="{x}" y1="{y - 35}" x2="{x}" y2="{y + 20}"/>'
      f'<line x1="{x - 28}" y1="{y - 15}" x2="{x + 28}" y2="{y - 15}"/><line x1="{x}" y1="{y + 20}" x2="{x - 24}" y2="{y + 60}"/><line x1="{x}" y1="{y + 20}" x2="{x + 24}" y2="{y + 60}"/></g>')
    A(f'<text x="{x}" y="{y + 88}" text-anchor="middle" font-size="20" font-weight="700" fill="#18181B">{name}</text>')
A('<g font-size="16" fill="#3F3F46"><line x1="260" y1="1712" x2="310" y2="1712" stroke="#71717A" stroke-width="1.6"/><text x="320" y="1717">associação</text>'
  '<line x1="450" y1="1712" x2="510" y2="1712" stroke="#7C3AED" stroke-width="1.8" stroke-dasharray="7 5" marker-end="url(#open)"/><text x="520" y="1717">«include» (executado automaticamente pelo sistema)</text>'
  '<line x1="930" y1="1712" x2="980" y2="1712" stroke="#18181B" stroke-width="2" marker-end="url(#tri)"/><text x="990" y="1717">generalização (Aluno herda os casos do Visitante; Professor e Administrador também — omitido por clareza)</text></g>')
A('</svg>')
open('out/usecase.svg', 'w', encoding='utf-8').write('\n'.join(out))
print('\n'.join(problems) or 'sem cruzamentos')
