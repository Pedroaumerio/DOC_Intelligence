import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { AdicionarDocumento } from './AdicionarDocumento'
import { SecaoResultado } from './SecaoResultado'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/adicionar" replace /> },
      { path: 'adicionar', element: <AdicionarDocumento /> },
      { path: 'resultado', element: <SecaoResultado /> },
      { path: '*', element: <Navigate to="/adicionar" replace /> },
    ],
  },
])
