/**
 * SHA-256 hex do conteúdo de um arquivo, calculado no navegador com a API nativa
 * `crypto.subtle` — sem dependência nova (ver docs/fatia-atual.md §2, fato c).
 * Serve para detectar o mesmo documento chegando mais de uma vez antes de gastar
 * uma chamada de processamento com ele.
 */
export async function hashArquivo(arquivo: Blob): Promise<string> {
  const buffer = await arquivo.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return paraHex(digest)
}

/** SHA-256 hex de uma string UTF-8. Usado nos testes e para dados pequenos. */
export async function hashTexto(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return paraHex(digest)
}

function paraHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
