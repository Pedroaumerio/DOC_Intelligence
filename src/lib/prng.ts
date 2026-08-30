/**
 * Gerador pseudoaleatório determinístico (mulberry32). Serve para o acervo
 * fictício do mock ser sempre a mesma lista — sem isso a "lista de processados"
 * mudaria a cada reload e não daria para testar.
 */
export function criarPrng(semente: number): () => number {
  let estado = semente >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
