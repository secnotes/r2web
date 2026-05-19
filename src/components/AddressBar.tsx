import { useState, useRef, useEffect } from 'react'
import { useNavigation } from '../hooks/useNavigation'

export function AddressBar() {
  const { inputAddress, setInputAddress, goToInput, currentAddressFormatted, undo, redo, canUndo, canRedo, goToEntry } = useNavigation()
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsEditing(true)
        inputRef.current?.focus()
      }
      if (e.key === 'u' && !e.ctrlKey && !e.metaKey) {
        undo()
      }
      if (e.key === 'U' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) {
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    goToInput()
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setInputAddress('')
    }
  }

  return (
    <div className="address-bar">
      <button
        className="nav-btn"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (u)"
      >
        ◀
      </button>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputAddress}
            onChange={e => setInputAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter address (e.g., 0x1000 or main)"
            className="address-input"
            autoFocus
          />
        </form>
      ) : (
        <div
          className="current-address"
          onClick={() => setIsEditing(true)}
          title="Click to edit (g)"
        >
          {currentAddressFormatted}
        </div>
      )}
      <button
        className="nav-btn"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (U)"
      >
        ▶
      </button>
      <button
        className="nav-btn entry-btn"
        onClick={goToEntry}
        title="Go to entry point"
      >
        Entry
      </button>
      <style>{`
        .address-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
        }
        .nav-btn {
          padding: 4px 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        .nav-btn:hover:not(:disabled) {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .entry-btn {
          font-size: 0.75rem;
        }
        .current-address {
          flex: 1;
          padding: 6px 12px;
          background: var(--bg-secondary);
          border-radius: 4px;
          color: var(--address);
          cursor: pointer;
          text-align: center;
          font-size: 0.9rem;
        }
        .current-address:hover {
          background: var(--bg-primary);
        }
        .address-input {
          flex: 1;
          padding: 6px 12px;
          background: var(--bg-primary);
          border: 1px solid var(--accent);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.9rem;
          text-align: center;
        }
        .address-input:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}