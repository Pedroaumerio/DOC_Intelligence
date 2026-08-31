/*
 * Formatos que o atendimento pode enviar. Fonte única de verdade — a área de
 * soltar (`Dropzone`) e a fila de upload (`useFilaUpload`) leem daqui, para não
 * divergirem.
 *
 * O escritório recebe documento de cliente por vários caminhos: foto de celular,
 * scan, PDF assinado, e o .doc/.docx da petição ou procuração. A "leitura" é o
 * dublê fictício (ver `duble.ts`) e não olha o conteúdo do arquivo, então aqui é
 * só a validação de entrada — o que dá para pré-visualizar é decisão separada do
 * `VisualizadorArquivo`.
 */

/** MIME → extensões conhecidas. */
const FORMATOS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic', '.heif'],
  'image/tiff': ['.tif', '.tiff'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.oasis.opendocument.text': ['.odt'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
  'text/plain': ['.txt'],
}

const MIMES = Object.keys(FORMATOS)
const EXTENSOES = [...new Set(Object.values(FORMATOS).flat())]

const RE_EXTENSAO = new RegExp(
  `(${EXTENSOES.map((e) => e.replace('.', '\\.')).join('|')})$`,
  'i',
)

/** Atributo `accept` do `<input type="file">`. */
export const ACCEPT_ARQUIVOS = [...MIMES, ...EXTENSOES].join(',')

/** Rótulo curto para a ajuda da tela e a mensagem de erro. */
export const ROTULO_FORMATOS = 'JPG, PNG, WEBP, HEIC, TIFF, PDF, DOC, DOCX, ODT, RTF e TXT'

/**
 * Um arquivo é aceito se o MIME é conhecido OU a extensão do nome bate — alguns
 * navegadores não preenchem `type` para .heic, .docx etc.
 */
export function formatoAceito(arquivo: { type: string; name: string }): boolean {
  return (
    (arquivo.type !== '' && MIMES.includes(arquivo.type)) ||
    RE_EXTENSAO.test(arquivo.name)
  )
}
