import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSessionDocumentos } from '../session/SessionDocumentos'
import estilos from './Layout.module.css'

export function Layout() {
  const { documentos } = useSessionDocumentos()

  return (
    <div className={estilos.app}>
      <header className={estilos.cabecalho}>
        <Logo />
        <nav className={estilos.nav}>
          <NavLink
            to="/adicionar"
            className={({ isActive }) =>
              isActive ? `${estilos.link} ${estilos.ativo}` : estilos.link
            }
          >
            Adicionar documento
          </NavLink>
          <NavLink
            to="/resultado"
            className={({ isActive }) =>
              isActive ? `${estilos.link} ${estilos.ativo}` : estilos.link
            }
          >
            Resultados
            {documentos.length > 0 && (
              <span className={estilos.contador}>{documentos.length}</span>
            )}
          </NavLink>
        </nav>
      </header>
      <main className={estilos.conteudo}>
        <Outlet />
      </main>
    </div>
  )
}
