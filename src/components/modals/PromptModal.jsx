import { useEffect, useRef, useState } from 'react'

export default function PromptModal({ isOpen, title, label, placeholder, initialValue = '', onConfirm, onClose }) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialValue])

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError(`Silakan isi nama ${label.toLowerCase()}.`)
      return
    }
    onConfirm(trimmed)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">×</button>
        </div>
        <label>
          {label}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError('')
            }}
            placeholder={placeholder}
          />
        </label>
        {error && (
          <div style={{ color: '#b83a2e', fontSize: '12px', marginTop: '6px', fontFamily: "'DM Mono', monospace" }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: '#edf2ea',
              border: '1px solid var(--line)',
              borderRadius: '7px',
              color: 'var(--ink)',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              padding: '11px',
            }}
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="submit"
            className="primary"
            style={{ flex: 1.2, height: '42px', padding: 0 }}
            disabled={!value.trim()}
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  )
}
