/*
 * O "dublê" do fornecedor. O enunciado cita um serviço externo de classificação
 * e extração; nesta fatia ele é esta função — não há OCR nem chamada externa, os
 * dados são fictícios de propósito (o mock é só para demonstração).
 *
 * O que ele simula, que é o que a tela existe para tratar: latência de 5–40 s,
 * falha intermitente do fornecedor, e confiança que varia por campo (às vezes um
 * campo cai de propósito, para a próxima fatia — conferência humana — ter o caso
 * de baixa confiança).
 *
 * Sorteia entre vários tipos de documento (identidade, contracheque, carteira de
 * trabalho, laudo, procuração, contrato). Cada tipo tem o seu conjunto de campos
 * — identidade tem CPF e órgão emissor, laudo tem médico e CRM, contrato tem
 * partes e vigência. O `tipo_documento` e as chaves de `campos` são livres no
 * contrato; a tela renderiza o que vier.
 */
import type {
  CamposExtraidos,
  DocumentoAguardandoConferencia,
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
  /** Abaixo disto, o campo é "incerto" e o documento vai para conferência humana
   * em vez de entrar como pronto. */
  limiarConferencia: number
  /** Fixa o documento fictício (índice do pool). null = sorteia pelo id do doc. */
  indiceDocumento: number | null
}

export const configPadrao: ConfigDuble = {
  latenciaMinMs: 5_000,
  latenciaMaxMs: 18_000,
  probFalha: 0.12,
  probQuedaCampo: 0.4,
  limiarConferencia: 0.55,
  indiceDocumento: null,
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

interface DocumentoFicticio {
  tipo_documento: TipoDocumento
  campos: Record<string, string>
}

/**
 * Documentos fictícios. O #0 é o exemplo do enunciado (identidade, 5 campos, sem
 * CPF). Cada tipo traz o seu próprio conjunto de campos.
 */
const POOL: DocumentoFicticio[] = [
  {
    tipo_documento: 'identidade',
    campos: {
      nome: 'João da Silva',
      filiacao: 'Maria da Silva e José da Silva',
      data_nascimento: '1990-04-12',
      numero: '12.345.678-9',
      orgao_emissor: 'SSP/RN',
    },
  },
  {
    tipo_documento: 'identidade',
    campos: {
      nome: 'Ana Beatriz Nogueira Alves',
      filiacao: 'Cláudia Nogueira Alves e Roberto Alves Pereira',
      data_nascimento: '1985-09-27',
      cpf: '042.815.663-90',
      numero: '23.987.654-1',
      orgao_emissor: 'SSP/CE',
    },
  },
  {
    tipo_documento: 'contracheque',
    campos: {
      nome: 'Carlos Eduardo Ramos Lima',
      cpf: '118.402.557-11',
      matricula: '004821',
      cargo: 'Analista Administrativo',
      empregador: 'Lamarck Sociedade de Advogados',
      competencia: '07/2026',
      salario_bruto: 'R$ 6.480,00',
      salario_liquido: 'R$ 5.213,47',
    },
  },
  {
    tipo_documento: 'contracheque',
    campos: {
      nome: 'Mariana Costa Ferreira',
      cpf: '259.771.408-05',
      matricula: '001177',
      cargo: 'Secretária Executiva',
      empregador: 'Lamarck Sociedade de Advogados',
      competencia: '06/2026',
      salario_bruto: 'R$ 4.120,00',
      salario_liquido: 'R$ 3.498,62',
    },
  },
  {
    tipo_documento: 'carteira_trabalho',
    campos: {
      nome: 'Rafael Augusto Menezes',
      cpf: '690.334.211-72',
      data_nascimento: '2001-06-08',
      filiacao: 'Lúcia Menezes Carvalho e Jorge Augusto Menezes',
      numero_ctps: '8845217',
      serie: '0041/RN',
      pis: '127.05543.21-8',
    },
  },
  {
    tipo_documento: 'carteira_trabalho',
    campos: {
      nome: 'Patrícia Gomes Vasconcelos',
      cpf: '305.918.774-46',
      data_nascimento: '1993-02-17',
      filiacao: 'Terezinha Gomes Vasconcelos e Marcos Vasconcelos Pinto',
      numero_ctps: '5521903',
      serie: '0107/CE',
      pis: '160.88121.09-3',
    },
  },
  {
    tipo_documento: 'laudo',
    campos: {
      paciente: 'José Ribamar Alves',
      data_exame: '2026-08-15',
      tipo_exame: 'Ressonância magnética de crânio',
      medico_responsavel: 'Dra. Helena Barros Tavares',
      crm: 'CRM/RN 7231',
      conclusao:
        'Ausência de alterações expansivas ou isquêmicas agudas. Exame dentro dos limites da normalidade.',
    },
  },
  {
    tipo_documento: 'laudo',
    campos: {
      paciente: 'Sônia Maria Fontes',
      data_exame: '2026-07-29',
      tipo_exame: 'Ultrassonografia de abdome total',
      medico_responsavel: 'Dr. André Luiz Coelho',
      crm: 'CRM/CE 10944',
      conclusao:
        'Esteatose hepática leve. Demais órgãos avaliados sem particularidades.',
    },
  },
  {
    tipo_documento: 'procuracao',
    campos: {
      outorgante: 'Francisco Aumério Nogueira Vieira',
      outorgado: 'Lamarck Sociedade de Advogados',
      finalidade: 'Representação em ação trabalhista',
      tabeliao: '2º Tabelionato de Notas de Mossoró/RN',
      data_lavratura: '2026-06-30',
      validade: '2027-06-30',
    },
  },
  {
    tipo_documento: 'procuracao',
    campos: {
      outorgante: 'Cleonice Barbosa da Rocha',
      outorgado: 'Dr. Paulo Sérgio Andrade',
      finalidade: 'Recebimento de valores junto ao INSS',
      tabeliao: '1º Ofício de Notas de Fortaleza/CE',
      data_lavratura: '2026-05-12',
      validade: '2026-11-12',
    },
  },
  {
    tipo_documento: 'contrato',
    campos: {
      contratante: 'Construtora Vale Verde Ltda.',
      contratada: 'Lamarck Sociedade de Advogados',
      objeto: 'Assessoria jurídica preventiva e contenciosa',
      valor: 'R$ 96.000,00',
      vigencia_inicio: '2026-01-01',
      vigencia_fim: '2026-12-31',
      data_assinatura: '2026-01-05',
    },
  },
  {
    tipo_documento: 'contrato',
    campos: {
      contratante: 'Maria de Fátima Sales',
      contratada: 'Lamarck Sociedade de Advogados',
      objeto: 'Patrocínio em ação de inventário',
      valor: 'R$ 18.500,00',
      vigencia_inicio: '2026-03-15',
      vigencia_fim: '2027-03-15',
      data_assinatura: '2026-03-15',
    },
  },
]

/** Confiança base por campo. Campos fora daqui usam CONF_PADRAO. */
const CONF_BASE: Record<string, number> = {
  nome: 0.97,
  paciente: 0.96,
  outorgante: 0.95,
  outorgado: 0.92,
  contratante: 0.94,
  contratada: 0.92,
  filiacao: 0.93,
  data_nascimento: 0.99,
  cpf: 0.9,
  numero: 0.88,
  orgao_emissor: 0.71,
  matricula: 0.92,
  cargo: 0.86,
  empregador: 0.9,
  competencia: 0.96,
  salario_bruto: 0.9,
  salario_liquido: 0.85,
  numero_ctps: 0.84,
  serie: 0.78,
  pis: 0.86,
  data_exame: 0.97,
  tipo_exame: 0.9,
  medico_responsavel: 0.87,
  crm: 0.8,
  conclusao: 0.78,
  finalidade: 0.79,
  tabeliao: 0.83,
  data_lavratura: 0.95,
  validade: 0.9,
  objeto: 0.8,
  valor: 0.9,
  vigencia_inicio: 0.95,
  vigencia_fim: 0.95,
  data_assinatura: 0.95,
}
const CONF_PADRAO = 0.85

type Rand = () => number

function variar(base: number, rand: Rand): number {
  const delta = (rand() - 0.5) * 0.08
  return Math.min(0.995, Math.max(0.05, Number((base + delta).toFixed(2))))
}

/** Índice estável a partir de uma string, para o mesmo doc cair sempre no mesmo modelo. */
function indiceEstavel(chave: string, tamanho: number): number {
  let h = 0
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) | 0
  return Math.abs(h) % tamanho
}

/** Campo que identifica a "pessoa/parte principal", para o nome do arquivo. */
function nomePrincipal(campos: CamposExtraidos): string {
  return (
    campos.nome?.valor ??
    campos.paciente?.valor ??
    campos.outorgante?.valor ??
    campos.contratante?.valor ??
    campos.contratada?.valor ??
    ''
  )
}

/**
 * Monta o resultado de um documento fictício, com a variação e a queda de campo.
 * `rand` explícito (ex.: PRNG do acervo) deixa o resultado determinístico;
 * o padrão é `Math.random`. `indicePool` fixa o modelo do pool.
 */
export function classificarDocumento(
  nomeOriginal: string,
  seed = nomeOriginal,
  rand: Rand = Math.random,
  indicePool?: number,
): {
  tipo_documento: TipoDocumento
  nome_sugerido: string
  campos: CamposExtraidos
} {
  const idx =
    indicePool ?? config.indiceDocumento ?? indiceEstavel(seed, POOL.length)
  const modelo = POOL[idx % POOL.length]!

  const campos: CamposExtraidos = {}
  for (const [chave, valor] of Object.entries(modelo.campos)) {
    campos[chave] = { valor, confianca: variar(CONF_BASE[chave] ?? CONF_PADRAO, rand) }
  }

  if (rand() < config.probQuedaCampo) {
    const chaves = Object.keys(campos)
    const alvo = chaves[Math.floor(rand() * chaves.length)]!
    campos[alvo] = {
      ...campos[alvo]!,
      confianca: Number((0.2 + rand() * 0.3).toFixed(2)),
    }
  }

  return {
    tipo_documento: modelo.tipo_documento,
    nome_sugerido: nomeSugerido(modelo.tipo_documento, nomePrincipal(campos), nomeOriginal),
    campos,
  }
}

/** Titular do documento (nome, paciente, contratante…), para a lista de processados. */
export function titularDoDocumento(campos: CamposExtraidos): string | null {
  return nomePrincipal(campos) || null
}

/** Quantos modelos há no pool — usado pelo acervo. */
export const TAMANHO_POOL = POOL.length

export function nomeSugerido(tipo: string, nome: string, nomeOriginal: string): string {
  const base = nome.trim() ? nome : tipo
  const slug =
    base
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'documento'
  const hoje = new Date().toISOString().slice(0, 10)
  const ext = extensao(nomeOriginal)
  return `${tipo}_${slug}_${hoje}${ext}`
}

function extensao(nome: string): string {
  const m = /\.[a-z0-9]+$/i.exec(nome)
  return m ? m[0].toLowerCase() : ''
}

/**
 * Resultado da leitura. Se algum campo ficou abaixo do limiar de confiança, o
 * documento NÃO entra como pronto: volta com `aguardando_conferencia` e a lista
 * de campos incertos, para a conferência humana corrigir (enunciado).
 */
export function resultadoLeitura(
  id: string,
  recebidoEm: string,
  nomeOriginal: string,
  rand: Rand = Math.random,
  indicePool?: number,
): DocumentoConcluido | DocumentoAguardandoConferencia {
  const lido = classificarDocumento(nomeOriginal, id, rand, indicePool)
  const camposIncertos = Object.entries(lido.campos)
    .filter(([, c]) => c.confianca < config.limiarConferencia)
    .map(([chave]) => chave)

  const base = { id, recebido_em: recebidoEm, ...lido }
  return camposIncertos.length > 0
    ? { ...base, status: 'aguardando_conferencia', campos_incertos: camposIncertos }
    : { ...base, status: 'concluido' }
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
