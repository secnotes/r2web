export interface FileInfo {
  name: string
  size: number
  type: string
  architecture: string
  bits: number
  format: string
  entrypoint: number
  sections: Section[]
}

export interface Section {
  name: string
  size: number
  vaddr: number
  paddr: number
  flags: string
}

export interface Function {
  name: string
  offset: number
  size: number
  type: string
  signature?: string
}

export interface Instruction {
  offset: number
  bytes: string
  mnemonic: string
  operands: string
  comment?: string
  // Control flow info from radare2
  jump?: number      // Jump target address for jmp/call
  fail?: number      // Fallthrough address for conditional jumps
  type?: string      // Instruction type: 'cjmp', 'jmp', 'call', 'ret', etc.
}

export interface StringInfo {
  offset: number
  value: string
  type: string
  section?: string
}

export interface HexLine {
  offset: number
  bytes: string
  ascii: string
}

export interface R2CommandResult {
  success: boolean
  output: string
  error?: string
}

export interface ConsoleEntry {
  id: number
  type: 'input' | 'output' | 'error' | 'info'
  content: string
  timestamp: number
}