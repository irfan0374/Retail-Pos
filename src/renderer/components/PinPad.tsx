import { useState } from 'react'

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9']
]

/** iPhone-style numeric passcode entry — dots fill as digits are tapped, auto-submits at `length`. */
export function PinPad({
  length = 4,
  onComplete,
  disabled
}: {
  length?: number
  onComplete: (pin: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  function press(digit: string) {
    if (disabled || value.length >= length) return
    const next = value + digit
    setValue(next)
    if (next.length === length) {
      onComplete(next)
      setValue('')
    }
  }

  function backspace() {
    if (disabled) return
    setValue((prev) => prev.slice(0, -1))
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
              i < value.length ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {DIGIT_ROWS.flat().map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            disabled={disabled}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press('0')}
          disabled={disabled}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={disabled}
          className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
