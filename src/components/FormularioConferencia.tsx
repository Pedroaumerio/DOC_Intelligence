import { useState } from 'react'
import { useConferirDocumento } from '../api/documentos'
import { rotuloCampo } from '../lib/documento'
import type { DocumentoAguardandoConferencia } from '../types/contrato'
import estilos from './FormularioConferencia.module.css'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Conferência humana: a pessoa confirma/corrige os campos de um documento
 * pendente. Ao salvar, ele passa a `concluido` (enunciado).
 */
export function FormularioConferencia({
  doc,
  onCancelar,
}: {
  doc: DocumentoAguardandoConferencia
  onCancelar: () => void
}) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(doc.campos).map(([chave, campo]) => [chave, campo.valor]),
    ),
  )
  const { mutate, isPending, isError } = useConferirDocumento(doc.id)
  const incertos = new Set(doc.campos_incertos)

  const alterar = (chave: string, valor: string) =>
    setValores((v) => ({ ...v, [chave]: valor }))

  return (
    <form
      className={estilos.form}
      onSubmit={(e) => {
        e.preventDefault()
        mutate(valores, { onSuccess: onCancelar })
      }}
    >
      <p className={estilos.instrucao}>
        Confira os campos e corrija o que a máquina errou. Ao salvar, o documento
        entra como pronto.
      </p>

      <div className={estilos.campos}>
        {Object.keys(doc.campos).map((chave) => {
          const incerto = incertos.has(chave)
          const valor = valores[chave] ?? ''
          return (
            <label key={chave} className={estilos.campo} data-incerto={incerto || undefined}>
              <span className={estilos.rotulo}>
                {rotuloCampo(chave)}
                {incerto && <span className={estilos.marca}> · revisar</span>}
              </span>
              {chave === 'conclusao' ? (
                <textarea
                  className={estilos.input}
                  name={chave}
                  rows={3}
                  value={valor}
                  onChange={(e) => alterar(chave, e.target.value)}
                />
              ) : (
                <input
                  className={estilos.input}
                  name={chave}
                  type={ISO.test(valor) ? 'date' : 'text'}
                  value={valor}
                  onChange={(e) => alterar(chave, e.target.value)}
                />
              )}
            </label>
          )
        })}
      </div>

      {isError && (
        <p className={estilos.erro} role="alert">
          Não foi possível salvar agora. Tente de novo.
        </p>
      )}

      <div className={estilos.acoes}>
        <button type="submit" className={estilos.salvar} disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar conferência'}
        </button>
        <button
          type="button"
          className={estilos.cancelar}
          onClick={onCancelar}
          disabled={isPending}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
