import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSessionDocumentos } from '../session/SessionDocumentos'
import estilos from './Layout.module.css'

function classe({ isActive }: { isActive: boolean }) {
  return isActive ? `${estilos.link} ${estilos.ativo}` : estilos.link
}

export function Layout() {
  const { documentos } = useSessionDocumentos()

  return (
    <div className={estilos.app}>
      <header className={estilos.cabecalho}>
        <Logo />
        <nav className={estilos.nav}>
          <NavLink to="/adicionar" className={classe}>
            Adicionar documento
          </NavLink>
          <NavLink to="/resultado" className={classe}>
            Resultados
            {documentos.length > 0 && (
              <span className={estilos.contador}>{documentos.length}</span>
            )}
          </NavLink>
          <NavLink to="/processados" className={classe}>
            Processados
          </NavLink>
        </nav>
      </header>
      <main className={estilos.conteudo}>
        <Outlet />
      </main>
    </div>
  )
}
