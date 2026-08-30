/*
 * Contrato da API — fonte única de verdade compartilhada entre app, mock e testes
 * (ver docs/adr/0001-stack.md §3 e docs/contrato-api.md).
 *
 * Escopo desta fatia: receber o documento (POST /documentos) e acompanhar o
 * resultado da classificação/extração (GET /documentos/:id).
 */

/**
 * Tipo do documento classificado pelo fornecedor. A lista é aberta de propósito
 * (fato f: os documentos e os campos mudam); estes são os valores conhecidos hoje.
 * O conjunto de chaves em `campos` depende do tipo — identidade tem CPF e órgão
 * emissor, laudo tem médico e CRM, contrato tem partes e vigência, etc.
 */
export type TipoDocumento =
  | 'identidade'
  | 'contracheque'
  | 'carteira_trabalho'
  | 'laudo'
  | 'procuracao'
  | 'contrato'
  | (string & {})

/** Um campo extraído, sempre com o grau de confiança do modelo. */
export interface CampoExtraido {
  valor: string
  confianca: number
}

/** Mapa de campos extraídos. As chaves variam por tipo de documento (fato f). */
export type CamposExtraidos = Record<string, CampoExtraido>

export type StatusDocumento =
  | 'processando'
  | 'concluido'
  | 'aguardando_conferencia'
  | 'falhou'

interface DocumentoBase {
  id: string
  recebido_em: string
}

export interface DocumentoProcessando extends DocumentoBase {
  status: 'processando'
}

interface DocumentoLido extends DocumentoBase {
  tipo_documento: TipoDocumento
  nome_sugerido: string
  campos: CamposExtraidos
}

/** Leitura confiável — o documento pode ser dado como pronto. */
export interface DocumentoConcluido extends DocumentoLido {
  status: 'concluido'
}

/**
 * A máquina não teve confiança suficiente no que produziu (algum campo abaixo do
 * limiar). O documento NÃO entra como pronto — fica para conferência humana, que
 * corrige o que a máquina errou. `campos_incertos` diz o que revisar.
 */
export interface DocumentoAguardandoConferencia extends DocumentoLido {
  status: 'aguardando_conferencia'
  campos_incertos: string[]
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
  | DocumentoAguardandoConferencia
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
