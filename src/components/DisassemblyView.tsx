import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
import { useR2 } from '../hooks/useR2'

export function DisassemblyView() {
  const { currentOffset, fileInfo, seekTo, functions, allInstructions } = useR2()
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Build a map of function addresses for quick lookup
  const functionMap = useMemo(() => {
    const map = new Map<number, string>()
    if (functions) {
      for (const func of functions) {
        map.set(func.offset, func.name)
      }
    }
    return map
  }, [functions])

  // Scroll to current offset when it changes
  useEffect(() => {
    if (contentRef.current && allInstructions.length > 0) {
      // Find the closest instruction to currentOffset
      let targetOffset = currentOffset
      let found = allInstructions.find(inst => inst.offset === currentOffset)

      // If exact match not found, find the closest instruction after currentOffset
      if (!found) {
        for (const inst of allInstructions) {
          if (inst.offset >= currentOffset) {
            found = inst
            targetOffset = inst.offset
            break
          }
        }
      }

      if (found && contentRef.current) {
        const container = contentRef.current

        // First try to find function header row
        const funcHeader = container.querySelector(`[data-func-offset="${targetOffset}"]`) as HTMLTableRowElement | null
        const targetElement = funcHeader || container.querySelector(`[data-offset="${targetOffset}"]`) as HTMLTableRowElement | null

        if (targetElement) {
          // Calculate scroll position: current scrollTop + element position relative to container top
          const elementRect = targetElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const newScrollTop = container.scrollTop + (elementRect.top - containerRect.top)
          container.scrollTop = newScrollTop
        }
      }
    }
  }, [currentOffset, allInstructions])

  // Handle jump to address from operands
  const handleJumpTo = useCallback(async (targetAddr: number) => {
    if (seekTo) {
      await seekTo(targetAddr)
    }
  }, [seekTo])

  // Parse operands to find clickable addresses
  const parseOperands = useCallback((operands: string, mnemonic: string): React.ReactNode => {
    // Check if this is a jump/call instruction
    const isJumpInstruction = ['call', 'jmp', 'jo', 'jno', 'jb', 'jnb', 'jz', 'jnz', 'jbe', 'ja', 'js', 'jns', 'jl', 'jge', 'jle', 'jg'].includes(mnemonic)

    if (!isJumpInstruction || !operands) {
      return operands
    }

    // Find hex address in operands (e.g., "0x1234" or "0x4001234")
    const addrMatch = operands.match(/0x([0-9a-f]+)/i)
    if (addrMatch) {
      const targetAddr = parseInt(addrMatch[1], 16)
      const funcName = functionMap.get(targetAddr)

      return (
        <span
          className="clickable-addr"
          onClick={(e) => {
            e.stopPropagation()
            handleJumpTo(targetAddr)
          }}
          title={funcName ? `Jump to ${funcName}` : `Jump to 0x${targetAddr.toString(16)}`}
        >
          {operands}
          {funcName && <span className="func-label"> ({funcName})</span>}
        </span>
      )
    }

    return operands
  }, [handleJumpTo, functionMap])

  const formatAddress = (addr: number) => {
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  // Find function name for current instruction
  const getFunctionLabel = (offset: number): string | null => {
    for (const func of functions || []) {
      if (offset === func.offset) {
        return func.name
      }
    }
    return null
  }

  return (
    <div className="disassembly-view">
      <div className="view-header">
        <h3>Disassembly</h3>
        <span className="offset-display">Current: {formatAddress(currentOffset)}</span>
      </div>
      <div className="disassembly-content" ref={contentRef}>
        <table>
          <tbody>
            {allInstructions.map((inst, idx) => {
              const funcLabel = getFunctionLabel(inst.offset)
              // Use offset + index as key to ensure uniqueness (instructions from different functions may overlap)
              const uniqueKey = `${inst.offset}-${idx}`
              return (
                <Fragment key={uniqueKey}>
                  {funcLabel && (
                    <tr className="function-header" data-func-offset={inst.offset}>
                      <td colSpan={4}>
                        <span className="func-name">{funcLabel}:</span>
                      </td>
                    </tr>
                  )}
                  <tr
                    data-offset={inst.offset}
                    className={`instruction-row ${selectedLine === idx ? 'selected' : ''} ${inst.offset === currentOffset ? 'current' : ''}`}
                    onClick={() => setSelectedLine(idx)}
                  >
                    <td className="address">{formatAddress(inst.offset)}</td>
                    <td className="bytes">{inst.bytes}</td>
                    <td className="mnemonic">{inst.mnemonic}</td>
                    <td className="operands">{parseOperands(inst.operands, inst.mnemonic)}</td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        .disassembly-view {
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
        .offset-display {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .disassembly-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .function-header {
          background: var(--bg-tertiary);
        }
        .function-header td {
          padding: 8px 16px 4px 16px;
        }
        .func-name {
          color: var(--accent);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .instruction-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .instruction-row:hover {
          background: var(--bg-secondary);
        }
        .instruction-row.selected {
          background: rgba(137, 180, 250, 0.1);
        }
        .instruction-row.current {
          background: rgba(137, 180, 250, 0.2);
        }
        td {
          padding: 2px 16px;
          font-size: 0.85rem;
        }
        .address {
          color: var(--address);
          user-select: all;
        }
        .bytes {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .mnemonic {
          color: var(--keyword);
          font-weight: 500;
        }
        .operands {
          color: var(--text-primary);
        }
        .clickable-addr {
          color: var(--accent);
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dotted;
        }
        .clickable-addr:hover {
          text-decoration-style: solid;
        }
        .func-label {
          color: var(--comment);
          font-size: 0.8rem;
        }
        .comment {
          color: var(--comment);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}