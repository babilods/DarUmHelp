"""Verificação de currículo de professores.

Mesma ideia do agendamento/moderacao.py: uma interface plugável
(`VerificadorBase`) para permitir trocar a implementação inicial
(heurística por palavras-chave) por uma chamada a uma API de IA no
futuro, sem alterar o restante do código — basta implementar uma nova
subclasse e apontar `settings.VERIFICACAO_BACKEND` para ela.

Importante: nenhuma implementação aqui confirma de fato que o professor
possui as credenciais alegadas (isso exigiria consultar um registro
oficial, ex. MEC/conselhos de classe). O objetivo é só triar — sinalizar
currículos vazios/incompletos/incoerentes com a disciplina cadastrada —
para acelerar a fila de revisão humana. A aprovação final é sempre de
um moderador (ver contas/admin.py).
"""

import re
from dataclasses import dataclass, field

from django.conf import settings
from django.utils.module_loading import import_string

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - dependência opcional em dev
    PdfReader = None


@dataclass
class ResultadoVerificacao:
    confianca: str  # "alta" | "media" | "baixa"
    alertas: list[str] = field(default_factory=list)
    resumo: str = ""


class VerificadorBase:
    """Interface que qualquer backend de verificação deve implementar."""

    def analisar(self, professor, arquivo) -> ResultadoVerificacao:
        raise NotImplementedError


_PALAVRAS_FORMACAO = [
    r"forma[cç][aã]o", r"gradua[cç][aã]o", r"licenciatura", r"bacharel",
    r"p[oó]s[- ]gradua[cç][aã]o", r"mestrado", r"doutorado", r"certifica[cç][aã]o",
]
_PALAVRAS_EXPERIENCIA = [
    r"experi[eê]ncia", r"professor", r"\baula", r"tutor", r"monitor",
    r"leciona", r"ensino",
]

_TAMANHO_MINIMO_TEXTO = 200
_LIMITE_ANALISE = 20000  # evita custo excessivo em PDFs enormes


class VerificadorHeuristico(VerificadorBase):
    """Extrai o texto do PDF e aplica checagens simples de plausibilidade."""

    def _extrair_texto(self, arquivo) -> str:
        if PdfReader is None:
            return ""
        try:
            arquivo.seek(0)
            leitor = PdfReader(arquivo)
            texto = "\n".join(pagina.extract_text() or "" for pagina in leitor.pages)
        except Exception:
            return ""
        finally:
            try:
                arquivo.seek(0)
            except Exception:
                pass
        return texto[:_LIMITE_ANALISE]

    def analisar(self, professor, arquivo) -> ResultadoVerificacao:
        texto = self._extrair_texto(arquivo)
        texto_lower = texto.lower()
        alertas = []

        if len(texto.strip()) < _TAMANHO_MINIMO_TEXTO:
            alertas.append(
                "Currículo muito curto ou não foi possível extrair texto do PDF "
                "(pode ser um PDF escaneado/imagem)."
            )

        if not any(re.search(p, texto_lower) for p in _PALAVRAS_FORMACAO):
            alertas.append("Não foram encontradas menções a formação acadêmica/certificações.")

        if not any(re.search(p, texto_lower) for p in _PALAVRAS_EXPERIENCIA):
            alertas.append("Não foram encontradas menções a experiência como professor/tutor.")

        disciplinas = list(professor.disciplinas.values_list("nome", flat=True))
        if disciplinas and not any(d.lower() in texto_lower for d in disciplinas):
            alertas.append(
                "O currículo não menciona nenhuma das disciplinas cadastradas pelo professor "
                f"({', '.join(disciplinas)})."
            )

        if not alertas:
            confianca = "alta"
        elif len(alertas) >= 3:
            confianca = "baixa"
        else:
            confianca = "media"

        resumo = f"Triagem automática: {len(alertas)} alerta(s) encontrado(s)."
        return ResultadoVerificacao(confianca=confianca, alertas=alertas, resumo=resumo)


def get_verificador() -> VerificadorBase:
    classe = import_string(settings.VERIFICACAO_BACKEND)
    return classe()
