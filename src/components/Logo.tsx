import estilos from './Logo.module.css'

/**
 * Wordmark "LAMARCK" com a linha "SOCIEDADE DE ADVOGADOS" abaixo. Uso interno:
 * só o wordmark no cabeçalho, sem o hero de marketing (ver docs/fatia-atual.md §5).
 */
export function Logo() {
  return (
    <span className={estilos.logo}>
      <span className={estilos.marca}>LAMARCK</span>
      <span className={estilos.sub}>Sociedade de Advogados</span>
    </span>
  )
}
