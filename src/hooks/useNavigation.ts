import { useState, useCallback } from 'react'
import { useR2 } from './useR2'
import { formatAddress } from '../lib/utils'

interface HistoryEntry {
  address: number
  timestamp: number
}

export function useNavigation() {
  const { r2, seekTo, currentOffset, fileInfo } = useR2()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [inputAddress, setInputAddress] = useState('')

  // Navigate to address
  const goTo = useCallback(async (address: number) => {
    if (!r2) return

    // Add to history
    const newHistory = [...history.slice(0, historyIndex + 1), { address, timestamp: Date.now() }]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    await seekTo(address)
  }, [r2, seekTo, history, historyIndex])

  // Parse address input (supports 0x prefix, decimal, or labels)
  const parseAddress = useCallback((input: string): number | null => {
    const trimmed = input.trim()

    // Hex with 0x prefix
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      const num = parseInt(trimmed, 16)
      return isNaN(num) ? null : num
    }

    // Pure hex without prefix
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      const num = parseInt(trimmed, 16)
      return isNaN(num) ? null : num
    }

    // Decimal
    if (/^[0-9]+$/.test(trimmed)) {
      return parseInt(trimmed, 10)
    }

    // Named address (like 'main' or 'entry0')
    // Would need r2 lookup - for now return null
    return null
  }, [])

  // Go to input address
  const goToInput = useCallback(async () => {
    const address = parseAddress(inputAddress)
    if (address !== null) {
      await goTo(address)
      setInputAddress('')
    }
  }, [inputAddress, parseAddress, goTo])

  // Undo (go back in history)
  const undo = useCallback(async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      await seekTo(history[newIndex].address)
    }
  }, [history, historyIndex, seekTo])

  // Redo (go forward in history)
  const redo = useCallback(async () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      await seekTo(history[newIndex].address)
    }
  }, [history, historyIndex, seekTo])

  // Jump to entry point
  const goToEntry = useCallback(async () => {
    const entrypoint = fileInfo?.entrypoint
    if (entrypoint !== undefined && entrypoint !== null) {
      console.log('[Navigation] Going to entry point:', entrypoint)
      await goTo(entrypoint)
    } else {
      console.log('[Navigation] No entrypoint defined')
    }
  }, [fileInfo, goTo])

  // Current formatted address
  const currentAddressFormatted = formatAddress(currentOffset, fileInfo?.bits || 64)

  return {
    goTo,
    goToInput,
    undo,
    redo,
    goToEntry,
    inputAddress,
    setInputAddress,
    currentAddressFormatted,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  }
}