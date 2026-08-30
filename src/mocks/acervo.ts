/*
 * Acervo fictício de documentos "processados antes". É semeado a cada carga da
 * página (main.tsx) para a lista de processados e a busca terem sobre o que
 * operar mesmo sem enviar nada. Determinístico — sempre a mesma lista.
 */
import { criarPrng } from '../lib/prng'
import { resultadoFalhou, resultadoLeitura, TAMANHO_POOL } from './duble'
import { guardar } from './store'

/** Nomes de arquivo como chegam do celular do atendimento (fato b). */
const NOMES_ARQUIVO = [
  'WhatsApp Image 2026-08-18 at 09.14.22.jpeg',
  'IMG_20260817_154233.jpg',
  'scan0007.pdf',
  'documento (3).pdf',
  'foto rg frente.jpg',
  'CamScanner 08-15-2026 11.02.pdf',
  '20260814_093500.jpg',
  'contracheque julho.pdf',
  'laudo dr silva.pdf',
  'procuracao assinada.pdf',
  'anexo-4.pdf',
  'IMG-20260812-WA0031.jpg',
  'ctps pagina 3.jpg',
  'contrato final v2.pdf',
  'digitalizar0001.pdf',
  'rg verso.jpg',
  'holerite agosto.pdf',
  'exame de sangue.pdf',
  '3f9a2c.jpg',
  'documento sem nome.pdf',
  'foto 1.jpg',
  'arquivo importante.pdf',
  'IMG_4821.HEIC.jpg',
  'novo doc.pdf',
]

let semeado = false

/** Popula o store com o acervo. Idempotente. */
export function semearAcervo(): void {
  if (semeado) return
  semeado = true

  const rand = criarPrng(0xd_0c_2026)
  const agora = Date.now()

  NOMES_ARQUIVO.forEach((nome, i) => {
    const id = `doc_acervo_${String(i).padStart(2, '0')}`
    // datas espalhadas nos últimos ~16 dias, mais recentes primeiro
    const horasAtras = i * 14 + Math.floor(rand() * 12) + 1
    const recebidoEm = new Date(agora - horasAtras * 3_600_000).toISOString()

    const falhou = rand() < 0.1
    const indicePool = Math.floor(rand() * TAMANHO_POOL)
    const resultado = falhou
      ? resultadoFalhou(id, recebidoEm)
      : resultadoLeitura(id, recebidoEm, nome, rand, indicePool)

    guardar({
      id,
      recebido_em: recebidoEm,
      nome_original: nome,
      hash: `acervo_${i}`,
      pronto_em: 0,
      desfecho: falhou ? 'falhou' : 'lido',
      resultado,
    })
  })
}

/** Só para os testes: permite semear de novo depois de um reset. */
export function resetarAcervo(): void {
  semeado = false
}
