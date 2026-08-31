# Registro de prompts

Os pedidos que conduziram o projeto, em ordem. Operações de git (commit, push) e
iterações redundantes de ajuste foram omitidas; ficou o que mudou decisão ou
escopo. Rastreabilidade do raciocínio (ADR-0001).

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

## Leitura: da tentativa de OCR de volta ao mock fictício

> quando eu faço o upload do arquivo, ele está me retornando o do mock ao invés
> do da pessoa, eu enviei uma imagem.

Esclarecido: nesta fatia a leitura é um mock, não há OCR (escopo do enunciado).

> implemente algo que consiga ler as imagens

Adicionado OCR no navegador (Tesseract.js/WASM) + pré-processamento + heurísticas
de extração. Seguiram-se ajustes de qualidade sobre fotos reais (RG, CNH).

> estava lendo novamente o documento do desafio, e ele fala sobre usar o mock
> que era só para uma demonstração, então acho que seria como usar dados
> fictícios? seria isso?

Confirmado. O OCR contrariava o enunciado ("não há integração com nenhum serviço
externo nesta fatia") e o ADR (cada dependência é superfície de ataque).
**Revertido** para o mock fictício — escolha: *dublê com pool de identidades*.

---

## Mock: vários tipos de documento

> não serão somente identidades — crie mocks para caso de serem contracheques,
> carteiras de trabalho, laudos, procurações, contratos e se adaptem: por exemplo
> a identidade tem cpf, mas o laudo não. E assim por diante.

Pool de documentos fictícios por tipo (identidade, contracheque, carteira de
trabalho, laudo, procuração, contrato), cada um com o seu conjunto de campos.
`tipo_documento` aberto; a tela renderiza o que vier.

> pergunta: o mock pega aleatoriamente o tipo — não é preciso implementar que eu
> mande uma identidade e seja identidade, correto?

Correto. O dublê não lê o arquivo; classificação real de tipo depende do
fornecedor, fora do escopo desta fatia.

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

Decisões (perguntadas): acervo pré-carregado + sessão; página nova "Processados"
separada de "Resultados"; consultar expandindo a linha. `GET /documentos`
paginado com busca por texto livre e filtro por status.

---

## Conferência: editar documentos com pendência

> para os documentos que estiverem com alguma pendência adicione a opção de
> editar eles.

Botão "Conferir e corrigir" nos documentos `aguardando_conferencia`. Formulário
com todos os campos (incertos marcados); ao salvar (`PATCH /documentos/:id`) o
documento passa a `concluido`, campos corrigidos/incertos vão a 100%, nome
padronizado recalculado.

---

## Verificações de conformidade

> essa primeira parte inicial de envio está correta agora de acordo com o
> desafio? / de acordo com o que foi pedido no desafio o código está completo
> certo?

Revisão item a item contra `fatia-atual.md` / `fatia-busca.md` / ADR. Fora do
escopo entregue: `claim`/conflito `409` entre conferentes (fato g); visualizador
do documento (imagem com zoom/rotação).
