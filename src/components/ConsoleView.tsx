import { useState, useRef, useEffect } from 'react'
import { useR2 } from '../hooks/useR2'

export function ConsoleView() {
  const { consoleHistory, executeCommand } = useR2()
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const commandHistory = useRef<string[]>([])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [consoleHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    commandHistory.current.push(input)
    setHistoryIndex(-1)
    await executeCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.current.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory.current[commandHistory.current.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory.current[commandHistory.current.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  return (
    <div className="console-view">
      <div className="console-header">
        <h3>Console</h3>
        <span className="hint">r2 commands</span>
      </div>
      <div className="console-content" ref={contentRef}>
        {consoleHistory.map(entry => (
          <div key={entry.id} className={`console-entry ${entry.type}`}>
            {entry.type === 'input' && <span className="prompt">[r2]&gt;</span>}
            <span className="content">{entry.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="console-input">
        <span className="prompt">[r2]&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter r2 command..."
          autoFocus
        />
      </form>
      <style>{`
        .console-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-tertiary);
        }
        .console-header {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          gap: 16px;
          flex-shrink: 0;
        }
        .console-header h3 {
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        .hint {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .console-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px;
          font-size: 0.85rem;
          min-height: 0;
        }
        .console-entry {
          white-space: pre-wrap;
          word-break: break-word;
        }
        .console-entry.input {
          color: var(--accent);
        }
        .console-entry.output {
          color: var(--text-primary);
        }
        .console-entry.error {
          color: var(--error);
        }
        .console-entry.info {
          color: var(--success);
        }
        .prompt {
          color: var(--keyword);
          margin-right: 8px;
        }
        .console-input {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: var(--bg-primary);
          height: 40px;
          flex-shrink: 0;
        }
        .console-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: inherit;
        }
        .console-input input:focus {
          outline: none;
        }
        .console-input input::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}