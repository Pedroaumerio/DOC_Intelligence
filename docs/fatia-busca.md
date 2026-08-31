# DOC Intelligence — fatia de busca

- **Cobre:** comportamento 3 do produto-alvo — consultar o resultado de um
  documento e listar os já processados. Mais a **edição/conferência** dos
  documentos que ficaram com pendência (`aguardando_conferencia`).
- **Não cobre:** fila de conferência com `claim` (duas pessoas ao mesmo tempo).
- Continuação de [`fatia-atual.md`](fatia-atual.md) (recebimento).

---

## 1. O que existe

Uma página nova, **Processados**, separada de "Resultados":

- **Resultados** — visão ao vivo do que você enviou *nesta sessão* (faz *poll*).
- **Processados** — todos os documentos já processados (acervo + sessão),
  paginado e com busca. Não faz *poll*.

## 2. Tela — Processados

| Elemento | Comportamento |
|---|---|
| Lista | `GET /documentos`, 10 por página, mais recente primeiro. Cada linha: nome do arquivo, titular, data, tipo, status |
| Busca | Texto livre — casa nome do arquivo, titular, tipo e **qualquer valor de campo lido** (ex.: buscar um CPF acha o documento). Debounce de 300 ms |
| Filtro de status | Todos / concluído / aguardando conferência / falhou / processando |
| Paginação | Anterior / Próxima, "Página X de Y". A página anterior fica visível enquanto a próxima carrega (`keepPreviousData`) |
| Consultar o resultado | Clicar numa linha **expande** ali mesmo: campos com confiança, nome padronizado, aviso de conferência ou mensagem de falha. O detalhe vem de `GET /documentos/:id` (carregado sob demanda) |
| Editar (pendências) | Documento `aguardando_conferencia` mostra "Conferir e corrigir". Abre um formulário com todos os campos (os incertos marcados); ao salvar (`PATCH /documentos/:id`), o documento passa a `concluido`, os campos tocados/incertos vão a 100% e o nome padronizado é recalculado. Mesmo botão aparece no cartão da sessão ("Resultados") |
| Ver arquivo enviado | Só para os documentos **enviados nesta sessão** (o `File` fica na sessão — memória + sessionStorage, fato d — e o acervo semeado não tem arquivo). Ao expandir a linha, "Ver arquivo enviado" abre o próprio arquivo num modal: imagem com girar (fato b — foto torta) e tamanho real; PDF no leitor do navegador; `.txt` como texto. DOC/DOCX/ODT/RTF/TIFF/HEIC o navegador não abre sozinho — aviso para abrir no aplicativo próprio. É a versão simples — não o visualizador lado a lado com os campos e zoom de precisão, que fica para a fatia da conferência |

## 3. O que o mock precisa

- `GET /documentos?pagina&tamanho&q&status` → `{ itens: DocumentoResumo[], pagina, tamanho, total, tem_proxima }` (ver [`contrato-api.md`](contrato-api.md)).
- Um **acervo** de ~24 documentos fictícios "processados antes", semeado a cada
  carga (`src/mocks/acervo.ts`), determinístico. Os envios da sessão entram no
  mesmo store. Os campos extraídos não são persistidos (fato d — são PII); o
  arquivo enviado na sessão fica em `sessionStorage` para a pessoa reabrir
  (ADR-0001 §5).

## 4. Decisões

- **Página separada, não substitui "Resultados".** A visão da sessão (com *poll*)
  e o histórico (busca) resolvem coisas diferentes; juntar deixaria as duas piores.
- **Expandir na linha, sem rota de detalhe.** A consulta é rápida e o contexto da
  lista ajuda; uma URL `/processados/:id` seria peso sem contrapartida agora.
- **Busca no cliente do mock, sobre todos os campos.** Como não há back-end, o
  filtro roda no handler do MSW varrendo o store. O `q` casa valores de campo
  porque é assim que o atendimento procura ("cadê o RG do fulano").

## 5. Critério de pronto

Abrir "Processados" sem ter enviado nada mostra o acervo paginado. Digitar o nome
de uma pessoa filtra para os documentos dela. Trocar o status filtra. Clicar num
item abre o resultado (tipo, campos, confiança) sem trocar de tela. Um documento
enviado agora aparece na lista como "processando".
