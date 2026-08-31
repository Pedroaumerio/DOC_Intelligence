# DOC Intelligence — Front-end (Trilha B)

Interface de atendimento para triagem, acompanhamento e conferência humana de
documentos processados por um modelo multimodal de terceiro.

## Como rodar

### Pré-requisitos

- **Node.js 20.19+ ou 22.12+** (testado no Node 24). Vem com o `npm`.
- **Git** (para clonar).

Não precisa de back-end, banco de dados nem variáveis de ambiente. A API é
simulada no navegador pelo [MSW](https://mswjs.io/): as chamadas de rede são
interceptadas e um mock devolve dados fictícios (ver
[`docs/contrato-api.md`](docs/contrato-api.md)). Um acervo de ~24 documentos
fictícios é semeado sozinho a cada carga da página.

### Passo a passo

```bash
# 1. clonar
git clone https://github.com/Pedroaumerio/DOC_Intelligence.git
cd DOC_Intelligence

# 2. instalar as dependências (lê o package.json / package-lock.json)
npm install

# 3. subir o servidor de desenvolvimento
npm run dev
```

Abra **http://localhost:5173**. O app cai em `/adicionar`; solte um arquivo
qualquer (jpg/png/pdf), clique em enviar e acompanhe em "Resultados"; "Processados"
já vem com o acervo.

Para conferir a build de produção:

```bash
npm run build     # gera dist/
npm run preview    # serve dist/ em http://localhost:4173
```

Verificações (opcional): `npm test`, `npm run typecheck`, `npm run lint`.

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
- **Conferência**: documento com pendência (`aguardando_conferencia`) tem
  "Conferir e corrigir" — a pessoa ajusta os campos e ele passa a pronto
  (`PATCH /documentos/:id`).

**Fora destas fatias:** fila de conferência com `claim` (duas conferentes ao
mesmo tempo, conflito `409`); visualizador do documento (zoom/rotação).

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

## Dependências

`npm install` instala tudo a partir do `package.json`. As versões exatas ficam no
`package-lock.json`.

**Runtime** (`dependencies`):

| Pacote | Para quê |
|---|---|
| `react`, `react-dom` | UI |
| `@tanstack/react-query` | cache, polling, retry e estados de carregamento/erro |
| `react-router-dom` | rotas (Adicionar / Resultados / Processados) |

**Desenvolvimento / build / teste** (`devDependencies`):

| Pacote | Para quê |
|---|---|
| `vite`, `@vitejs/plugin-react` | dev server e build |
| `typescript`, `@types/*` | tipos (`strict`) |
| `msw` | mock da API no nível de rede (browser + node) |
| `vitest`, `@vitest/coverage-v8`, `jsdom` | testes |
| `@testing-library/react` · `/dom` · `/jest-dom` · `/user-event` | testes de comportamento |
| `oxlint` | lint |

Nenhuma dependência de runtime além das três acima — decisão de projeto
(ADR-0001 §5): cada pacote num app que exibe RG e contracheque é superfície de
ataque. Fontes (`Sora`, `Poppins`) vêm do Google Fonts via `<link>` no
`index.html`; sem internet, cai no fallback do sistema.

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
