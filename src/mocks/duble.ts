/*
 * O "dublê" do fornecedor. O enunciado cita um serviço externo de classificação
 * e extração; nesta fatia ele é esta função — não há OCR nem chamada externa, os
 * dados são fictícios de propósito (o mock é só para demonstração).
 *
 * O que ele simula, que é o que a tela existe para tratar: latência de 5–40 s,
 * falha intermitente do fornecedor, e confiança que varia por campo (às vezes um
 * campo cai de propósito, para a próxima fatia — conferência humana — ter o caso
 * de baixa confiança). Sorteia entre algumas identidades fictícias para a demo
 * não ficar repetitiva.
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
  /** Fixa a identidade fictícia (índice do pool). null = sorteia pelo id do doc. */
  indiceIdentidade: number | null
}

export const configPadrao: ConfigDuble = {
  latenciaMinMs: 5_000,
  latenciaMaxMs: 18_000,
  probFalha: 0.12,
  probQuedaCampo: 0.4,
  indiceIdentidade: null,
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

interface Identidade {
  nome: string
  filiacao: string
  data_nascimento: string
  numero: string
  orgao_emissor: string
}

/** Identidades fictícias. A #0 é o exemplo do enunciado. */
const IDENTIDADES: Identidade[] = [
  {
    nome: 'João da Silva',
    filiacao: 'Maria da Silva e José da Silva',
    data_nascimento: '1990-04-12',
    numero: '12.345.678-9',
    orgao_emissor: 'SSP/RN',
  },
  {
    nome: 'Ana Beatriz Nogueira Alves',
    filiacao: 'Cláudia Nogueira Alves e Roberto Alves Pereira',
    data_nascimento: '1985-09-27',
    numero: '23.987.654-1',
    orgao_emissor: 'SSP/CE',
  },
  {
    nome: 'Carlos Eduardo Ramos Lima',
    filiacao: 'Fátima Ramos Lima e Antônio Lima Souza',
    data_nascimento: '1978-01-03',
    numero: '8.221.447-0',
    orgao_emissor: 'SSP/SP',
  },
  {
    nome: 'Mariana Costa Ferreira',
    filiacao: 'Sônia Costa Ferreira e Paulo Ferreira Dias',
    data_nascimento: '1996-11-19',
    numero: '45.112.908-6',
    orgao_emissor: 'SSP/BA',
  },
  {
    nome: 'Rafael Augusto Menezes',
    filiacao: 'Lúcia Menezes Carvalho e Jorge Augusto Menezes',
    data_nascimento: '2001-06-08',
    numero: '19.554.230-3',
    orgao_emissor: 'SSPDS/PE',
  },
]

const CONF_BASE: Record<keyof Identidade, number> = {
  nome: 0.97,
  filiacao: 0.93,
  data_nascimento: 0.99,
  numero: 0.88,
  orgao_emissor: 0.71,
}

function variar(base: number): number {
  const delta = (Math.random() - 0.5) * 0.08
  return Math.min(0.995, Math.max(0.05, Number((base + delta).toFixed(2))))
}

/** Índice estável a partir de uma string, para o mesmo doc cair sempre na mesma pessoa. */
function indiceEstavel(chave: string, tamanho: number): number {
  let h = 0
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) | 0
  return Math.abs(h) % tamanho
}

/** Monta o resultado de uma identidade, com a variação e a queda de campo. */
export function classificarIdentidade(
  nomeOriginal: string,
  seed = nomeOriginal,
): {
  tipo_documento: TipoDocumento
  nome_sugerido: string
  campos: CamposExtraidos
} {
  const idx = config.indiceIdentidade ?? indiceEstavel(seed, IDENTIDADES.length)
  const pessoa = IDENTIDADES[idx % IDENTIDADES.length]!

  const campos: CamposExtraidos = {}
  for (const chave of Object.keys(CONF_BASE) as (keyof Identidade)[]) {
    campos[chave] = { valor: pessoa[chave], confianca: variar(CONF_BASE[chave]) }
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
    nome_sugerido: nomeSugerido('identidade', pessoa.nome, nomeOriginal),
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
    ...classificarIdentidade(nomeOriginal, id),
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
