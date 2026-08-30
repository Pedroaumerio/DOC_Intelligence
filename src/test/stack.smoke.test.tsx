import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { server } from '../mocks/server'

/**
 * Smoke test do setup da stack (ADR-0001): confirma que React, TanStack Query,
 * MSW e Testing Library estão plugados e conversando. Pode ser removido quando
 * os testes de comportamento reais existirem.
 */
test('React + TanStack Query + MSW respondem juntos', async () => {
  server.use(
    http.get('/api/ping', () => HttpResponse.json({ status: 'ok' })),
  )

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  function Ping() {
    const { data } = useQuery({
      queryKey: ['ping'],
      queryFn: () => fetch('/api/ping').then((r) => r.json() as Promise<{ status: string }>),
    })
    return <span>{data?.status ?? 'carregando'}</span>
  }

  render(
    <QueryClientProvider client={client}>
      <Ping />
    </QueryClientProvider>,
  )

  expect(await screen.findByText('ok')).toBeInTheDocument()
})
