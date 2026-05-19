import { useState, useEffect } from 'react'
import type { ViewType } from '../App'
import { t, getLang } from '../lib/i18n'

interface ViewBarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: { id: ViewType; labelKey: string }[] = [
  { id: 'disassembly', labelKey: 'view_disassembly' },
  { id: 'graph', labelKey: 'view_graph' },
  { id: 'hex', labelKey: 'view_hex' },
  { id: 'strings', labelKey: 'view_strings' },
  { id: 'imports', labelKey: 'view_imports' },
  { id: 'symbols', labelKey: 'view_symbols' },
  { id: 'sections', labelKey: 'view_sections' },
]

export function ViewBar({ activeView, onViewChange }: ViewBarProps) {
  const [, setLangState] = useState(getLang())

  useEffect(() => {
    const handleLangChange = () => setLangState(getLang())
    window.addEventListener('langchange', handleLangChange)
    return () => window.removeEventListener('langchange', handleLangChange)
  }, [])

  return (
    <div className="vb-bar">
      {views.map(view => (
        <button
          key={view.id}
          className={`vb-tab ${activeView === view.id ? 'vb-active' : ''}`}
          onClick={() => onViewChange(view.id)}
        >
          {t(view.labelKey)}
        </button>
      ))}
      <style>{`
        .vb-bar {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          gap: 2px;
          flex-shrink: 0;
        }
        .vb-tab {
          padding: 6px 16px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.15s;
        }
        .vb-tab:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .vb-active {
          background: var(--bg-secondary);
          color: var(--accent);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}