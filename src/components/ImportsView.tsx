import { useState } from 'react'
import { useR2 } from '../hooks/useR2'

export function ImportsView() {
  const { fileInfo, imports } = useR2()
  const [filter, setFilter] = useState('')
  const [selectedImport, setSelectedImport] = useState<number | null>(null)

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  const filteredImports = imports.filter(i =>
    i.name.toLowerCase().includes(filter.toLowerCase()) ||
    i.library.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="imports-view">
      <div className="view-header">
        <h3>Imports ({imports.length})</h3>
        <input
          type="text"
          placeholder="Filter imports..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      <div className="imports-content">
        <table>
          <thead>
            <tr>
              <th>Library</th>
              <th>Address</th>
              <th>Type</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredImports.map((imp, idx) => (
              <tr
                key={idx}
                className={`import-row ${selectedImport === idx ? 'selected' : ''}`}
                onClick={() => setSelectedImport(idx)}
              >
                <td className="library">{imp.library || '-'}</td>
                <td className="address">{imp.offset ? formatAddress(imp.offset) : '-'}</td>
                <td className="type">{imp.type || 'FUNC'}</td>
                <td className="name">{imp.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .imports-view {
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
        .imports-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
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
        .import-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .import-row:hover {
          background: var(--bg-secondary);
        }
        .import-row.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        td {
          padding: 4px 16px;
          font-size: 0.85rem;
        }
        .library {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .address {
          color: var(--address);
        }
        .type {
          color: var(--keyword);
          font-size: 0.75rem;
        }
        .name {
          color: var(--function);
        }
      `}</style>
    </div>
  )
}