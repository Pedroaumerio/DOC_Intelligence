# Registro de prompts

Os pedidos técnicos que conduziram o projeto, em ordem. Operações de git,
perguntas e iterações redundantes de ajuste foram omitidas; ficou o que mudou
decisão ou escopo. Rastreabilidade do raciocínio (ADR-0001).

---

## Setup

> inicie o projeto com as stacks desse arquivo md, mas não inicie a parte do
> desenvolvimento. — *(anexo `0001-stack.md`)*

Scaffold Vite + React + TS `strict`, dependências do ADR, MSW + Vitest
configurados, estrutura de pastas vazia. Nenhum código de aplicação.

---

## Fatia 1 — receber o documento

> construa a primeira parte do projeto, a sessão de receber os documentos. Siga
> o escopo do projeto do .MD que eu estou te enviando. — *(anexo `fatia-agora.md`
> → virou `docs/fatia-atual.md`)*

Telas Adicionar documento e Resultados; hash SHA-256 no navegador; `POST
/documentos` assíncrono; poll com TanStack Query; espera explícita; identidade
visual Lamarck.

---

## Leitura

> implemente algo que consiga ler as imagens

OCR no navegador (Tesseract.js/WASM) com pré-processamento e heurísticas de
extração. **Revertido em seguida**: contrariava o enunciado ("não há integração
com nenhum serviço externo nesta fatia") e o ADR. A leitura voltou a ser o dublê
com dados fictícios.

---

## Mock: vários tipos de documento

> não serão somente identidades — crie mocks para caso de serem contracheques,
> carteiras de trabalho, laudos, procurações, contratos e se adaptem: por exemplo
> a identidade tem cpf, mas o laudo não. E assim por diante.

Pool de documentos fictícios por tipo (identidade, contracheque, carteira de
trabalho, laudo, procuração, contrato), cada um com o seu conjunto de campos.
`tipo_documento` aberto; a tela renderiza o que vier.

---

## Mock: confiança baixa segura o documento

> para os mocks, adicione o caso de erro igual eles pedem no desafio: quando a
> máquina não tiver confiança no que produziu, não deixar o documento entrar
> como pronto — ele fica para conferência humana, e a pessoa conferente corrige
> o que a máquina errou.

Novo estado terminal `aguardando_conferencia` + `campos_incertos`. Campo abaixo
do limiar (0,55) segura o documento; a tela marca os incertos e não trata como
finalizado.

---

## Fatia 2 — busca

> de início a construção da parte de busca. Permitir consultar o resultado de um
> documento e listar os já processados.

`GET /documentos` paginado, busca por texto livre e filtro por status. Página
nova "Processados" (acervo fictício + sessão), separada de "Resultados";
consultar o resultado expandindo a linha.

---

## Conferência: editar documentos com pendência

> para os documentos que estiverem com alguma pendência adicione a opção de
> editar eles.

Botão "Conferir e corrigir" nos documentos `aguardando_conferencia`. Formulário
com todos os campos (incertos marcados); ao salvar (`PATCH /documentos/:id`) o
documento passa a `concluido`, campos corrigidos/incertos vão a 100%, nome
padronizado recalculado.
