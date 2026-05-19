import { useState } from 'react'
import { useR2 } from '../hooks/useR2'

export function StringsView() {
  const { fileInfo, strings } = useR2()
  const [filter, setFilter] = useState('')
  const [selectedString, setSelectedString] = useState<number | null>(null)

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  const filteredStrings = strings.filter(s =>
    s.value.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="strings-view">
      <div className="view-header">
        <h3>Strings ({strings.length})</h3>
        <input
          type="text"
          placeholder="Filter strings..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      <div className="strings-content">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Type</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrings.map((s, idx) => (
              <tr
                key={idx}
                className={`string-row ${selectedString === idx ? 'selected' : ''}`}
                onClick={() => setSelectedString(idx)}
              >
                <td className="address">{formatAddress(s.offset)}</td>
                <td className="type">{s.type}</td>
                <td className="value">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .strings-view {
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
        .strings-content {
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
        .string-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .string-row:hover {
          background: var(--bg-secondary);
        }
        .string-row.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        td {
          padding: 4px 16px;
          font-size: 0.85rem;
        }
        .address {
          color: var(--address);
        }
        .type {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .value {
          color: var(--string);
        }
      `}</style>
    </div>
  )
}