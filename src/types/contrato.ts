/*
 * Contrato da API — fonte única de verdade compartilhada entre app, mock e testes
 * (ver docs/adr/0001-stack.md §3 e docs/contrato-api.md).
 *
 * Escopo desta fatia: receber o documento (POST /documentos) e acompanhar o
 * resultado da classificação/extração (GET /documentos/:id).
 */

/** Tipos de documento que o modelo do fornecedor sabe classificar. */
export type TipoDocumento = 'identidade'

/** Um campo extraído, sempre com o grau de confiança do modelo. */
export interface CampoExtraido {
  valor: string
  confianca: number
}

/** Mapa de campos extraídos. As chaves variam por tipo de documento (fato f). */
export type CamposExtraidos = Record<string, CampoExtraido>

export type StatusDocumento = 'processando' | 'concluido' | 'falhou'

interface DocumentoBase {
  id: string
  recebido_em: string
}

export interface DocumentoProcessando extends DocumentoBase {
  status: 'processando'
}

export interface DocumentoConcluido extends DocumentoBase {
  status: 'concluido'
  tipo_documento: TipoDocumento
  nome_sugerido: string
  campos: CamposExtraidos
}

export interface DocumentoFalhou extends DocumentoBase {
  status: 'falhou'
  erro: string
  mensagem: string
}

/** Resposta de GET /documentos/:id — o formato depende do status. */
export type Documento =
  | DocumentoProcessando
  | DocumentoConcluido
  | DocumentoFalhou

/** Corpo de POST /documentos (multipart/form-data). */
export interface EnvioDocumento {
  arquivo: File
  /** SHA-256 hex do conteúdo, calculado no navegador antes de subir (fato c). */
  hash: string
  nome_original: string
}

/** Resposta de POST /documentos — só o identificador; o resto é assíncrono. */
export interface RespostaEnvio {
  id: string
  status: 'processando'
  /** true quando o mesmo hash já tinha sido enviado — não reprocessa (fato c). */
  ja_existia: boolean
}
