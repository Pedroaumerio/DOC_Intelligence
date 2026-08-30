# Contrato da API — DOC Intelligence

> Fonte única de verdade do contrato (ver [ADR-0001](adr/0001-stack.md) §3). Os
> tipos em [`src/types/contrato.ts`](../src/types/contrato.ts) e os handlers em
> [`src/mocks/handlers.ts`](../src/mocks/handlers.ts) espelham o que está aqui.
> Base URL: `/api`.

Escopo implementado: **receber o documento** (ver [`fatia-atual.md`](fatia-atual.md))
e **consultar/listar os processados** (ver [`fatia-busca.md`](fatia-busca.md)).
Fila de conferência e `claim` ficam para a próxima fatia.

---

## `GET /documentos` — lista/busca dos processados

Query params (todos opcionais):

| Param | Padrão | Descrição |
|---|---|---|
| `pagina` | `1` | Página 1-based |
| `tamanho` | `10` | Itens por página (máx. 50) |
| `q` | — | Texto livre: casa nome do arquivo, titular, tipo e valores dos campos |
| `status` | — | `concluido` \| `aguardando_conferencia` \| `falhou` \| `processando` |

Ordenado por `recebido_em` decrescente.

```json
{
  "itens": [
    {
      "id": "doc_...",
      "nome_original": "WhatsApp Image 2026-08-18 at 09.14.22.jpeg",
      "nome_sugerido": "procuracao_francisco-aumerio-nogueira-vieira_2026-08-30.jpeg",
      "tipo_documento": "procuracao",
      "titular": "Francisco Aumério Nogueira Vieira",
      "status": "concluido",
      "recebido_em": "2026-08-30T09:14:22.000Z"
    }
  ],
  "pagina": 1,
  "tamanho": 10,
  "total": 24,
  "tem_proxima": true
}
```

`nome_sugerido`, `tipo_documento` e `titular` vêm `null` enquanto processa ou se
falhou. O **detalhe** de um documento (campos, confiança, conferência) vem de
`GET /documentos/:id`.

---

## `POST /documentos`

Recebe um arquivo. A resposta é só um identificador — o processamento pelo
fornecedor (5–40 s, e às vezes falha) segue assíncrono.

**Request** — `multipart/form-data`

| Campo | Tipo | Descrição |
|---|---|---|
| `arquivo` | arquivo | Imagem (jpg/png/heic) ou PDF |
| `hash` | string | SHA-256 hex do conteúdo, calculado no navegador antes de subir (fato c) |
| `nome_original` | string | Nome do arquivo como veio do dispositivo do atendimento |

**Response `201`** (documento novo) / **`200`** (hash já visto ou retry após falha)

```json
{ "id": "doc_...", "status": "processando", "ja_existia": false }
```

`ja_existia: true` quando o mesmo `hash` já havia sido enviado — o servidor não
gasta outra chamada de processamento e devolve o `id` que já existia.

---

## `GET /documentos/:id`

Estado atual de um documento. O app faz *poll* deste endpoint a cada 3 s
enquanto o `status` for `processando`; para em qualquer estado terminal
(`concluido`, `aguardando_conferencia`, `falhou`). O poll pausa quando a aba
perde o foco (fato e).

**Enquanto processa**

```json
{ "id": "doc_...", "status": "processando", "recebido_em": "2026-08-30T14:00:00.000Z" }
```

**Concluído**

```json
{
  "id": "doc_...",
  "status": "concluido",
  "recebido_em": "2026-08-30T14:00:00.000Z",
  "tipo_documento": "identidade",
  "nome_sugerido": "identidade_joao-da-silva_2026-08-30.jpeg",
  "campos": {
    "nome":            { "valor": "João da Silva", "confianca": 0.97 },
    "filiacao":        { "valor": "Maria da Silva e José da Silva", "confianca": 0.93 },
    "data_nascimento": { "valor": "1990-04-12", "confianca": 0.99 },
    "numero":          { "valor": "12.345.678-9", "confianca": 0.88 },
    "orgao_emissor":   { "valor": "SSP/RN", "confianca": 0.71 }
  }
}
```

Cada campo traz sempre um `confianca` (0–1). **O conjunto de chaves em `campos`
depende do `tipo_documento`** e pode mudar sem alteração de front (fato f) — a
tela renderiza o que vier. Exemplos:

| `tipo_documento` | campos |
|---|---|
| `identidade` | `nome`, `filiacao`, `data_nascimento`, `numero`, `orgao_emissor` (às vezes `cpf`) |
| `contracheque` | `nome`, `cpf`, `matricula`, `cargo`, `empregador`, `competencia`, `salario_bruto`, `salario_liquido` |
| `carteira_trabalho` | `nome`, `cpf`, `data_nascimento`, `filiacao`, `numero_ctps`, `serie`, `pis` |
| `laudo` | `paciente`, `data_exame`, `tipo_exame`, `medico_responsavel`, `crm`, `conclusao` (sem CPF) |
| `procuracao` | `outorgante`, `outorgado`, `finalidade`, `tabeliao`, `data_lavratura`, `validade` |
| `contrato` | `contratante`, `contratada`, `objeto`, `valor`, `vigencia_inicio`, `vigencia_fim`, `data_assinatura` |

Datas vêm em ISO (`aaaa-mm-dd`); o front exibe `dd/mm/aaaa`.

**Aguardando conferência** — a máquina não teve confiança suficiente

Quando algum campo fica abaixo do limiar de confiança, o documento **não entra
como pronto**: volta com `aguardando_conferencia` (mesmo formato do concluído) +
`campos_incertos`, para a conferência humana revisar (enunciado). A tela mostra o
resultado, marca os campos incertos e não trata como finalizado.

```json
{
  "id": "doc_...",
  "status": "aguardando_conferencia",
  "recebido_em": "2026-08-30T14:00:00.000Z",
  "tipo_documento": "contrato",
  "nome_sugerido": "contrato_maria-de-fatima-sales_2026-08-30.pdf",
  "campos": {
    "contratante": { "valor": "Maria de Fátima Sales", "confianca": 0.91 },
    "contratada":  { "valor": "Lamarck Sociedade de Advogados", "confianca": 0.21 },
    "objeto":      { "valor": "Patrocínio em ação de inventário", "confianca": 0.82 }
  },
  "campos_incertos": ["contratada"]
}
```

**Falhou**

```json
{
  "id": "doc_...",
  "status": "falhou",
  "recebido_em": "2026-08-30T14:00:00.000Z",
  "erro": "falha_fornecedor",
  "mensagem": "O serviço de leitura não respondeu desta vez. Isso costuma ser passageiro — tente enviar de novo."
}
```

Reenviar o mesmo arquivo depois de uma falha reprocessa mantendo o mesmo `id`.

**`404`** — `id` desconhecido: `{ "erro": "nao_encontrado" }`. Não é retentável.

---

## O dublê do fornecedor

Não há serviço externo nem OCR nesta fatia — o mock é só para demonstração e os
dados são fictícios. A classificação/extração é a função em
[`src/mocks/duble.ts`](../src/mocks/duble.ts), que:

- responde com latência aleatória (5–18 s por padrão no exercício; produção
  observa até 40 s);
- falha de forma intermitente (~12% dos envios) para exercitar o estado `falhou`;
- devolve um de vários documentos fictícios — identidade, contracheque, carteira
  de trabalho, laudo, procuração, contrato — cada um com o seu conjunto de campos
  (o #0 é o exemplo do enunciado, "João da Silva"). Estável por documento;
- varia a confiança de cada campo e às vezes derruba um campo de propósito
  (`probQuedaCampo`); quando algum campo fica abaixo de `limiarConferencia`
  (0,55), o documento volta como `aguardando_conferencia` em vez de `concluido`.

Os testes zeram latência e aleatoriedade e fixam o documento via
`configurarDuble({ indiceDocumento })`.

### O acervo

Para a lista de processados e a busca terem sobre o que operar, o mock semeia um
**acervo fictício** ([`src/mocks/acervo.ts`](../src/mocks/acervo.ts)) a cada carga
da página: ~24 documentos "processados antes", com nomes de arquivo de celular,
tipos e status variados, datas espalhadas nos últimos dias. É determinístico
(PRNG com semente fixa — [`src/lib/prng.ts`](../src/lib/prng.ts)). Os envios da
sessão se somam a ele. Nada é persistido: os campos são PII (fato d), então tudo
some ao recarregar e o acervo é semeado de novo.

---

## Dívida consciente

- Com o contrato estável, gerar os tipos a partir de um schema OpenAPI passa a
  valer mais que mantê-los à mão (ver ADR-0001 §4).
- A lista de processados não faz *poll*: um documento enviado que ainda está
  `processando` fica assim na lista até uma nova busca. A visão ao vivo é a de
  "Resultados"; "Processados" é histórico.
