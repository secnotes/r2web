import type { FileInfo } from '../types'

interface StatusBarProps {
  fileInfo: FileInfo | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GiB`
  }
}

export function StatusBar({ fileInfo }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="status-left">
        {fileInfo && (
          <>
            <span className="status-item">
              <span className="label">Arch:</span>
              <span className="value">{fileInfo.architecture}-{fileInfo.bits}</span>
            </span>
            <span className="status-item">
              <span className="label">Format:</span>
              <span className="value">{fileInfo.format}</span>
            </span>
            <span className="status-item">
              <span className="label">Size:</span>
              <span className="value">{formatSize(fileInfo.size)}</span>
            </span>
          </>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">
          <span className="label">Mode:</span>
          <span className="value">Analysis</span>
        </span>
        <span className="version">R2Web v{__APP_VERSION__}</span>
      </div>
      <style>{`
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 16px;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border);
          font-size: 0.75rem;
        }
        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .label {
          color: var(--text-muted);
        }
        .value {
          color: var(--text-secondary);
        }
        .version {
          color: var(--text-muted);
        }
      `}</style>
    </footer>
  )
}