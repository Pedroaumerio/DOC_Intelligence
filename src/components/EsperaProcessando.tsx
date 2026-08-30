import { useEffect, useState } from 'react'
import estilos from './EsperaProcessando.module.css'

/**
 * Estado de espera do processamento — não um spinner genérico. A pessoa precisa
 * saber que pode levar até 40 s e que a tela atualiza sozinha (§3 do recorte).
 */
export function EsperaProcessando({ desde }: { desde: string }) {
  const [segundos, setSegundos] = useState(() => decorridos(desde))

  useEffect(() => {
    const t = setInterval(() => setSegundos(decorridos(desde)), 1000)
    return () => clearInterval(t)
  }, [desde])

  return (
    <div className={estilos.raiz} role="status">
      <div className={estilos.barra} aria-hidden="true">
        <span className={estilos.pulso} />
      </div>
      <p className={estilos.mensagem}>
        Ainda estamos lendo este documento. Pode levar até 40 segundos — esta tela
        atualiza sozinha quando terminar.
      </p>
      <p className={estilos.tempo}>{segundos}s aguardando o resultado</p>
    </div>
  )
}

function decorridos(desde: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(desde).getTime()) / 1000))
}
