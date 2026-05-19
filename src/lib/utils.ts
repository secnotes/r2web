// Utility functions for R2Web

/**
 * Format a number as hexadecimal address
 */
export function formatAddress(addr: number, bits: number = 64): string {
  const padding = bits === 64 ? 16 : 8
  return `0x${addr.toString(16).padStart(padding, '0')}`
}

/**
 * Format file size in human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0') + ' ', '').trim()
}

/**
 * Convert bytes to ASCII string (non-printable as dots)
 */
export function bytesToAscii(bytes: Uint8Array): string {
  return bytes.reduce((str, byte) => {
    const char = byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.'
    return str + char
  }, '')
}

/**
 * Parse r2 JSON output safely
 */
export function parseR2Json<T>(output: string): T | null {
  try {
    return JSON.parse(output) as T
  } catch {
    return null
  }
}

/**
 * Detect file type from magic bytes
 */
export function detectFileType(bytes: Uint8Array): string {
  if (bytes.length < 4) return 'unknown'

  // ELF
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) {
    return bytes[4] === 1 ? 'ELF32' : 'ELF64'
  }

  // PE
  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return 'PE'
  }

  // Mach-O
  if (bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfa && bytes[3] === 0xce) {
    return 'Mach-O 32'
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfa && bytes[3] === 0xcf) {
    return 'Mach-O 64'
  }

  // Java class
  if (bytes[0] === 0xca && bytes[1] === 0xfe && bytes[2] === 0xba && bytes[3] === 0xbe) {
    return 'Java Class'
  }

  // Dex (Android)
  if (bytes[0] === 0x64 && bytes[1] === 0x65 && bytes[2] === 0x78 && bytes[3] === 0x0a) {
    return 'DEX'
  }

  return 'unknown'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Keyboard shortcuts map
 */
export const shortcuts = {
  'G': 'Go to address',
  'g': 'Go to start',
  'H': 'Hex view',
  'D': 'Disassembly view',
  'S': 'Strings view',
  'F': 'Functions view',
  ':': 'Command mode',
  '/': 'Search',
  'n': 'Next search result',
  'N': 'Previous search result',
  'p': 'Previous function',
  'P': 'Next function',
  'u': 'Undo seek',
  'U': 'Redo seek',
  'q': 'Quit/close',
  '?': 'Help',
}