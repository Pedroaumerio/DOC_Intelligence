# DOC Intelligence — Front-end (Trilha B)

Interface de atendimento para triagem, acompanhamento e conferência humana de
documentos processados por um modelo multimodal de terceiro.

## Fatias implementadas

Comportamentos 1–3 do produto-alvo: receber, devolver o resultado e consultar/listar.
Recortes em [`docs/fatia-atual.md`](docs/fatia-atual.md) (recebimento) e
[`docs/fatia-busca.md`](docs/fatia-busca.md) (busca).

- **Adicionar documento** (`/adicionar`): solta um ou mais arquivos (jpg/png/heic/pdf),
  cada um tem o SHA-256 calculado no navegador e é conferido contra o que já foi
  enviado nesta sessão antes de subir. O envio dispara `POST /documentos` e não
  trava a tela.
- **Resultados** (`/resultado`): visão ao vivo do que você enviou nesta sessão —
  faz *poll* de `GET /documentos/:id` (pausa em aba sem foco), mostra tipo, campos
  com confiança individual, nome padronizado. Espera explícita durante o
  processamento. Confiança baixa segura o documento para conferência humana. Em
  falha, mensagem humana e "tentar de novo".
- **Processados** (`/processados`): todos os documentos já processados (acervo
  fictício + sessão), `GET /documentos` paginado. Busca por nome do arquivo,
  titular, tipo ou qualquer valor de campo lido. Filtro por status. Clicar numa
  linha expande o resultado ali mesmo.

**Fora destas fatias:** fila de conferência, `claim`, correção de campo.

## Stack

| Camada | Escolha |
|---|---|
| Build / dev server | Vite |
| UI | React 19 |
| Linguagem | TypeScript (`strict`) |
| Estado de servidor | TanStack Query v5 |
| Roteamento | React Router v7 |
| Mock da API | MSW v2 (browser + node) |
| Testes | Vitest + Testing Library |
| Estilo | CSS Modules |

Estado de servidor fica no TanStack Query; o pouco estado de aplicação (fila de
upload, documentos enviados na sessão) é local, em `useState`/`useReducer` e um
contexto de sessão. Não há store global.

## Scripts

```bash
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm run build      # typecheck + build de produção
npm run preview    # serve o build de produção
npm test           # testes (Vitest, uma passada)
npm run test:watch # testes em watch
npm run coverage   # testes com relatório de cobertura
npm run typecheck  # apenas checagem de tipos
npm run lint       # oxlint
```

## Estrutura

```
src/
  app/queryClient.ts       # QueryClient — retry/backoff, 404 não-retentável
  api/
    client.ts              # fetch base + ErroApi (BASE_URL = /api)
    documentos.ts          # hooks: useEnviarDocumento, useDocumento, useDocumentos
  lib/
    hash.ts                # SHA-256 via crypto.subtle
    documento.ts           # rótulos, formatação, faixas de confiança
    prng.ts  useDebounce.ts
  features/upload/useFilaUpload.ts   # fila local do upload
  session/SessionDocumentos.tsx      # documentos da sessão (contexto + reducer)
  routes/
    router.tsx  Layout.tsx
    AdicionarDocumento.tsx  SecaoResultado.tsx  Processados.tsx
  components/
    Dropzone  FilaUpload  StatusPill  CartaoResultado  CampoExtraido
    IndicadorConfianca  EsperaProcessando  Logo
    ResultadoLido  LinhaProcessado  StatusBadge
  mocks/
    handlers.ts  store.ts  duble.ts  acervo.ts  browser.ts  server.ts
  test/setup.ts  test/utils.tsx
docs/
  adr/0001-stack.md   fatia-atual.md   fatia-busca.md   contrato-api.md
```

## Testes

Poucos, nos pontos onde uma regressão silenciosa custaria caro (ADR-0001 §3):

- `src/lib/hash.test.ts` — hash estável por conteúdo.
- `src/features/upload/useFilaUpload.test.tsx` — detecção de duplicata; rejeição de formato.
- `src/mocks/duble.test.ts` — campos por tipo; confiança baixa segura o documento.
- `src/components/CartaoResultado.test.tsx` — resultado a partir do schema; conferência; falha + retry.
- `src/mocks/busca.test.ts` — `GET /documentos` pagina, ordena, filtra por status e por texto.
- `src/routes/Processados.test.tsx` — lista, busca, paginação, expandir a linha.
- `src/lib/documento.test.ts` — rótulos e formatação de data.

## Identidade visual

Tokens da Lamarck Advogados em [`src/index.css`](src/index.css). O âmbar da marca
(`--acento`) fica reservado para ação primária, logo e foco; os estados de
confiança/processamento usam uma paleta semântica separada
(verde/neutro/vermelho), de propósito.
