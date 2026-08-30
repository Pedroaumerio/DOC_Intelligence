/*
 * Estado em memória do mock — os documentos que o "servidor" conhece. Vive só
 * enquanto a aba está aberta: o acervo fictício é semeado a cada carga
 * (ver acervo.ts) e os envios da sessão se somam a ele. Nada é persistido —
 * os campos extraídos são PII (fato d).
 */
import type { Documento } from '../types/contrato'

export interface Registro {
  id: string
  recebido_em: string
  nome_original: string
  hash: string
  /** Instante (epoch ms) em que o resultado do fornecedor fica disponível. */
  pronto_em: number
  desfecho: 'lido' | 'falhou'
  /** Congelado no primeiro acesso após ficar pronto, para não oscilar no poll. */
  resultado?: Documento
}

export const registros = new Map<string, Registro>()
export const porHash = new Map<string, string>()

let seq = 0

export function novoId(): string {
  seq += 1
  return `doc_${Date.now().toString(36)}${seq.toString(36).padStart(3, '0')}`
}

export function guardar(reg: Registro): void {
  registros.set(reg.id, reg)
  porHash.set(reg.hash, reg.id)
}

export function limparStore(): void {
  registros.clear()
  porHash.clear()
  seq = 0
}
