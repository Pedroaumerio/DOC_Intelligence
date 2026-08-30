import { useId, useRef, useState } from 'react'
import estilos from './Dropzone.module.css'

const ACCEPT = 'image/jpeg,image/png,image/heic,.heic,application/pdf'

export function Dropzone({
  onArquivos,
}: {
  onArquivos: (arquivos: FileList | File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sobre, setSobre] = useState(false)
  const descricaoId = useId()

  const abrir = () => inputRef.current?.click()

  return (
    <div
      className={estilos.zona}
      data-sobre={sobre || undefined}
      role="button"
      tabIndex={0}
      aria-describedby={descricaoId}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrir()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault()
        setSobre(false)
        if (e.dataTransfer.files.length) onArquivos(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files?.length) onArquivos(e.target.files)
          e.target.value = ''
        }}
      />
      <p className={estilos.titulo}>Solte os documentos aqui</p>
      <p id={descricaoId} className={estilos.ajuda}>
        ou clique para escolher os arquivos. Aceita JPG, PNG, HEIC e PDF — vários
        de uma vez.
      </p>
    </div>
  )
}
