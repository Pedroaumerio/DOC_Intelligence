/*
 * Implementação do contrato que a Trilha B define (ver docs/contrato-api.md).
 * O mesmo arquivo serve o app (browser.ts) e os testes (server.ts).
 *
 * Escopo desta fatia: POST /documentos (recebe) e GET /documentos/:id (acompanha).
 * A latência de 5–40 s, a falha intermitente do fornecedor e a queda de confiança
 * de um campo são simuladas aqui — ver duble.ts.
 */
import { http, HttpResponse, type RequestHandler } from 'msw'
import type { Documento, RespostaEnvio } from '../types/contrato'
import {
  fornecedorFalhou,
  latenciaDuble,
  resetarDuble,
  resultadoFalhou,
  resultadoLeitura,
} from './duble'
import { BASE_URL } from '../api/client'

interface Registro {
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

const registros = new Map<string, Registro>()
const porHash = new Map<string, string>()
let seq = 0

/** Zera o estado do mock entre testes (chamado no src/test/setup.ts). */
export function resetarMock(): void {
  registros.clear()
  porHash.clear()
  seq = 0
  resetarDuble()
}

function novoId(): string {
  seq += 1
  return `doc_${Date.now().toString(36)}${seq.toString(36).padStart(3, '0')}`
}

export const handlers: RequestHandler[] = [
  http.post(`${BASE_URL}/documentos`, async ({ request }) => {
    const form = await request.formData()
    const hash = String(form.get('hash') ?? '')
    const nome = String(form.get('nome_original') ?? 'documento')

    const existenteId = porHash.get(hash)
    if (existenteId) {
      const existente = registros.get(existenteId)
      if (existente && existente.resultado?.status === 'falhou') {
        // "Tentar de novo" após falha: reprocessa mantendo o mesmo id.
        existente.pronto_em = Date.now() + latenciaDuble()
        existente.desfecho = fornecedorFalhou() ? 'falhou' : 'lido'
        existente.resultado = undefined
        return HttpResponse.json<RespostaEnvio>(
          { id: existenteId, status: 'processando', ja_existia: false },
          { status: 200 },
        )
      }
      // Mesmo documento já enviado — não gasta outra chamada de processamento.
      return HttpResponse.json<RespostaEnvio>(
        { id: existenteId, status: 'processando', ja_existia: true },
        { status: 200 },
      )
    }

    const id = novoId()
    registros.set(id, {
      id,
      recebido_em: new Date().toISOString(),
      nome_original: nome,
      hash,
      pronto_em: Date.now() + latenciaDuble(),
      desfecho: fornecedorFalhou() ? 'falhou' : 'lido',
    })
    porHash.set(hash, id)

    return HttpResponse.json<RespostaEnvio>(
      { id, status: 'processando', ja_existia: false },
      { status: 201 },
    )
  }),

  http.get(`${BASE_URL}/documentos/:id`, ({ params }) => {
    const reg = registros.get(String(params.id))
    if (!reg) {
      return HttpResponse.json({ erro: 'nao_encontrado' }, { status: 404 })
    }

    if (Date.now() < reg.pronto_em) {
      return HttpResponse.json<Documento>({
        id: reg.id,
        status: 'processando',
        recebido_em: reg.recebido_em,
      })
    }

    reg.resultado ??=
      reg.desfecho === 'falhou'
        ? resultadoFalhou(reg.id, reg.recebido_em)
        : resultadoLeitura(reg.id, reg.recebido_em, reg.nome_original)

    return HttpResponse.json<Documento>(reg.resultado)
  }),
]
