import { useState, useRef, useEffect } from 'react'
import { useSearch } from '../hooks/useSearch'
import { useR2 } from '../hooks/useR2'

export function SearchBox() {
  const { query, setQuery, results, current, next, previous, clear, isSearching, resultCount, setCurrentIndex } = useSearch()
  const { seekTo } = useR2()
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        clear()
      }
      if (isOpen) {
        if (e.key === 'Enter' && current) {
          seekTo(current.address)
        }
        if (e.key === 'n' && !e.shiftKey) {
          const res = next()
          if (res) seekTo(res.address)
        }
        if (e.key === 'N' || (e.key === 'n' && e.shiftKey)) {
          const res = previous()
          if (res) seekTo(res.address)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, current, next, previous, seekTo, clear])

  if (!isOpen) return null

  return (
    <div className="search-box">
      <div className="search-input-wrapper">
        <span className="search-prefix">/</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          className="search-input"
          autoFocus
        />
        {isSearching && <span className="search-status">...</span>}
        {resultCount > 0 && (
          <span className="search-count">{current ? `${results.indexOf(current) + 1}/${resultCount}` : `${resultCount}`}</span>
        )}
      </div>
      {results.length > 0 && (
        <div className="search-results">
          {results.slice(0, 5).map((result, idx) => (
            <div
              key={idx}
              className={`search-result ${current === result ? 'active' : ''}`}
              onClick={() => {
                seekTo(result.address)
                setCurrentIndex(idx)
              }}
            >
              <span className="result-address">0x{result.address.toString(16)}</span>
              <span className="result-type">{result.type}</span>
              <span className="result-content">{result.content}</span>
            </div>
          ))}
        </div>
      )}
      <div className="search-hints">
        <span>Enter: jump</span>
        <span>n/N: next/prev</span>
        <span>Esc: close</span>
      </div>
      <style>{`
        .search-box {
          position: fixed;
          top: 60px;
          right: 20px;
          width: 400px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-prefix {
          color: var(--accent);
          font-weight: bold;
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1rem;
          font-family: inherit;
        }
        .search-input:focus {
          outline: none;
        }
        .search-status, .search-count {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .search-results {
          margin-top: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .search-result:hover {
          background: var(--bg-tertiary);
        }
        .search-result.active {
          background: rgba(137, 180, 250, 0.2);
        }
        .result-address {
          color: var(--address);
          font-size: 0.85rem;
        }
        .result-type {
          color: var(--keyword);
          font-size: 0.75rem;
        }
        .result-content {
          color: var(--text-primary);
          font-size: 0.85rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-hints {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  )
}