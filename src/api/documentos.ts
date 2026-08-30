import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Documento, EnvioDocumento, RespostaEnvio } from '../types/contrato'
import { getJson, postForm } from './client'

async function enviarDocumento(envio: EnvioDocumento): Promise<RespostaEnvio> {
  const form = new FormData()
  form.set('arquivo', envio.arquivo)
  form.set('hash', envio.hash)
  form.set('nome_original', envio.nome_original)
  return (await postForm('/documentos', form)) as RespostaEnvio
}

async function buscarDocumento(id: string): Promise<Documento> {
  return (await getJson(`/documentos/${id}`)) as Documento
}

/** Intervalo do poll de acompanhamento. Os testes reduzem para não esperar 3 s. */
let intervaloPollMs = 3000
export function definirIntervaloPoll(ms: number): void {
  intervaloPollMs = ms
}

export function documentoQuery(id: string) {
  return queryOptions({
    queryKey: ['documento', id],
    queryFn: () => buscarDocumento(id),
    // Poll enquanto o fornecedor não devolveu (5–40 s); para ao concluir/falhar.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // para de pollar em qualquer estado terminal
      return status === 'processando' || status === undefined ? intervaloPollMs : false
    },
    // Pausa em aba sem foco: 800 documentos entre 9h e 11h, cada aba multiplica.
    refetchIntervalInBackground: false,
  })
}

/** Acompanha um documento enviado nesta sessão até concluir ou falhar. */
export function useDocumento(id: string) {
  return useQuery(documentoQuery(id))
}

/** Envia um arquivo. A resposta é só o id; o processamento segue assíncrono. */
export function useEnviarDocumento() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: enviarDocumento,
    onSuccess: (resposta) => {
      // ja_existia = mesmo documento, mantém o que já está em cache.
      // Caso contrário (envio novo ou retry após falha) volta a "processando".
      if (!resposta.ja_existia) {
        client.setQueryData<Documento>(['documento', resposta.id], {
          id: resposta.id,
          status: 'processando',
          recebido_em: new Date().toISOString(),
        })
        void client.invalidateQueries({ queryKey: ['documento', resposta.id] })
      }
    },
  })
}
