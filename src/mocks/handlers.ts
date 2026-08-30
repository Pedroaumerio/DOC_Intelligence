/*
 * Implementação do contrato que a Trilha B define (ver docs/contrato-api.md).
 * O mesmo arquivo serve o app (browser.ts) e os testes (server.ts).
 *
 * - POST /documentos      recebe o arquivo
 * - GET  /documentos/:id  acompanha/consulta o resultado
 * - GET  /documentos      lista/busca os já processados (paginado)
 *
 * A latência de 5–40 s, a falha intermitente e a queda de confiança de um campo
 * são simuladas aqui — ver duble.ts. O acervo fictício vem de acervo.ts.
 */
import { http, HttpResponse, type RequestHandler } from 'msw'
import type {
  CamposExtraidos,
  ConferenciaDocumento,
  Documento,
  DocumentoConcluido,
  DocumentoResumo,
  RespostaEnvio,
  RespostaListaDocumentos,
  StatusDocumento,
} from '../types/contrato'
import { BASE_URL } from '../api/client'
import { resetarAcervo } from './acervo'
import {
  fornecedorFalhou,
  latenciaDuble,
  nomeSugerido,
  resetarDuble,
  resultadoFalhou,
  resultadoLeitura,
  titularDoDocumento,
} from './duble'
import {
  guardar,
  limparStore,
  novoId,
  porHash,
  registros,
  type Registro,
} from './store'

/** Zera o estado do mock entre testes (chamado no src/test/setup.ts). */
export function resetarMock(): void {
  limparStore()
  resetarDuble()
  resetarAcervo()
}

/** Resultado atual de um registro (processando enquanto não fica pronto). */
function resolver(reg: Registro): Documento {
  if (Date.now() < reg.pronto_em) {
    return { id: reg.id, status: 'processando', recebido_em: reg.recebido_em }
  }
  reg.resultado ??=
    reg.desfecho === 'falhou'
      ? resultadoFalhou(reg.id, reg.recebido_em)
      : resultadoLeitura(reg.id, reg.recebido_em, reg.nome_original)
  return reg.resultado
}

function resumo(reg: Registro, doc: Documento): DocumentoResumo {
  const lido =
    doc.status === 'concluido' || doc.status === 'aguardando_conferencia'
      ? doc
      : null
  return {
    id: reg.id,
    nome_original: reg.nome_original,
    nome_sugerido: lido?.nome_sugerido ?? null,
    tipo_documento: lido?.tipo_documento ?? null,
    titular: lido ? titularDoDocumento(lido.campos) : null,
    status: doc.status,
    recebido_em: reg.recebido_em,
  }
}

/** Tudo que o texto livre `q` pode casar. */
function textoParaBusca(reg: Registro, doc: Documento): string {
  const partes: string[] = [reg.nome_original, doc.status]
  if (doc.status === 'concluido' || doc.status === 'aguardando_conferencia') {
    partes.push(doc.tipo_documento, doc.nome_sugerido)
    for (const c of Object.values(doc.campos)) partes.push(c.valor)
  }
  return partes.join(' ').toLowerCase()
}

export const handlers: RequestHandler[] = [
  http.get(`${BASE_URL}/documentos`, ({ request }) => {
    const url = new URL(request.url)
    const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1)
    const tamanho = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get('tamanho')) || 10),
    )
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const status = url.searchParams.get('status') as StatusDocumento | null

    let linhas = [...registros.values()].map((reg) => {
      const doc = resolver(reg)
      return { resumo: resumo(reg, doc), busca: textoParaBusca(reg, doc) }
    })

    if (status) linhas = linhas.filter((l) => l.resumo.status === status)
    if (q) linhas = linhas.filter((l) => l.busca.includes(q))
    linhas.sort((a, b) => b.resumo.recebido_em.localeCompare(a.resumo.recebido_em))

    const total = linhas.length
    const inicio = (pagina - 1) * tamanho
    const itens = linhas.slice(inicio, inicio + tamanho).map((l) => l.resumo)

    return HttpResponse.json<RespostaListaDocumentos>({
      itens,
      pagina,
      tamanho,
      total,
      tem_proxima: inicio + tamanho < total,
    })
  }),

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
    guardar({
      id,
      recebido_em: new Date().toISOString(),
      nome_original: nome,
      hash,
      pronto_em: Date.now() + latenciaDuble(),
      desfecho: fornecedorFalhou() ? 'falhou' : 'lido',
    })

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
    return HttpResponse.json<Documento>(resolver(reg))
  }),

  // Conferência humana: confirma/corrige um documento pendente -> concluído.
  http.patch(`${BASE_URL}/documentos/:id`, async ({ params, request }) => {
    const reg = registros.get(String(params.id))
    if (!reg) {
      return HttpResponse.json({ erro: 'nao_encontrado' }, { status: 404 })
    }
    const atual = resolver(reg)
    if (atual.status !== 'aguardando_conferencia') {
      return HttpResponse.json({ erro: 'nao_editavel' }, { status: 409 })
    }

    const { campos } = (await request.json()) as ConferenciaDocumento
    const incertos = new Set(atual.campos_incertos)
    const novos: CamposExtraidos = {}
    for (const [chave, campo] of Object.entries(atual.campos)) {
      const valorNovo = campos[chave]
      const mudou = valorNovo !== undefined && valorNovo !== campo.valor
      novos[chave] = {
        valor: valorNovo ?? campo.valor,
        // conferido por humano: campo corrigido ou que estava incerto vira 1
        confianca: mudou || incertos.has(chave) ? 1 : campo.confianca,
      }
    }

    const conferido: DocumentoConcluido = {
      id: reg.id,
      recebido_em: reg.recebido_em,
      status: 'concluido',
      tipo_documento: atual.tipo_documento,
      nome_sugerido: nomeSugerido(
        atual.tipo_documento,
        titularDoDocumento(novos) ?? '',
        reg.nome_original,
      ),
      campos: novos,
    }
    reg.resultado = conferido
    reg.desfecho = 'lido'
    return HttpResponse.json<Documento>(conferido)
  }),
]
