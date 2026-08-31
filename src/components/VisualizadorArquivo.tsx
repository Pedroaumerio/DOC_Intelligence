import { useEffect, useState } from 'react'
import estilos from './VisualizadorArquivo.module.css'

/**
 * Mostra o arquivo que a pessoa enviou nesta sessão, sem que ela precise ir
 * procurar no dispositivo de novo. O `File` fica na sessão (memória +
 * sessionStorage — fato d); aqui viramos uma object URL só enquanto o modal
 * está aberto e a revogamos ao fechar.
 *
 * O que dá para pré-visualizar sem trazer dependência (ADR-0001 §5):
 * - imagem → `<img>` com girar (fato b — foto torta) e alternar ajuste/tamanho real;
 * - PDF → `<iframe>` com o leitor nativo do navegador;
 * - texto (.txt) → o conteúdo em `<pre>`.
 * O resto (DOC/DOCX/ODT/RTF/TIFF/HEIC) o navegador não abre sozinho — aviso
 * honesto em vez de um quadro quebrado; o arquivo segue guardado para reabrir
 * no aplicativo certo.
 *
 * Overlay próprio (não `<dialog>`): mais previsível entre navegadores e não
 * depende de `showModal()`, que sob o StrictMode pode falhar dentro de um efeito.
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
  const ehTexto = arquivo.type === 'text/plain' || /\.txt$/i.test(nome)
  const ehHeic = /\.(heic|heif)$/i.test(nome) || /^image\/hei[cf]$/.test(arquivo.type)
  const ehTiff = /\.tiff?$/i.test(nome) || arquivo.type === 'image/tiff'
  const ehImagem =
    !ehHeic &&
    !ehTiff &&
    (/^image\//.test(arquivo.type) ||
      (!arquivo.type && /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(nome)))
  const ehPdf = arquivo.type === 'application/pdf' || /\.pdf$/i.test(nome)

  const [url, setUrl] = useState('')
  const [texto, setTexto] = useState<string | null>(null)
  const [giro, setGiro] = useState(0)
  const [tamanhoReal, setTamanhoReal] = useState(false)
  const [falhouImagem, setFalhouImagem] = useState(false)

  // Object URL é um recurso do navegador com ciclo de vida próprio: criar aqui e
  // revogar na limpeza é o padrão da doc do React para este caso. Criar via
  // init de useState quebraria sob o StrictMode — a limpeza do "desmonte" falso
  // revoga a URL, mas o estado continua apontando para ela.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(arquivo)
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [arquivo])

  useEffect(() => {
    if (!ehTexto) return
    let vivo = true
    void arquivo.text().then((t) => {
      if (vivo) setTexto(t.slice(0, 200_000))
    })
    return () => {
      vivo = false
    }
  }, [arquivo, ehTexto])

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAntes
    }
  }, [onFechar])

  const mostraImagem = ehImagem && !falhouImagem

  return (
    <div
      className={estilos.fundo}
      role="dialog"
      aria-modal="true"
      aria-label={`Arquivo enviado: ${nome}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div className={estilos.painel}>
        <header className={estilos.barra}>
          <p className={estilos.nome} title={nome}>
            {nome}
          </p>
          <div className={estilos.controles}>
            {mostraImagem && (
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

        <div className={estilos.area} data-scroll={(tamanhoReal || ehTexto) || undefined}>
          {url && mostraImagem && (
            <img
              src={url}
              alt={`Arquivo enviado: ${nome}`}
              className={estilos.imagem}
              data-real={tamanhoReal || undefined}
              style={{ transform: `rotate(${giro}deg)` }}
              onError={() => setFalhouImagem(true)}
            />
          )}
          {!mostraImagem && ehTexto && <pre className={estilos.texto}>{texto}</pre>}
          {url && !mostraImagem && !ehTexto && ehPdf && (
            <iframe src={url} title={`Arquivo enviado: ${nome}`} className={estilos.pdf} />
          )}
          {!mostraImagem && !ehTexto && !ehPdf && (
            <p className={estilos.semPreview}>
              Não dá para pré-visualizar <strong>{nome}</strong> aqui
              {arquivo.type ? ` (formato ${arquivo.type})` : ''} — abra no aplicativo
              próprio para esse tipo de arquivo. Ele continua guardado nesta sessão.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
