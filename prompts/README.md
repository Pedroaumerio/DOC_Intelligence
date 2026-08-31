# prompts/

Todos os prompts desta conversa, **em ordem**, um arquivo por mensagem
(`NN.md`), como foram escritos — sem correção de digitação, sem reescrita.
Inclui as mensagens de git ("faça o commit", "de o push") e as perguntas.

## Onde o agente errou

No pedido "implemente algo que consiga ler as imagens" (`09`), o agente construiu
um leitor de OCR de verdade no navegador (Tesseract.js em WebAssembly, com
pré-processamento de imagem e heurísticas de extração de campos), sem checar
antes se isso contrariava uma restrição que já estava fixada: a ADR-0001, escrita
antes desse pedido, já dizia que não haveria integração com nenhum serviço
externo nesta fatia, e que o "dublê" do fornecedor deveria continuar sendo uma
função de mock com dados fictícios. Na prática, o OCR também não funcionou bem —
a leitura saía errada, com texto ilegível no lugar dos campos esperados
(`prompts/10.md`–`14.md`) —, e foi esse problema técnico que me fez pedir para
reverter. Um OCR local não é literalmente um serviço externo, e pode até fazer
sentido numa evolução futura do produto, fora do escopo desta entrega, mas o erro
do agente foi ter implementado algo que já contrariava uma decisão de arquitetura
registrada, sem levantar esse conflito antes de começar. A leitura voltou a ser o
dublê com dados fictícios (`src/mocks/duble.ts`), como estava antes, e a regra
passou a estar registrada de forma explícita no `CLAUDE.md` ("não há OCR nem
serviço externo") para o mesmo desvio não se repetir.

## Fidelidade

Os textos vêm da transcrição da conversa. As mensagens curtas estão na íntegra.
As mensagens de depuração do OCR **10–14** coladas com dumps de JSON e prints do
resultado foram reproduzidas o mais próximo possível do original — os blocos de
JSON são aproximados (valores dos campos e trechos de `texto_reconhecido`).
`[imagem anexada]` e `[interrompeu a resposta do agente]` marcam anexos e
interrupções.

**Nota de privacidade:** as imagens anexadas em `10` e `11` eram fotos reais de
um documento de identidade (usadas para testar a leitura antes de o OCR ser
abandonado — ver "Onde o agente errou", acima). A descrição do anexo foi
generalizada nesses dois arquivos. Em `12`, o OCR chegou a reconhecer um nome
real de pessoa física dentro do ruído da leitura errada; esse trecho foi
redigido. O enunciado veda dado real de pessoa física no repositório — essas são
as únicas edições de conteúdo neste diretório; o resto é cópia literal. O mesmo
nome real também tinha sido copiado, sem essa ligação ter sido percebida na hora,
para dentro de `src/mocks/duble.ts` como um titular "fictício" — já corrigido lá
e em `docs/contrato-api.md`.

## Índice

| # | Assunto |
|---|---|
| 01 | setup da stack (anexo `0001-stack.md`) |
| 02–04 | commit inicial, push, `git remote add` |
| 05 | fatia 1: receber o documento (anexo `fatia-agora.md`) |
| 06–07 | commit, push |
| 08 | "está retornando o do mock ao invés do da pessoa" |
| 09 | "implemente algo que consiga ler as imagens" |
| 10–12 | depuração do OCR sobre fotos reais |
| 13 | "onde esta sendo feita a lógica de leitura?" |
| 14 | OCR numa CNH |
| 15 | "o mock era só para demonstração… seria dados fictícios?" |
| 16 | commit (interrompendo o pedido de múltiplos tipos) |
| 17 | push |
| 18 | mocks para vários tipos de documento |
| 19 | "o tipo é aleatório… correto?" |
| 20–21 | commit, push |
| 22 | confiança baixa segura o documento para conferência |
| 23–24 | commit, push |
| 25 | fatia 2: busca / listar processados |
| 26 | editar documentos com pendência |
| 27–28 | dois commits, push |
| 29 | "o código está completo?" |
| 30 | adicionar `CLAUDE.md` |
| 31–33 | diretório de prompts, ajustes |
| 34 | README com passo a passo |
| 35 | este diretório (prompts na íntegra) |
