# ADR-0001 — Escolha da stack

- **Status:** aceita
- **Data:** 2026-08-30
- **Trilha:** B — Front-end
- **Contexto do projeto:** DOC Intelligence — interface de atendimento para triagem, acompanhamento e conferência humana de documentos processados por um modelo multimodal de terceiro.

---

## 1. Contexto e restrições

O enunciado define o problema antes de qualquer escolha técnica. As restrições que efetivamente pesam na decisão são:

1. **A API não existe.** O contrato é meu para definir e servir por mock, e o mock faz parte da entrega. A stack precisa tratar "servidor falso" como cidadão de primeira classe, não como gambiarra temporária.
2. **O processamento leva de 5 a 40 segundos e falha às vezes.** A tela vive de estado assíncrono: pendente, processando, falhou, aguardando conferência, pronto. Isso é o coração da UI, não um detalhe.
3. **Os campos extraídos mudam.** O modelo do fornecedor será trocado e os prompts vão mudar mais de uma vez no primeiro ano. Um formulário com campos escritos à mão vira dívida no primeiro mês.
4. **O prazo é de 3 dias corridos** e o que se avalia é o projeto, não a quantidade de funcionalidades. Toda ferramenta que exige tempo de aprendizado tira tempo da parte que vale nota.
5. **Não há deploy nem autenticação real na entrega.** Qualquer escolha justificada por "escala" ou "infra" seria justificativa vazia aqui.

---

## 2. Decisão

| Camada | Escolha | Papel na entrega |
|---|---|---|
| Build / dev server | **Vite** | Servidor de desenvolvimento e build de produção |
| Biblioteca de UI | **React** | Componentes da interface |
| Linguagem | **TypeScript** (`strict`) | Tipos do contrato da API compartilhados entre app, mock e testes |
| Estado de servidor | **TanStack Query v5** | Cache, polling, retry e estados de carregamento/erro |
| Roteamento | **React Router** | Envio, acompanhamento, fila de conferência, busca |
| Mock da API | **MSW v2** | Implementação do contrato que eu defino, no nível de rede |
| Testes | **Vitest + Testing Library** | Testes de comportamento sobre o mesmo mock |
| Estilo | **CSS Modules** | Escopo por componente, sem dependência adicional |

As versões exatas ficam fixadas no `package.json`; acima estão as versões maiores, que são o que importa para a decisão.

---

## 3. Por que cada uma

### React + TypeScript

É a combinação que eu escrevo com fluência, e num prazo de 3 dias essa é a razão dominante — o enunciado avalia a justificativa da escolha, e "escolhi o que eu sei defender" é uma justificativa mais honesta do que uma stack da moda usada pela metade.

O `strict` do TypeScript ganha um papel concreto neste projeto: **os tipos do contrato da API são a fonte única de verdade compartilhada entre o app, o mock e os testes.** Como o back-end não existe, esses tipos *são* o contrato. Se o mock e a tela discordarem, o compilador reclama antes de eu rodar qualquer coisa. Num projeto onde o servidor é imaginário, isso é a única disciplina disponível.

### Vite

Scaffold em um comando, servidor de desenvolvimento instantâneo, build de produção sem configuração. A alternativa relevante seria Next.js, descartada abaixo.

### TanStack Query — a decisão mais importante

O fato (a) do enunciado — chamadas de 5 a 40 segundos que às vezes falham — descreve exatamente o problema que o TanStack Query resolve. Sem ele, eu escreveria à mão, e pior, quatro coisas que ele já traz:

- **Polling com backoff** para acompanhar um documento em processamento, e que para sozinho quando a aba perde o foco — importante quando 800 documentos chegam entre 9h e 11h e cada aba aberta multiplica requisições.
- **Retry com backoff exponencial** para o erro intermitente do fornecedor, distinguindo o que se tenta de novo do que não se tenta.
- **Estados de carregamento e erro como dados**, não como flags booleanas espalhadas por `useState`. Com processamento de até 40 segundos, "carregando" não é um spinner: é um estado que precisa ser mostrado, ter idade e poder ser cancelado.
- **Invalidação de cache** — ao corrigir um campo na conferência, a lista e a fila se atualizam sem eu orquestrar isso na mão.

O ponto de projeto por trás disso: **estado de servidor não é estado de aplicação.** Misturar os dois num store global é o erro clássico dessa tela. Query cuida do que veio da API; o pouco estado local que sobra (documento aberto, filtro, fila de upload) fica em `useState`/`useReducer` no componente que o possui.

### MSW — mock no nível de rede

MSW intercepta `fetch` via Service Worker. Isso tem três consequências que nenhuma alternativa entrega junto:

1. **O código do app não sabe que o servidor é falso.** Nenhum `if (import.meta.env.DEV)` no meio da lógica. No dia em que a API real existir, muda-se a URL base e apaga-se o worker — nenhuma linha de componente é tocada.
2. **O mesmo mock serve o app e os testes.** Os handlers escritos para desenvolver são os handlers dos testes. Um só lugar define o contrato.
3. **Dá para simular o que interessa**, e é aqui que o mock deixa de ser enfeite: latência aleatória de 5 a 40 segundos, erro intermitente do fornecedor, resposta de baixa confiança que manda o documento para conferência, e `409` quando outra pessoa já pegou o item da fila. **Um mock que só devolve o caminho feliz esconde justamente os estados que esta tela existe para tratar.**

### Vitest + Testing Library

Vitest reaproveita a configuração do Vite — sem um segundo pipeline de build só para testar. Testing Library força testar comportamento visível em vez de estado interno, que é o que faz sentido cobrir aqui.

Não busco cobertura alta; o enunciado dispensa isso explicitamente. Testo poucas coisas escolhidas: a detecção de duplicata antes do upload, o conflito `409` na fila de conferência e a renderização do formulário a partir do schema. São os três pontos onde uma regressão silenciosa custaria dinheiro ou corromperia dados — e é isso que justifica um teste.

### CSS Modules

Escopo por componente sem instalar nada. Tailwind seria defensável, mas neste projeto o CSS não é o risco, e o enunciado diz com todas as letras que interface polida não é requisito. Uma dependência a menos para justificar.

---

## 4. Alternativas consideradas e descartadas

### Next.js — descartado

Traz SSR, rotas de API e um servidor. Nada disso serve aqui: **o produto é uma ferramenta interna atrás do login do escritório** (fato 5 do produto-alvo, "não por um navegador anônimo na internet aberta"). Não há SEO, não há primeira renderização crítica, não há visitante anônimo. As rotas de API do Next seriam um back-end de mentira competindo com o MSW — dois lugares definindo o mesmo contrato. Numa aplicação que é uma SPA autenticada por natureza, o SSR do Next é custo sem contrapartida.

### Redux / Zustand — descartado

Quase todo o estado desta tela é estado de servidor: a lista de documentos, o item da fila, o resultado da extração. Colocar isso num store global significa reimplementar cache, invalidação e revalidação à mão — que é o que o TanStack Query já faz e faz melhor. O estado genuinamente local (qual documento está aberto, o filtro da lista, a fila de upload do navegador) é local por natureza e não justifica um store. Se aparecer estado global de verdade, Zustand entra depois, com pouco atrito.

### json-server, ou `fetch` com dados fixos — descartado

Ambos vazam para dentro do app. `json-server` exige um segundo processo e não simula latência variável, falha intermitente nem `409` de conflito sem trabalho extra. Dados fixos no código obrigam a espalhar condicionais de ambiente na lógica e não têm como serem exercitados pelos testes de rede. MSW resolve os dois casos com o mesmo arquivo.

### Angular ou Vue — descartado

Não por qualidade — por honestidade. Eu não os escrevo com a fluência necessária para defender as decisões desta entrega numa conversa. Num exercício em que 20% da nota é a rastreabilidade do raciocínio, escolher uma ferramenta que eu não saberia justificar sob perguntas seria um mau negócio.

### OpenAPI + geração automática de cliente — descartado por ora

Tentador, já que o contrato é meu. Descartado porque o gerador cobra configuração adiantada e o contrato ainda vai mudar várias vezes nos próximos dois dias. Escrevo os tipos à mão e mantenho o contrato em `docs/contrato-api.md`. **Registro como dívida consciente:** com o contrato estável, gerar tipos a partir do OpenAPI passa a valer mais que escrevê-los.

---

## 5. Como a stack responde aos fatos do ambiente

O enunciado diz que os fatos (a)–(g) não pedem funcionalidades. Vários deles, porém, pedem escolhas de ferramenta:

| Fato | Consequência na stack |
|---|---|
| (a) 5–40 s, cobrado, falha às vezes | TanStack Query (polling, retry, backoff); MSW simulando latência e erro |
| (b) foto torta, nome de arquivo lixo | Validação no cliente antes do envio; visualizador com zoom e rotação; o nome sugerido pelo serviço substitui o nome do arquivo |
| (c) mesmo documento chega mais de uma vez | `crypto.subtle` (API nativa do browser) para hash SHA-256 antes do upload — evita pagar duas vezes pela mesma chamada. Sem dependência nova |
| (d) dado pessoal sensível | Nenhuma telemetria de terceiro na stack; nada de PII em log; sem persistência do documento no browser |
| (e) 150/dia, pico de 800 entre 9h e 11h | Envio em lote com concorrência limitada; polling que pausa em aba sem foco |
| (f) modelo e prompts vão mudar | Formulário gerado a partir do schema que vem da API, tipado em TypeScript. Campo novo numa identidade não exige deploy de front |
| (g) duas conferentes ao mesmo tempo | `claim` no item ao abrir e tratamento de `409`; MSW simula o conflito para que isso seja testável |

O fato (d) merece uma nota explícita: **cada dependência que entra no `package.json` de uma aplicação que exibe RG, contracheque e laudo é superfície de ataque e é um terceiro a auditar.** A stack acima tem sete dependências de runtime somadas. Isso é decisão de projeto, não economia.

---

## 6. O que fica de fora, de propósito

Registrado aqui para não parecer esquecimento:

- **Autenticação real** — dispensada pelo enunciado. A UI assume um usuário identificado e apenas exibe quem é, porque a fila de conferência precisa disso para o `claim` do fato (g).
- **Internacionalização** — o público é o atendimento de um escritório em Mossoró. Textos em português no código.
- **Testes end-to-end (Playwright/Cypress)** — o retorno não paga o tempo em 3 dias. Os testes de integração sobre o MSW cobrem os caminhos que importam.
- **Storybook** — a interface é pequena demais para justificar a manutenção do catálogo.
- **Biblioteca de componentes pronta** — a tela tem poucos componentes e um deles (o visualizador de documento ao lado dos campos) seria escrito à mão de qualquer jeito.
- **Virtualização de listas** — 800 documentos num dia de pico, mas nunca 800 numa tela; a lista é paginada pela API. Fica anotado como o primeiro lugar a olhar se a paginação não segurar.
