import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { criarQueryClient } from './app/queryClient'
import { router } from './routes/router'
import { SessionDocumentosProvider } from './session/SessionDocumentos'

export function App() {
  const [queryClient] = useState(criarQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <SessionDocumentosProvider>
        <RouterProvider router={router} />
      </SessionDocumentosProvider>
    </QueryClientProvider>
  )
}
