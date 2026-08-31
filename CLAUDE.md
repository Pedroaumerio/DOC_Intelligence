# DOC Intelligence — contexto do projeto

Interface de atendimento (Trilha B — front-end) para triagem, acompanhamento e
conferência humana de documentos "processados por um modelo multimodal de
terceiro". Escritório Lamarck Advogados, Mossoró/RN. Ferramenta interna, sem
deploy nem autenticação real na entrega.

## O que ler primeiro

- `docs/adr/0001-stack.md` — por que cada peça da stack (o enunciado avalia a
  justificativa da escolha).
- `docs/fatia-atual.md` — recorte 1: receber o documento e devolver o resultado.
- `docs/fatia-busca.md` — recorte 2: listar/consultar os processados + conferência.
- `docs/contrato-api.md` — o contrato da API (endpoints, payloads).
- `prompts/` — todos os prompts na íntegra, em ordem, e "Onde o agente errou".
- `.claude/skills/` — skills do Claude Code configuradas para o projeto (ver o
  README de lá; disponíveis, mas não invocadas na construção).

## Regra que não pode ser esquecida

**Não há OCR nem serviço externo.** A "leitura" do documento é um **mock** que
devolve **dados fictícios** — é só para demonstração (ver `src/mocks/duble.ts`).
O mock simula o que a tela existe para tratar: latência de 5–40 s, falha
intermitente, confiança que varia por campo, e confiança baixa que segura o
documento para conferência humana. Se pedirem "leitura real", isso está fora do
escopo do enunciado — confirmar antes de trazer OCR ou dependências pesadas.

## Stack e arquitetura

- Vite + React 19 + TypeScript `strict`. Roteamento: React Router v7.
- **Estado de servidor** → TanStack Query. **Estado de aplicação** (fila de
  upload, documentos da sessão) → `useState`/`useReducer` + contexto. Sem store global.
- **MSW é "a API"** — `src/mocks/handlers.ts`. O app não sabe que o servidor é
  falso. Os handlers servem o app e os testes.
- **`src/types/contrato.ts` é a fonte única de verdade** do contrato, compartilhada
  entre app, mock e testes.
- Estilo: CSS Modules. Textos em português (público de Mossoró).
- O acento da marca (`--acento`, âmbar) é só para ação primária / logo / foco.
  Estados de confiança usam paleta semântica separada (verde/neutro/vermelho) —
  ver o cuidado em `docs/fatia-atual.md` §5.

## Comandos

```bash
npm run dev        # dev server em http://localhost:5173
npm test           # Vitest, uma passada
npm run typecheck  # tsc -b --noEmit
npm run lint       # oxlint
npm run build      # typecheck + build de produção
```

## Convenções

- Testes são poucos e escolhidos: pontos onde uma regressão silenciosa custaria
  caro (ADR-0001 §3). Não buscar cobertura alta.
- O mock tem knobs para os testes: `configurarDuble({ latenciaMinMs, probFalha,
  probQuedaCampo, indiceDocumento })` e `definirIntervaloPoll(ms)`.
- `src/mocks/acervo.ts` semeia ~24 documentos fictícios "processados antes" a
  cada carga da página (determinístico). Nada é persistido — os campos são PII.
- Commits: uma fatia coerente por commit, mensagem em português.

## Fora do escopo entregue

- Fila de conferência com `claim` e conflito `409` (duas conferentes ao mesmo
  tempo — fato g do ambiente).
- Visualizador do documento **lado a lado com os campos**, com zoom/pan de
  precisão. Existe uma versão simples: em "Resultados", "Ver arquivo enviado"
  abre o arquivo da sessão num modal (imagem com girar / tamanho real, PDF no
  leitor do navegador) — ver `src/components/VisualizadorArquivo.tsx`.
