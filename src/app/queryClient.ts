import { QueryClient } from '@tanstack/react-query'
import { ErroApi } from '../api/client'

/**
 * Retry com backoff exponencial cobre o erro intermitente do fornecedor (fato a).
 * O 404 (documento ainda não conhecido) não é retentável — nunca vira 200.
 */
export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (falhas, erro) => {
          if (erro instanceof ErroApi && erro.status === 404) return false
          return falhas < 3
        },
        retryDelay: (tentativa) => Math.min(1000 * 2 ** tentativa, 15_000),
        staleTime: 5_000,
      },
    },
  })
}
