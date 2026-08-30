import type { TipoDocumento } from '../types/contrato'

/** Rótulo legível do tipo de documento classificado pelo modelo. */
export function rotuloTipo(tipo: TipoDocumento | string): string {
  const mapa: Record<string, string> = {
    identidade: 'Identidade (RG)',
  }
  return mapa[tipo] ?? tipo
}

/** Rótulo legível de um campo extraído. Chaves desconhecidas viram Title Case. */
export function rotuloCampo(chave: string): string {
  const mapa: Record<string, string> = {
    nome: 'Nome',
    filiacao: 'Filiação',
    data_nascimento: 'Data de nascimento',
    numero: 'Número',
    orgao_emissor: 'Órgão emissor',
  }
  if (mapa[chave]) return mapa[chave]
  return chave
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

/** Formata o valor de um campo para exibição (datas ISO viram dd/mm/aaaa). */
export function formatarValorCampo(chave: string, valor: string): string {
  if (chave === 'data_nascimento') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }
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
