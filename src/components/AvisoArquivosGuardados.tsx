import { useSessionDocumentos } from '../session/SessionDocumentos'
import estilos from './AvisoArquivosGuardados.module.css'

/**
 * Aviso + botão de purga dos arquivos que a sessão guarda em `sessionStorage`
 * (ver ADR-0001 §5, fato d). Aparece em "Resultados" e "Processados" — onde quer
 * que a pessoa veja o que enviou —, para a persistência não ficar invisível e
 * ter um jeito de apagar na hora (a máquina do atendimento é compartilhada).
 */
export function AvisoArquivosGuardados() {
  const { documentos, limpar } = useSessionDocumentos()
  if (documentos.length === 0) return null

  return (
    <p className={estilos.aviso}>
      {documentos.length === 1
        ? '1 arquivo que você enviou está guardado nesta aba'
        : `${documentos.length} arquivos que você enviou estão guardados nesta aba`}{' '}
      para reabrir — some ao fechar a aba.{' '}
      <button type="button" className={estilos.esquecer} onClick={limpar}>
        Esquecer agora
      </button>
    </p>
  )
}
