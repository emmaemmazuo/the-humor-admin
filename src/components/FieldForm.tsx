'use client'

import { useState } from 'react'
import type { FieldType } from '@/lib/resources'

export type FormField = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
}

type Values = Record<string, string | boolean>

export default function FieldForm({
  fields,
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  fields: FormField[]
  initial?: Record<string, unknown>
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (values: Values) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {}
    for (const f of fields) {
      const x = initial?.[f.name]
      v[f.name] =
        f.type === 'boolean' ? x === true : x === null || x === undefined ? '' : String(x)
    }
    return v
  })

  const set = (name: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [name]: value }))
  const box = 'w-full border rounded px-3 py-2 bg-white'

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <label key={f.name} className="block text-sm">
          <span className="block text-gray-600 mb-1">
            {f.label}
            {f.required ? ' *' : ''}
          </span>
          {f.type === 'textarea' ? (
            <textarea
              rows={3}
              className={box}
              value={String(values[f.name] ?? '')}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : f.type === 'boolean' ? (
            <input
              type="checkbox"
              checked={values[f.name] === true}
              onChange={(e) => set(f.name, e.target.checked)}
            />
          ) : f.type === 'select' ? (
            <select
              className={box}
              value={String(values[f.name] ?? '')}
              onChange={(e) => set(f.name, e.target.value)}
            >
              <option value="">Select…</option>
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === 'number' ? 'number' : 'text'}
              step={f.type === 'number' ? 'any' : undefined}
              className={box}
              value={String(values[f.name] ?? '')}
              onChange={(e) => set(f.name, e.target.value)}
            />
          )}
        </label>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(values)}
          disabled={pending}
          className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded border text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
