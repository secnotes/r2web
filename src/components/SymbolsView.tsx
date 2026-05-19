import { useState } from 'react'
import { useR2 } from '../hooks/useR2'

export function SymbolsView() {
  const { fileInfo, symbols } = useR2()
  const [filter, setFilter] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState<number | null>(null)

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FUNC': return 'var(--function)'
      case 'OBJECT': return 'var(--number)'
      case 'NOTYPE': return 'var(--text-muted)'
      default: return 'var(--text-primary)'
    }
  }

  const getBindColor = (bind: string) => {
    switch (bind) {
      case 'GLOBAL': return 'var(--success)'
      case 'LOCAL': return 'var(--text-muted)'
      case 'WEAK': return 'var(--warning)'
      default: return 'var(--text-secondary)'
    }
  }

  const filteredSymbols = symbols.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="symbols-view">
      <div className="view-header">
        <h3>Symbols ({symbols.length})</h3>
        <input
          type="text"
          placeholder="Filter symbols..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      <div className="symbols-content">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Bind</th>
              <th>Type</th>
              <th>Size</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredSymbols.map((sym, idx) => (
              <tr
                key={idx}
                className={`symbol-row ${selectedSymbol === idx ? 'selected' : ''}`}
                onClick={() => setSelectedSymbol(idx)}
              >
                <td className="address">{formatAddress(sym.address)}</td>
                <td className="bind" style={{ color: getBindColor(sym.bind) }}>{sym.bind}</td>
                <td className="type" style={{ color: getTypeColor(sym.type) }}>{sym.type}</td>
                <td className="size">{sym.size ? `0x${sym.size.toString(16)}` : '-'}</td>
                <td className="name">{sym.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .symbols-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .view-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          gap: 16px;
        }
        .view-header h3 {
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .filter-input {
          padding: 6px 10px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          width: 200px;
        }
        .filter-input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .symbols-content {
          flex: 1;
          overflow-y: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          background: var(--bg-secondary);
        }
        th {
          padding: 8px 16px;
          color: var(--text-muted);
          font-size: 0.75rem;
          text-align: left;
          font-weight: normal;
        }
        .symbol-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .symbol-row:hover {
          background: var(--bg-secondary);
        }
        .symbol-row.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        td {
          padding: 6px 16px;
          font-size: 0.85rem;
        }
        .address {
          color: var(--address);
        }
        .bind, .type {
          font-size: 0.75rem;
          font-weight: 500;
        }
        .size {
          color: var(--number);
          font-size: 0.8rem;
        }
        .name {
          color: var(--accent);
        }
      `}</style>
    </div>
  )
}