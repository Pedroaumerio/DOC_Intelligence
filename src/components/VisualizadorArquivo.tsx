import { useEffect, useRef, useState } from 'react'
import estilos from './VisualizadorArquivo.module.css'

/**
 * Mostra o arquivo que a pessoa enviou nesta sessão, sem que ela precise ir
 * procurar no dispositivo de novo. O `File` fica em memória na sessão (não é
 * persistido — fato d); aqui viramos uma object URL só enquanto o modal está
 * aberto e a revogamos ao fechar.
 *
 * Imagem: `<img>` com girar (fato b — foto torta) e alternar ajuste/tamanho real.
 * PDF: `<iframe>` com o leitor nativo do navegador.
 * Outros formatos (ex.: HEIC, que a maioria dos navegadores não desenha):
 * mensagem honesta em vez de um quadro quebrado.
 *
 * O pai monta este componente só quando o modal deve aparecer e o desmonta ao
 * fechar — mais simples que sincronizar o atributo `open` do <dialog>.
 */
export function VisualizadorArquivo({
  arquivo,
  nome,
  onFechar,
}: {
  arquivo: File
  nome: string
  onFechar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [url, setUrl] = useState('')
  const [giro, setGiro] = useState(0)
  const [tamanhoReal, setTamanhoReal] = useState(false)

  // Object URL é um recurso do navegador com ciclo de vida próprio (criar /
  // revogar) — sincronizar isso é exatamente o papel de um efeito, e o setState
  // aqui roda uma vez por arquivo, não em cascata.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(arquivo)
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [arquivo])

  useEffect(() => {
    const dlg = ref.current
    dlg?.showModal()
    return () => dlg?.close()
  }, [])

  const ehImagem =
    /^image\/(jpeg|png|webp|gif|avif|bmp)$/.test(arquivo.type) ||
    (!arquivo.type && /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(nome))
  const ehPdf = arquivo.type === 'application/pdf' || /\.pdf$/i.test(nome)

  return (
    <dialog
      ref={ref}
      className={estilos.dialogo}
      aria-label={`Arquivo enviado: ${nome}`}
      onClose={onFechar}
      onClick={(e) => {
        if (e.target === ref.current) onFechar()
      }}
    >
      <div className={estilos.painel}>
        <header className={estilos.barra}>
          <p className={estilos.nome} title={nome}>
            {nome}
          </p>
          <div className={estilos.controles}>
            {ehImagem && (
              <>
                <button
                  type="button"
                  className={estilos.botao}
                  onClick={() => setGiro((g) => (g + 90) % 360)}
                >
                  Girar
                </button>
                <button
                  type="button"
                  className={estilos.botao}
                  onClick={() => setTamanhoReal((v) => !v)}
                >
                  {tamanhoReal ? 'Ajustar à tela' : 'Tamanho real'}
                </button>
              </>
            )}
            <button
              type="button"
              className={estilos.fechar}
              onClick={onFechar}
              aria-label="Fechar"
              autoFocus
            >
              ✕
            </button>
          </div>
        </header>

        <div className={estilos.area} data-scroll={tamanhoReal || undefined}>
          {url && ehImagem && (
            <img
              src={url}
              alt={`Arquivo enviado: ${nome}`}
              className={estilos.imagem}
              data-real={tamanhoReal || undefined}
              style={{ transform: `rotate(${giro}deg)` }}
            />
          )}
          {url && !ehImagem && ehPdf && (
            <iframe src={url} title={`Arquivo enviado: ${nome}`} className={estilos.pdf} />
          )}
          {url && !ehImagem && !ehPdf && (
            <p className={estilos.semPreview}>
              Não dá para pré-visualizar <strong>{nome}</strong> aqui
              {arquivo.type ? ` (formato ${arquivo.type})` : ''}. O arquivo continua
              guardado nesta sessão para reenvio.
            </p>
          )}
        </div>
      </div>
    </dialog>
  )
}
