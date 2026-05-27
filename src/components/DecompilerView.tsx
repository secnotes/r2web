import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useR2 } from '../hooks/useR2'

// Line height in pixels
const LINE_HEIGHT = 20
// Buffer lines above and below visible area
const BUFFER_LINES = 10

export function DecompilerView() {
  const { currentOffset, fileInfo, functions, decompiledCode, decompileFunction, isLoading, isLoaded } = useR2()
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Find current function for display
  const currentFunction = useMemo(() => {
    if (!functions || functions.length === 0) return null
    return functions.find(f => f.offset === currentOffset) ||
           functions.find(f =>
             f.offset <= currentOffset &&
             f.offset + f.size > currentOffset &&
             !f.name.startsWith('sym.imp.')
           ) ||
           functions.find(f => !f.name.startsWith('sym.imp.'))
  }, [functions, currentOffset])

  // Decompile when function changes - only if file is loaded
  useEffect(() => {
    if (currentFunction && !isLoading && isLoaded) {
      decompileFunction(currentFunction.offset)
    }
  }, [currentFunction, decompileFunction, isLoading, isLoaded])

  // Split code into lines
  const codeLines = useMemo(() => {
    if (!decompiledCode?.code) return []
    return decompiledCode.code.split('\n')
  }, [decompiledCode?.code])

  // Build annotation map for quick lookup
  const annotationMap = useMemo(() => {
    if (!decompiledCode?.annotations || !decompiledCode?.code) return new Map()
    const map = new Map<number, number>()
    const lines = decompiledCode.code.split('\n')
    let charCount = 0
    for (let i = 0; i < lines.length; i++) {
      for (const ann of decompiledCode.annotations) {
        if (ann.start >= charCount && ann.start < charCount + lines[i].length) {
          map.set(i, ann.offset)
        }
      }
      charCount += lines[i].length + 1
    }
    return map
  }, [decompiledCode])

  // Calculate visible lines based on scroll position
  const visibleLines = useMemo(() => {
    if (codeLines.length === 0) return { start: 0, end: 0 }

    const containerHeight = contentRef.current?.clientHeight || 400
    const startLine = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - BUFFER_LINES)
    const endLine = Math.min(codeLines.length, startLine + Math.ceil(containerHeight / LINE_HEIGHT) + BUFFER_LINES * 2)

    return { start: startLine, end: endLine }
  }, [scrollTop, codeLines.length])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Escape HTML special characters only - no syntax highlighting
  const highlightSyntax = useCallback((line: string): string => {
    if (!line) return ''
    return line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }, [])

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  // Total height for scrollbar
  const totalHeight = codeLines.length * LINE_HEIGHT

  return (
    <div className="decompiler-view">
      <div className="view-header">
        <h3>Decompiler</h3>
        <span className="function-name">
          {currentFunction?.name || 'No function selected'}
        </span>
        <span className="offset-display">
          {formatAddress(currentOffset)}
        </span>
        <span className="line-count">
          {codeLines.length > 0 ? `${codeLines.length} lines` : ''}
        </span>
      </div>
      <div className="decompiler-content" ref={contentRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <span>Decompiling...</span>
          </div>
        ) : codeLines.length > 0 ? (
          <div className="code-container" style={{ height: totalHeight, position: 'relative' }}>
            {/* Render only visible lines */}
            {codeLines.slice(visibleLines.start, visibleLines.end).map((line, idx) => {
              const actualIdx = visibleLines.start + idx
              const annOffset = annotationMap.get(actualIdx)

              return (
                <div
                  key={actualIdx}
                  data-line={actualIdx}
                  className={`code-line ${selectedLine === actualIdx ? 'selected' : ''} ${annOffset === currentOffset ? 'current' : ''}`}
                  style={{
                    position: 'absolute',
                    top: actualIdx * LINE_HEIGHT,
                    left: 0,
                    right: 0
                  }}
                  onClick={() => setSelectedLine(actualIdx)}
                >
                  <span className="line-number">{actualIdx + 1}</span>
                    <span
                      className="line-content"
                      dangerouslySetInnerHTML={{ __html: highlightSyntax(line) }}
                    />
                  {annOffset && (
                    <span className="address-badge" title={`Address: 0x${annOffset.toString(16)}`}>
                      0x{annOffset.toString(16)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No decompiled code available</p>
            <p className="hint">Select a function to decompile</p>
          </div>
        )}
      </div>
      <style>{`
        .decompiler-view {
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
        .function-name {
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .offset-display {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .line-count {
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-left: auto;
        }
        .decompiler-content {
          flex: 1;
          overflow-y: auto;
          background: var(--bg-primary);
        }
        .code-container {
          min-height: 100%;
        }
        .code-line {
          display: flex;
          align-items: flex-start;
          padding: 0 16px;
          height: ${LINE_HEIGHT}px;
          cursor: pointer;
          transition: background 0.1s;
          font-size: 0.85rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          line-height: ${LINE_HEIGHT}px;
          white-space: nowrap;
        }
        .code-line:hover {
          background: var(--bg-secondary);
        }
        .code-line.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        .code-line.current {
          background: rgba(137, 180, 250, 0.2);
        }
        .line-number {
          color: var(--text-muted);
          min-width: 40px;
          text-align: right;
          padding-right: 16px;
          user-select: none;
        }
        .line-content {
          flex: 1;
          white-space: pre;
        }
        .address-badge {
          color: var(--address);
          font-size: 0.75rem;
          background: var(--bg-tertiary);
          padding: 1px 4px;
          border-radius: 3px;
          margin-left: 8px;
        }
        /* Syntax highlighting */
        .hl-keyword {
          color: var(--keyword);
          font-weight: 500;
        }
        .hl-number {
          color: var(--number);
        }
        .hl-string {
          color: var(--string);
        }
        .hl-comment {
          color: var(--comment);
          font-style: italic;
        }
        .hl-label {
          color: var(--warning);
        }
        .hl-symbol {
          color: var(--accent);
        }
        .loading-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 10px;
          color: var(--text-muted);
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--accent);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
        .empty-state p {
          margin: 4px 0;
        }
        .hint {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}