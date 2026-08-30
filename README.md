# DOC Intelligence — Front-end (Trilha B)

Interface de atendimento para triagem, acompanhamento e conferência humana de
documentos processados por um modelo multimodal de terceiro.

## Fatia implementada

Receber o documento e devolver o resultado da classificação/extração — os
comportamentos 1 e 2 do produto-alvo. Recorte detalhado em
[`docs/fatia-atual.md`](docs/fatia-atual.md).

- **Adicionar documento** (`/adicionar`): solta um ou mais arquivos (jpg/png/heic/pdf),
  cada um tem o SHA-256 calculado no navegador e é conferido contra o que já foi
  enviado nesta sessão antes de subir. O envio dispara `POST /documentos` e não
  trava a tela.
- **Resultados** (`/resultado`): por documento enviado nesta sessão, faz *poll* de
  `GET /documentos/:id` (pausando quando a aba perde o foco) e mostra, ao concluir,
  o tipo, os campos extraídos com confiança individual e o nome de arquivo
  padronizado. Enquanto processa, uma espera explícita (até 40 s). Em falha,
  mensagem humana e "tentar de novo".

**Fora desta fatia:** fila de conferência, `claim`, correção de campo, busca/histórico.

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
  app/
    queryClient.ts        # QueryClient — retry/backoff, 404 não-retentável
  api/
    client.ts             # fetch base + ErroApi (BASE_URL = /api)
    documentos.ts          # enviar/buscar + hooks (useEnviarDocumento, useDocumento)
  lib/
    hash.ts               # SHA-256 via crypto.subtle
    documento.ts          # rótulos, formatação, faixas de confiança
  features/upload/
    useFilaUpload.ts      # fila local: lendo -> pronto/duplicado -> enviando -> enviado
  session/
    SessionDocumentos.tsx # documentos enviados nesta sessão (contexto + reducer)
  routes/
    router.tsx  Layout.tsx  AdicionarDocumento.tsx  SecaoResultado.tsx
  components/
    Dropzone  FilaUpload  StatusPill  CartaoResultado  CampoExtraido
    IndicadorConfianca  EsperaProcessando  Logo
  mocks/
    handlers.ts  duble.ts  browser.ts  server.ts
  test/
    setup.ts  utils.tsx
docs/
  adr/0001-stack.md   fatia-atual.md   contrato-api.md
```

## Testes

Poucos, nos pontos onde uma regressão silenciosa custaria caro (ADR-0001 §3):

- `src/lib/hash.test.ts` — hash estável por conteúdo.
- `src/features/upload/useFilaUpload.test.tsx` — detecção de duplicata pelo hash
  antes do envio; rejeição de formato.
- `src/components/CartaoResultado.test.tsx` — renderização do resultado a partir
  do schema (tipo, 5 campos com confiança, nome sugerido); falha + retry.

## Identidade visual

Tokens da Lamarck Advogados em [`src/index.css`](src/index.css). O âmbar da marca
(`--acento`) fica reservado para ação primária, logo e foco; os estados de
confiança/processamento usam uma paleta semântica separada
(verde/neutro/vermelho), de propósito.
