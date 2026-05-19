import { useState } from 'react'
import { useR2 } from '../hooks/useR2'
import { SettingsPanel } from './SettingsPanel'

export function Header() {
  const { fileInfo } = useR2()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-small">
          <svg width="24" height="24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="var(--accent)" opacity="0.2"/>
            <text x="50" y="55" textAnchor="middle" fill="var(--accent)" fontSize="24" fontWeight="bold">R2</text>
          </svg>
        </div>
        <span className="title">R2Web</span>
      </div>

      <div className="header-center">
        {fileInfo && (
          <div className="file-info">
            <span className="file-name">{fileInfo.name}</span>
            <span className="file-arch">{fileInfo.architecture}-{fileInfo.bits}</span>
            <span className="file-format">{fileInfo.format}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="header-btn" title="Open new file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>
        <button className="header-btn" title="Settings" onClick={() => setShowSettings(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.75 19.5,12.5 19.5,12.25C19.5,12 19.47,11.78 19.43,11.56L21.54,9.88C21.73,9.71 21.78,9.44 21.66,9.2L19.66,5.8C19.54,5.56 19.27,5.5 19.04,5.58L16.56,6.63C16.14,6.28 15.67,6 15.13,5.79L14.75,3.17C14.71,2.93 14.5,2.75 14.25,2.75H9.75C9.5,2.75 9.29,2.93 9.25,3.17L8.87,5.79C8.33,6 7.86,6.28 7.44,6.63L4.96,5.58C4.73,5.5 4.46,5.56 4.34,5.8L2.34,9.2C2.21,9.44 2.27,9.71 2.46,9.88L4.57,11.56C4.53,11.78 4.5,12 4.5,12.25C4.5,12.5 4.53,12.75 4.57,12.97L2.46,14.63C2.27,14.8 2.21,15.07 2.34,15.3L4.34,18.7C4.46,18.93 4.73,18.99 4.96,18.9L7.44,17.87C7.86,18.22 8.33,18.5 8.87,18.71L9.25,21.33C9.29,21.56 9.5,21.75 9.75,21.75H14.25C14.5,21.75 14.71,21.56 14.75,21.33L15.13,18.71C15.67,18.5 16.14,18.22 16.56,17.87L19.04,18.9C19.27,18.99 19.54,18.93 19.66,18.7L21.66,15.3C21.78,15.07 21.73,14.8 21.54,14.63L19.43,12.97Z"/>
          </svg>
        </button>
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <style>{`
        .header {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          gap: 16px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-small {
          display: flex;
          align-items: center;
        }
        .title {
          font-weight: 600;
          color: var(--text-primary);
        }
        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .file-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.9rem;
        }
        .file-name {
          color: var(--text-primary);
          font-weight: 500;
        }
        .file-arch, .file-format {
          color: var(--text-secondary);
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
        }
        .header-right {
          display: flex;
          gap: 8px;
        }
        .header-btn {
          padding: 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .header-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
      `}</style>
    </header>
  )
}