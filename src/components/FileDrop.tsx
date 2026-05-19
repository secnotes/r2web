import React, { useState, useCallback } from 'react'
import { useR2 } from '../hooks/useR2'

export function FileDrop() {
  const { loadFile, isLoading, error } = useR2()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  return (
    <div
      className={`file-drop ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-drop-content">
        <div className="logo">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="var(--accent)" opacity="0.2"/>
            <text x="50" y="55" textAnchor="middle" fill="var(--accent)" fontSize="24" fontWeight="bold">R2</text>
          </svg>
        </div>
        <h1>R2Web</h1>
        <p>Browser-based Reverse Engineering Platform</p>
        <p className="subtitle">Powered by radare2 WebAssembly</p>

        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <div className="drop-zone">
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-button">
              Open Binary File
            </label>
            <p className="drag-text">or drag & drop a file here</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="supported-formats">
          <span>Supported formats: ELF, PE, Mach-O, and more</span>
        </div>
      </div>
      <style>{`
        .file-drop {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
          transition: background 0.3s;
        }
        .file-drop.dragging {
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        }
        .file-drop-content {
          text-align: center;
          padding: 40px;
        }
        .logo {
          margin-bottom: 20px;
        }
        h1 {
          font-size: 2.5rem;
          color: var(--text-primary);
          margin-bottom: 10px;
        }
        p {
          color: var(--text-secondary);
          margin-bottom: 5px;
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 30px;
        }
        .drop-zone {
          padding: 40px;
          border: 2px dashed var(--border);
          border-radius: 12px;
          margin: 20px 0;
          transition: all 0.3s;
        }
        .file-drop.dragging .drop-zone {
          border-color: var(--accent);
          background: rgba(137, 180, 250, 0.1);
        }
        .file-button {
          display: inline-block;
          padding: 12px 24px;
          background: var(--accent);
          color: var(--bg-primary);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .file-button:hover {
          background: var(--accent-hover);
        }
        .drag-text {
          color: var(--text-muted);
          margin-top: 15px;
          font-size: 0.85rem;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--accent);
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--accent);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error-message {
          color: var(--error);
          padding: 10px;
          margin-top: 20px;
          background: rgba(243, 139, 168, 0.1);
          border-radius: 6px;
        }
        .supported-formats {
          margin-top: 30px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  )
}