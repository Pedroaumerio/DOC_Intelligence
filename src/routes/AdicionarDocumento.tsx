import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dropzone } from '../components/Dropzone'
import { FilaUpload } from '../components/FilaUpload'
import { useFilaUpload } from '../features/upload/useFilaUpload'
import estilos from './AdicionarDocumento.module.css'

export function AdicionarDocumento() {
  const { itens, adicionar, remover, enviarTodos, prontosParaEnvio, ocupado } =
    useFilaUpload()
  const [enviando, setEnviando] = useState(false)
  const [enviados, setEnviados] = useState(0)

  const enviar = async () => {
    setEnviando(true)
    const quantos = prontosParaEnvio
    try {
      await enviarTodos()
      setEnviados((n) => n + quantos)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <h1 className={estilos.titulo}>Adicionar documento</h1>
      <p className={estilos.intro}>
        Envie um ou mais arquivos. Cada um é conferido contra o que já foi enviado
        nesta sessão antes de subir, e o processamento segue sozinho — você não
        precisa esperar nesta tela.
      </p>

      <Dropzone onArquivos={adicionar} />

      <FilaUpload itens={itens} onRemover={remover} />

      {itens.length > 0 && (
        <div className={estilos.acoes}>
          <button
            type="button"
            className={estilos.enviar}
            onClick={enviar}
            disabled={enviando || ocupado || prontosParaEnvio === 0}
          >
            {enviando
              ? 'Enviando…'
              : prontosParaEnvio > 0
                ? `Enviar ${prontosParaEnvio} ${prontosParaEnvio === 1 ? 'documento' : 'documentos'}`
                : 'Nada para enviar'}
          </button>
          {ocupado && (
            <span className={estilos.aviso}>Calculando a impressão dos arquivos…</span>
          )}
        </div>
      )}

      {enviados > 0 && (
        <p className={estilos.confirmacao}>
          {enviados} {enviados === 1 ? 'documento enviado' : 'documentos enviados'}.{' '}
          <Link to="/resultado" className={estilos.linkResultado}>
            Acompanhar em Resultados
          </Link>
        </p>
      )}
    </section>
  )
}
