import { Link } from 'react-router-dom'
import { CartaoResultado } from '../components/CartaoResultado'
import { useSessionDocumentos } from '../session/SessionDocumentos'
import estilos from './SecaoResultado.module.css'

export function SecaoResultado() {
  const { documentos } = useSessionDocumentos()

  return (
    <section>
      <h1 className={estilos.titulo}>Resultados</h1>
      <p className={estilos.intro}>
        O que o processamento devolveu para os documentos enviados nesta sessão.
        Cada cartão atualiza sozinho quando o resultado fica pronto.
      </p>

      {documentos.length === 0 ? (
        <div className={estilos.vazio}>
          <p>Nenhum documento enviado ainda nesta sessão.</p>
          <Link to="/adicionar" className={estilos.link}>
            Adicionar um documento
          </Link>
        </div>
      ) : (
        <div className={estilos.pilha}>
          {documentos.map((doc) => (
            <CartaoResultado key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </section>
  )
}
