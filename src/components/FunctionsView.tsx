import { useState } from 'react'
import { useR2 } from '../hooks/useR2'

export function FunctionsView() {
  const { functions, seekTo } = useR2()
  const [filter, setFilter] = useState('')
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null)

  const filteredFunctions = functions.filter(f =>
    f.name.toLowerCase().includes(filter.toLowerCase())
  )

  const handleFunctionClick = async (func: { offset: number }) => {
    setSelectedOffset(func.offset)
    await seekTo(func.offset)
  }

  return (
    <div className="fv-container">
      <div className="fv-header">
        <h3>Functions ({functions.length})</h3>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="fv-filter"
        />
      </div>
      <div className="fv-list">
        {filteredFunctions.map((func, idx) => (
          <div
            key={`${func.offset}-${idx}`}
            className={`fv-item ${selectedOffset === func.offset ? 'fv-selected' : ''}`}
            onClick={() => handleFunctionClick(func)}
          >
            <span className="fv-name">{func.name}</span>
            <span className="fv-size">{func.size}</span>
          </div>
        ))}
      </div>
      <style>{`
        .fv-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .fv-header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          gap: 12px;
          flex-shrink: 0;
        }
        .fv-header h3 {
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          margin: 0;
        }
        .fv-filter {
          padding: 4px 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.8rem;
          width: 120px;
        }
        .fv-filter:focus {
          outline: none;
          border-color: var(--accent);
        }
        .fv-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 0;
        }
        .fv-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 12px;
          cursor: pointer;
          transition: background 0.1s;
          font-size: 0.85rem;
        }
        .fv-item:hover {
          background: var(--bg-secondary);
        }
        .fv-selected {
          background: rgba(137, 180, 250, 0.15);
        }
        .fv-name {
          color: var(--function);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fv-size {
          color: var(--number);
          font-size: 0.8rem;
          flex-shrink: 0;
          margin-left: 8px;
        }
      `}</style>
    </div>
  )
}