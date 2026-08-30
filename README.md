# DOC Intelligence — Front-end (Trilha B)

Interface de atendimento para triagem, acompanhamento e conferência humana de
documentos processados por um modelo multimodal de terceiro.

O **desenvolvimento ainda não começou**. Este repositório contém apenas a stack
instalada e configurada, conforme a decisão registrada em
[`docs/adr/0001-stack.md`](docs/adr/0001-stack.md).

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
  api/          # clientes fetch + hooks do TanStack Query   (vazio)
  components/   # componentes de UI                          (vazio)
  routes/       # páginas do React Router                    (vazio)
  types/        # tipos do contrato da API                   (vazio)
  mocks/
    handlers.ts # handlers MSW do contrato                   (vazio, plugado)
    browser.ts  # worker MSW para o app
    server.ts   # servidor MSW para os testes
  test/
    setup.ts             # jest-dom + ciclo de vida do MSW
    stack.smoke.test.tsx  # valida o encanamento da stack
docs/
  adr/0001-stack.md   # decisão da stack
  contrato-api.md     # contrato da API (a definir)
public/
  mockServiceWorker.js  # worker do MSW (gerado por `msw init`)
```

## Próximo passo

Definir o contrato da API em `docs/contrato-api.md`, tipá-lo em `src/types/` e
implementar os handlers em `src/mocks/handlers.ts`. Só então ligar o
`QueryClientProvider`, o router e o `worker.start()` em `src/main.tsx`.
