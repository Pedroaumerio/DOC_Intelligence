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

---

## 7. Ideias registradas para depois

### Login individual por profissional, com escopo dos próprios clientes

Outra proposta era disponibilizar **login individual para cada profissional do
atendimento** e, a partir disso, **filtrar e buscar apenas os seus próprios
clientes** — cada pessoa vê o seu recorte do acervo, não o do escritório inteiro.

A funcionalidade não avançou nesta etapa para evitar a complexidade extra de
autenticação (sessão, expiração, recuperação, papéis) — bloco que o enunciado
tira do escopo e não caberia no prazo — e fica **pendente de validação com o
time**: ainda não está claro se o escritório quer essa parede entre profissionais
ou se o modelo é "todo mundo vê tudo, cada um trabalha o seu".

Onde isso encosta nos fatos do ambiente:

- **Fato (d)** — escopo por profissional é menor privilégio na prática: quem não
  precisa ver o documento do cliente de outra pessoa não vê.
- **Fato (g)** — login individual é pré-requisito do `claim` da fila de
  conferência; sem saber *quem* pegou o item, o `409` de conflito não tem a quem
  atribuir. A UI hoje já assume um usuário identificado (§6) — esta ideia é o
  passo seguinte, transformando essa identidade em filtro de dados.

No contrato, isso significaria `GET /documentos` ganhar um recorte por profissional
**no servidor** (não um filtro do cliente, que ainda traria os dados na resposta)
e o documento passar a carregar o profissional responsável.

### Busca vetorizada e RAG interno (Chroma + Hugging Face + Groq)

Outra ideia foi usar uma base vetorial local (Chroma, trychroma.com) com modelos
abertos de embedding (Hugging Face — ex.: `sentence-transformers`, `bge-m3`) para
indexar conteúdo por similaridade semântica, com duas aplicações possíveis.

A primeira, mais próxima do que esta entrega já faz: detectar **quase-duplicatas**
entre os documentos processados — o mesmo documento fotografado de novo, um pouco
recortado ou com iluminação diferente, que hoje passa pela deduplicação por hash
(SHA-256, só pega arquivo idêntico byte a byte) e vira uma nova chamada paga ao
fornecedor — e, quando a similaridade for alta o suficiente, evitar (ou pelo
menos sinalizar antes de) uma nova chamada de classificação/extração para o
modelo multimodal pago por documento.

A segunda é maior: um fluxo de **RAG (Retrieval-Augmented Generation)** para
permitir perguntas em linguagem natural sobre o acervo documental do escritório
— não só os documentos processados por esta fatia, mas manuais, relatórios,
contratos e históricos internos. O Chroma recuperaria só os 3 a 5 trechos mais
relevantes para a pergunta, e só esses trechos (não o acervo inteiro) seguiriam
para a Groq (console.groq.com) — que não indexa nada, só sintetiza a resposta
final a partir do que foi recuperado, aproveitando a inferência rápida e barata
das LPUs da Groq para devolver uma resposta quase em tempo real, citando a
origem. Essa segunda aplicação é uma expansão do produto, não faz parte da
triagem de documentos de cliente que o enunciado pede nesta entrega.

A funcionalidade não avançou nesta etapa por um conjunto de motivos: (1) divisão
de stack de IA — a Groq não disponibiliza endpoint nativo de embeddings, então a
vetorização precisaria rodar à parte, localmente; (2) governança — antes de
indexar o acervo interno do escritório (aplicação 2) é preciso definir controle
de acesso, para evitar que um colaborador consulte documento confidencial de
outro cliente ou setor via busca semântica — o mesmo problema que motivou a
ideia de login individual, logo acima; (3) superfície de dependências — banco
vetorial e pesos de modelo local contrariam, por ora, o princípio de dependência
mínima do fato (d) que guiou a stack atual (§5); e (4) escopo e prazo — o
enunciado desta entrega pede a triagem de documentos de cliente, não uma base de
conhecimento interna do escritório.

Onde isso encosta nos fatos do ambiente:

- **Fato (a)** — cada chamada ao fornecedor é paga; detectar quase-duplicata
  antes de reprocessar economiza uma chamada inteira, e a Groq pode ter um custo por
  chamada bem menor que o do fornecedor multimodal para a etapa de resposta.
- **Fato (c)** — hoje a deduplicação só pega arquivo idêntico byte a byte; a
  busca vetorial pegaria o mesmo documento reenviado com uma foto diferente, que
  o hash não identifica como duplicata.
- **Fato (d)** — rodando o modelo de embedding e o Chroma dentro do próprio
  ambiente do escritório, sem chamar um serviço de terceiro para vetorizar, o
  conteúdo bruto nunca sai da aplicação; na aplicação de RAG, só os poucos
  trechos recuperados (não o acervo inteiro) chegam à Groq. O cuidado que sobra
  é outro: os vetores derivados de campos como CPF e nome também são dado
  derivado de PII e precisam do mesmo tratamento de acesso e retenção que os
  campos originais.

No contrato, a primeira aplicação significaria uma etapa extra antes do
`POST /documentos` seguir pro fornecedor: comparar o novo documento contra a base
vetorial e, se a similaridade passar de um limiar, devolver o resultado do
documento parecido como sugestão, deixando a pessoa confirmar em vez de esperar
uma chamada nova. A segunda é um produto à parte, fora do contrato desta fatia;
antes de adotá-la, o próximo passo seria uma prova de conceito curta, limitando o
Chroma a um conjunto piloto de documentos públicos do escritório e medindo a
assertividade das respostas antes de abrir para documentos sensíveis.

Ainda na proteção de dados sensíveis, é viável configurar mecanismos de
contenção (*guardrails*) na camada da LLM: regras de sanitização e moderação
que mascaram ou bloqueiam PII (CPF, nome, endereço) antes da geração da
resposta — tanto no trecho recuperado que entra no prompt quanto no texto que
volta ao usuário. É a defesa que complementa o controle de acesso do item (2)
acima: o acesso decide *quem* pode perguntar sobre o quê; o *guardrail* decide
*o que* pode aparecer na resposta, mesmo para quem tem acesso — por exemplo,
devolver "consta um CPF cadastrado" em vez do número em si, a menos que a
pessoa tenha permissão explícita para vê-lo.
