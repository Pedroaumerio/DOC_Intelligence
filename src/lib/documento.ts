import type { TipoDocumento } from '../types/contrato'

/** Rótulo legível do tipo de documento classificado pelo fornecedor. */
export function rotuloTipo(tipo: TipoDocumento | string): string {
  const mapa: Record<string, string> = {
    identidade: 'Identidade (RG)',
    contracheque: 'Contracheque',
    carteira_trabalho: 'Carteira de Trabalho',
    laudo: 'Laudo',
    procuracao: 'Procuração',
    contrato: 'Contrato',
  }
  return mapa[tipo] ?? titleCase(tipo)
}

/** Rótulo legível de um campo extraído. Chaves desconhecidas viram Title Case. */
export function rotuloCampo(chave: string): string {
  const mapa: Record<string, string> = {
    nome: 'Nome',
    filiacao: 'Filiação',
    data_nascimento: 'Data de nascimento',
    numero: 'Número',
    orgao_emissor: 'Órgão emissor',
    cpf: 'CPF',
    // contracheque
    matricula: 'Matrícula',
    cargo: 'Cargo',
    empregador: 'Empregador',
    competencia: 'Competência',
    salario_bruto: 'Salário bruto',
    salario_liquido: 'Salário líquido',
    // carteira de trabalho
    numero_ctps: 'Número da CTPS',
    serie: 'Série',
    pis: 'PIS',
    // laudo
    paciente: 'Paciente',
    data_exame: 'Data do exame',
    tipo_exame: 'Tipo de exame',
    medico_responsavel: 'Médico responsável',
    crm: 'CRM',
    conclusao: 'Conclusão',
    // procuração
    outorgante: 'Outorgante',
    outorgado: 'Outorgado',
    finalidade: 'Finalidade',
    tabeliao: 'Tabelionato',
    data_lavratura: 'Data da lavratura',
    validade: 'Validade',
    // contrato
    contratante: 'Contratante',
    contratada: 'Contratada',
    objeto: 'Objeto',
    valor: 'Valor',
    vigencia_inicio: 'Início da vigência',
    vigencia_fim: 'Fim da vigência',
    data_assinatura: 'Data da assinatura',
  }
  return mapa[chave] ?? titleCase(chave)
}

function titleCase(chave: string): string {
  return chave
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

/** Formata o valor de um campo para exibição (datas ISO viram dd/mm/aaaa). */
export function formatarValorCampo(_chave: string, valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return valor
}

export type NivelConfianca = 'alta' | 'media' | 'baixa'

/**
 * Faixa de confiança de um campo. Os limites são a regra de negócio que a
 * próxima fatia (conferência humana) vai consumir para decidir o que revisar.
 */
export function nivelConfianca(confianca: number): NivelConfianca {
  if (confianca >= 0.9) return 'alta'
  if (confianca >= 0.75) return 'media'
  return 'baixa'
}

export function rotuloConfianca(nivel: NivelConfianca): string {
  return { alta: 'Confiança alta', media: 'Confiança média', baixa: 'Confiança baixa' }[nivel]
}

/** Percentual inteiro, para exibir ao lado do campo. */
export function percentualConfianca(confianca: number): string {
  return `${Math.round(confianca * 100)}%`
}
