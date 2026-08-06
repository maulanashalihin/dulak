import type { ReactNode } from 'react'
import './Field.css'

/** Label + control + inline validation error. */
export default function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: unknown
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {String(error)}
        </p>
      ) : null}
    </div>
  )
}
