/*
 * O "dublê" do fornecedor. O enunciado cita um serviço externo de classificação
 * e extração; nesta fatia ele é esta função. Ela varia a confiança e às vezes
 * derruba um campo de propósito, para que a próxima fatia (conferência humana)
 * tenha o caso de baixa confiança para tratar — mesmo sem consumi-lo ainda.
 */
import type {
  CamposExtraidos,
  DocumentoConcluido,
  DocumentoFalhou,
  TipoDocumento,
} from '../types/contrato'

export interface ConfigDuble {
  /** Faixa de latência simulada. Produção observa 5–40 s; aqui é menor para o
   * exercício ser demonstrável. Testes zeram isto. */
  latenciaMinMs: number
  latenciaMaxMs: number
  /** Probabilidade de o fornecedor falhar de forma intermitente (fato a). */
  probFalha: number
  /** Probabilidade de um campo voltar com confiança baixa de propósito. */
  probQuedaCampo: number
}

export const configPadrao: ConfigDuble = {
  latenciaMinMs: 5_000,
  latenciaMaxMs: 18_000,
  probFalha: 0.12,
  probQuedaCampo: 0.4,
}

let config: ConfigDuble = { ...configPadrao }

export function configurarDuble(parcial: Partial<ConfigDuble>): void {
  config = { ...config, ...parcial }
}

export function resetarDuble(): void {
  config = { ...configPadrao }
}

export function latenciaDuble(): number {
  const { latenciaMinMs: min, latenciaMaxMs: max } = config
  return Math.round(min + Math.random() * (max - min))
}

export function fornecedorFalhou(): boolean {
  return Math.random() < config.probFalha
}

const CAMPOS_IDENTIDADE_BASE: Array<[string, string, number]> = [
  ['nome', 'João da Silva', 0.97],
  ['filiacao', 'Maria da Silva e José da Silva', 0.93],
  ['data_nascimento', '1990-04-12', 0.99],
  ['numero', '12.345.678-9', 0.88],
  ['orgao_emissor', 'SSP/RN', 0.71],
]

function variar(base: number): number {
  const delta = (Math.random() - 0.5) * 0.08
  return Math.min(0.995, Math.max(0.05, Number((base + delta).toFixed(2))))
}

/** Monta o resultado de uma identidade, com a variação e a queda de campo. */
export function classificarIdentidade(nomeOriginal: string): {
  tipo_documento: TipoDocumento
  nome_sugerido: string
  campos: CamposExtraidos
} {
  const campos: CamposExtraidos = {}
  for (const [chave, valor, confBase] of CAMPOS_IDENTIDADE_BASE) {
    campos[chave] = { valor, confianca: variar(confBase) }
  }

  if (Math.random() < config.probQuedaCampo) {
    const chaves = Object.keys(campos)
    const alvo = chaves[Math.floor(Math.random() * chaves.length)]!
    campos[alvo] = {
      ...campos[alvo]!,
      confianca: Number((0.2 + Math.random() * 0.3).toFixed(2)),
    }
  }

  return {
    tipo_documento: 'identidade',
    nome_sugerido: nomeSugerido('identidade', campos['nome']!.valor, nomeOriginal),
    campos,
  }
}

function nomeSugerido(tipo: string, nome: string, nomeOriginal: string): string {
  const slug = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const hoje = new Date().toISOString().slice(0, 10)
  const ext = extensao(nomeOriginal)
  return `${tipo}_${slug}_${hoje}${ext}`
}

function extensao(nome: string): string {
  const m = /\.[a-z0-9]+$/i.exec(nome)
  return m ? m[0].toLowerCase() : ''
}

export function resultadoConcluido(
  id: string,
  recebidoEm: string,
  nomeOriginal: string,
): DocumentoConcluido {
  return {
    id,
    recebido_em: recebidoEm,
    status: 'concluido',
    ...classificarIdentidade(nomeOriginal),
  }
}

export function resultadoFalhou(id: string, recebidoEm: string): DocumentoFalhou {
  return {
    id,
    recebido_em: recebidoEm,
    status: 'falhou',
    erro: 'falha_fornecedor',
    mensagem:
      'O serviço de leitura não respondeu desta vez. Isso costuma ser passageiro — tente enviar de novo.',
  }
}
