"""Moderação de mensagens do chat interno.

Estrutura pensada para permitir, no futuro, plugar uma API de moderação/IA
sem alterar o restante do código: basta implementar uma nova subclasse de
`ModeradorBase` e apontar `settings.MODERACAO_BACKEND` para ela.
"""

import re
from dataclasses import dataclass, field

from django.conf import settings
from django.utils.module_loading import import_string


@dataclass
class ResultadoModeracao:
    aprovado: bool
    categorias_violadas: list[str] = field(default_factory=list)
    detalhe: str = ""


class ModeradorBase:
    """Interface que qualquer backend de moderação deve implementar."""

    def analisar(self, texto: str) -> ResultadoModeracao:
        raise NotImplementedError


# Cobertura demonstrativa/inicial — não exaustiva. O objetivo é bloquear os
# casos mais óbvios de abuso enquanto uma solução mais robusta (ex.: API de
# IA de moderação) não é integrada via MODERACAO_BACKEND.
CATEGORIAS_PROIBIDAS: dict[str, list[str]] = {
    "ofensa_assedio": [
        r"\bidiota\b",
        r"\bimbecil\b",
        r"\bburr[oa]\b",
        r"\bin[uú]til\b",
        r"\bvagabund[oa]\b",
        r"\blixo\s+de\s+(professor|aluno|pessoa)\b",
    ],
    "ameaca": [
        r"\bvou\s+te\s+(matar|pegar|acabar|encontrar)\b",
        r"\bcuidado\s+com\s+voc[eê]\b",
        r"\bvai\s+se\s+arrepender\b",
        r"\bvoc[eê]\s+vai\s+sofrer\b",
    ],
    "conteudo_sexual_explicito": [
        r"\bnud[eo]s?\b",
        r"\bp[oô]rn[oô]\b",
        r"\bsexo\s+(comigo|agora|gostoso)\b",
        r"\bmanda\s+foto\s+pelad[ao]\b",
    ],
    "discriminacao": [
        r"\bracist[a]?\b",
        r"\bhomofob\w*\b",
        r"\bpreconceit\w*\b",
        r"\bviad[oa]\b",
    ],
    "contato_externo": [
        # Apps e abreviações comuns (wpp, whats, zap, insta...).
        r"\bwhats(\s?app)?\b",
        r"\bwpp\b",
        r"\bzap(\s?zap)?\b",
        r"\btelegram\b",
        r"\binsta(gram)?\b",
        r"\bdiscord\b",
        r"\bfacebook\b",
        # "seu número", "meu celular", "sua conta do insta"... (pronome + meio de contato).
        r"\b(seu|teu|sua|tua|meu|minha)\s+(n[uú]mero|telefone|celular|cel|contato|e-?mail|whats\w*|wpp|zap|insta\w*)\b",
        # "número de telefone/celular/whats" — "número" sozinho NÃO bloqueia
        # (ex.: "qual o número da questão?" é uma frase normal de aula).
        r"\bn[uú]mero\s+(de|do)\s+(telefone|celular|cel|whats\w*|wpp|zap)\b",
        # Pedidos: "me passa/manda/dá ... telefone/contato/e-mail/wpp".
        r"\b(passa|passe|passar|manda|mande|mandar|envia|envie|me\s+d[aá]|me\s+de)\b[\s\w]{0,20}?\b(telefone|celular|contato|e-?mail|whats\w*|wpp|zap|insta\w*)\b",
        # "me chama no...", "me liga pelo...", "me adiciona no..."
        r"\bme\s+(liga|ligue|chama|chame|add|adiciona|adicione|segue|siga)\s+(no|na|pelo|pela)\b",
        r"\b@[\w.]{3,}\b",
        r"\bfora\s+da\s+plataforma\b",
        r"[\w.+-]+@[\w-]+\.[\w.-]+",
        r"(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}",
    ],
}

_PADROES_COMPILADOS = {
    categoria: [re.compile(padrao, re.IGNORECASE | re.UNICODE) for padrao in padroes]
    for categoria, padroes in CATEGORIAS_PROIBIDAS.items()
}

_LIMITE_ANALISE = 5000  # evita custo excessivo em textos absurdamente longos


class ModeradorPalavrasChave(ModeradorBase):
    """Implementação inicial baseada em regex/palavras-chave por categoria."""

    def analisar(self, texto: str) -> ResultadoModeracao:
        trecho = (texto or "")[:_LIMITE_ANALISE]

        categorias_violadas = [
            categoria
            for categoria, padroes in _PADROES_COMPILADOS.items()
            if any(padrao.search(trecho) for padrao in padroes)
        ]

        if categorias_violadas:
            return ResultadoModeracao(
                aprovado=False,
                categorias_violadas=categorias_violadas,
                detalhe="Mensagem bloqueada pelo moderador de palavras-chave.",
            )

        return ResultadoModeracao(aprovado=True)


def get_moderador() -> ModeradorBase:
    classe = import_string(settings.MODERACAO_BACKEND)
    return classe()
