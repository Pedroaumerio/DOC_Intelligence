# Contrato da API — DOC Intelligence

> Fonte única de verdade do contrato (ver [ADR-0001](adr/0001-stack.md) §3). Os
> tipos em [`src/types/contrato.ts`](../src/types/contrato.ts) e os handlers em
> [`src/mocks/handlers.ts`](../src/mocks/handlers.ts) espelham o que está aqui.
> Base URL: `/api`.

Escopo implementado: a fatia de **receber o documento e devolver a
classificação/extração** (ver [`fatia-atual.md`](fatia-atual.md)). Fila de
conferência, `claim` e busca geral ficam para a próxima fatia.

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
enquanto o `status` for `processando`; para ao chegar em `concluido` ou `falhou`.
O poll pausa quando a aba perde o foco (fato e).

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

Cada campo traz sempre um `confianca` (0–1). O conjunto de chaves em `campos`
depende do `tipo_documento` e pode mudar sem alteração de front (fato f).

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
- devolve uma de ~5 identidades fictícias (a #0 é o exemplo do enunciado,
  "João da Silva"), estável por documento;
- varia a confiança de cada campo e às vezes derruba um campo de propósito, para
  que a próxima fatia (conferência humana) tenha o caso de baixa confiança.

Os testes zeram latência e aleatoriedade e fixam a identidade via
`configurarDuble()`.

---

## Dívida consciente

Com o contrato estável, gerar os tipos a partir de um schema OpenAPI passa a
valer mais que mantê-los à mão (ver ADR-0001 §4).
