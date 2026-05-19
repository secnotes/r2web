import { useState, useEffect, useRef, useCallback } from 'react'
import { useR2 } from '../hooks/useR2'

export function HexView() {
  const { r2, fileInfo, currentOffset } = useR2()
  const [hexData, setHexData] = useState<any[]>([])
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null)
  const [displayOffset, setDisplayOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const CHUNK_SIZE = 4096 // 4KB per chunk

  // Load hex data when r2 is ready
  useEffect(() => {
    if (r2 && fileInfo) {
      setLoading(true)
      r2.getHexDump(0, CHUNK_SIZE).then(data => {
        setHexData(data)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [r2, fileInfo])

  // Scroll to currentOffset when it changes
  useEffect(() => {
    if (contentRef.current && hexData.length > 0 && currentOffset > 0) {
      const targetLine = hexData.find(line =>
        currentOffset >= line.offset && currentOffset < line.offset + 16
      )
      if (targetLine) {
        const row = contentRef.current.querySelector(`[data-offset="${targetLine.offset}"]`)
        if (row) {
          row.scrollIntoView({ block: 'start' })
          setSelectedOffset(targetLine.offset)
        }
      }
    }
  }, [currentOffset, hexData])

  const loadMore = useCallback(() => {
    if (!r2 || loading) return
    const newOffset = displayOffset + CHUNK_SIZE
    if (newOffset >= (fileInfo?.size || 0)) return

    setLoading(true)
    r2.getHexDump(newOffset, CHUNK_SIZE).then(data => {
      setHexData(prev => [...prev, ...data])
      setDisplayOffset(newOffset)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [r2, displayOffset, loading, fileInfo?.size])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    if (scrollBottom < 100) {
      loadMore()
    }
  }, [loadMore])

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  return (
    <div className="hv-container">
      <div className="hv-header">
        <h3>Hex Dump</h3>
        <span className="hv-info">
          {displayOffset + CHUNK_SIZE > (fileInfo?.size || 0)
            ? `Full file (${fileInfo?.size || 0} bytes)`
            : `0x0 - 0x${(displayOffset + hexData.length * 16).toString(16)} (${fileInfo?.size || 0} bytes total)`
          }
        </span>
      </div>
      <div className="hv-content" ref={contentRef} onScroll={handleScroll}>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Bytes</th>
              <th>ASCII</th>
            </tr>
          </thead>
          <tbody>
            {hexData.map((line) => (
              <tr
                key={line.offset}
                data-offset={line.offset}
                className={`hv-row ${selectedOffset === line.offset ? 'hv-selected' : ''}`}
                onClick={() => setSelectedOffset(line.offset)}
              >
                <td className="hv-address">{formatAddress(line.offset)}</td>
                <td className="hv-bytes">{line.bytes}</td>
                <td className="hv-ascii">{line.ascii}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="hv-loading">Loading...</div>}
      </div>
      <style>{`
        .hv-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .hv-header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
          gap: 12px;
          flex-shrink: 0;
        }
        .hv-header h3 {
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          margin: 0;
        }
        .hv-info {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .hv-content {
          flex: 1;
          overflow-y: auto;
          padding: 4px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          background: var(--bg-secondary);
        }
        th {
          padding: 8px 12px;
          color: var(--text-muted);
          font-size: 0.75rem;
          text-align: left;
          font-weight: normal;
        }
        .hv-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .hv-row:hover {
          background: var(--bg-secondary);
        }
        .hv-selected {
          background: rgba(137, 180, 250, 0.15);
        }
        td {
          padding: 2px 12px;
          font-size: 0.85rem;
          font-family: monospace;
        }
        .hv-address {
          color: var(--address);
          user-select: all;
        }
        .hv-bytes {
          color: var(--text-primary);
          letter-spacing: 0.05em;
        }
        .hv-ascii {
          color: var(--string);
          font-size: 0.85rem;
        }
        .hv-loading {
          padding: 8px 12px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  )
}