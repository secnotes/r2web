import { useState } from 'react'
import { useR2 } from '../hooks/useR2'

export function SectionsView() {
  const { fileInfo, sections } = useR2()
  const [selectedSection, setSelectedSection] = useState<number | null>(null)

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  const formatSize = (size: number) => {
    if (size >= 0x100000) return `${(size / 0x100000).toFixed(1)}M`
    if (size >= 0x400) return `${(size / 0x400).toFixed(1)}K`
    return `${size}B`
  }

  const getPermissionColor = (flags: string) => {
    if (flags.includes('x')) return 'var(--success)'
    if (flags.includes('w')) return 'var(--warning)'
    return 'var(--text-muted)'
  }

  return (
    <div className="sections-view">
      <div className="view-header">
        <h3>Sections ({sections.length})</h3>
      </div>
      <div className="sections-content">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>VAddr</th>
              <th>PAddr</th>
              <th>Size</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec, idx) => (
              <tr
                key={idx}
                className={`section-row ${selectedSection === idx ? 'selected' : ''}`}
                onClick={() => setSelectedSection(idx)}
              >
                <td className="name">{sec.name}</td>
                <td className="vaddr">{formatAddress(sec.vaddr)}</td>
                <td className="paddr">{sec.paddr ? formatAddress(sec.paddr) : '-'}</td>
                <td className="size">{formatSize(sec.size)}</td>
                <td className="flags" style={{ color: getPermissionColor(sec.flags) }}>
                  {sec.flags || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .sections-view {
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
        }
        .view-header h3 {
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .sections-content {
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
        .section-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .section-row:hover {
          background: var(--bg-secondary);
        }
        .section-row.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        td {
          padding: 6px 16px;
          font-size: 0.85rem;
        }
        .name {
          color: var(--accent);
          font-weight: 500;
        }
        .vaddr, .paddr {
          color: var(--address);
        }
        .size {
          color: var(--number);
        }
        .flags {
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}