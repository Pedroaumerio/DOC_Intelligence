/*
 * Cliente HTTP base. O app não sabe que o servidor é falso — o MSW intercepta
 * no nível de rede (ver docs/adr/0001-stack.md §"MSW"). No dia em que a API real
 * existir, muda-se BASE_URL e apaga-se o worker; nenhum componente é tocado.
 */
export const BASE_URL = '/api'

export class ErroApi extends Error {
  readonly status: number
  readonly corpo: unknown

  constructor(status: number, corpo: unknown) {
    super(`API respondeu ${status}`)
    this.name = 'ErroApi'
    this.status = status
    this.corpo = corpo
  }
}

async function tratar(resposta: Response): Promise<unknown> {
  const texto = await resposta.text()
  const corpo = texto ? JSON.parse(texto) : null
  if (!resposta.ok) throw new ErroApi(resposta.status, corpo)
  return corpo
}

export function getJson(caminho: string): Promise<unknown> {
  return fetch(`${BASE_URL}${caminho}`).then(tratar)
}

export function postForm(caminho: string, form: FormData): Promise<unknown> {
  return fetch(`${BASE_URL}${caminho}`, { method: 'POST', body: form }).then(tratar)
}

export function patchJson(caminho: string, corpo: unknown): Promise<unknown> {
  return fetch(`${BASE_URL}${caminho}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  }).then(tratar)
}
