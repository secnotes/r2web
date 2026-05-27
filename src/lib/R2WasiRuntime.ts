// Radare2 WASI Runtime - Complete binary analysis using radare2 WASM
// Using WASIInit module to ensure WASI is properly initialized

import type { FileInfo, Function, Instruction, StringInfo, HexLine, R2CommandResult, Section, DecompilerResult } from '../types'
import { getWASI, isWASIReady } from './WASIInit'

// Radare2 JSON output types - matching actual r2 output
interface R2Function {
  name: string
  addr: number
  offset?: number
  size: number
  type?: string
}

interface R2Instruction {
  addr: number
  offset?: number
  bytes: string
  opcode: string
  disasm?: string
  size: number
  jump?: number     // Jump target address
  fail?: number     // Fallthrough address for conditional jumps
  type?: string     // Instruction type: cjmp, jmp, call, ret, etc.
}

interface R2Section {
  name: string
  size: number
  vsize?: number
  vaddr: number
  paddr: number
  perm?: string
  type?: string
}

interface R2FileInfoJSON {
  core?: {
    type?: string
    file?: string
    size?: number
    format?: string
  }
  bin?: {
    arch?: string
    bits?: number
    bintype?: string
    compiler?: string
    endian?: string
    machine?: string
    os?: string
    entry?: number      // Entry point address
    va?: boolean        // Virtual address mode
  }
}

interface R2String {
  string: string
  vaddr: number
  paddr: number
  size: number
  section?: string
  type?: string
}

interface R2Symbol {
  name: string
  realname?: string
  ordinal?: number
  bind?: string
  size?: number
  type?: string
  vaddr: number
  paddr?: number
  is_imported?: boolean
}

interface R2Import {
  name: string
  ordinal?: number
  bind?: string
  type?: string
  plt?: number
}

// WASI types from @wasmer/wasi - using any to avoid TS issues
type WASIInstance = any

// Singleton instance
let r2Runtime: R2WasiRuntime | null = null

export class R2WasiRuntime {
  private r2Module: WebAssembly.Module | null = null
  private WASIClass: WASIInstance | null = null
  private initialized: boolean = false
  private fileData: Uint8Array | null = null
  private fileName: string = ''

  static async getInstance(module?: WebAssembly.Module): Promise<R2WasiRuntime> {
    if (!r2Runtime) {
      r2Runtime = new R2WasiRuntime()
      await r2Runtime.init(module)
    }
    return r2Runtime
  }

  async init(providedModule?: WebAssembly.Module): Promise<void> {
    if (this.initialized) return

    try {
      // Check if WASI is ready (initialized by WASMLoader)
      if (!isWASIReady()) {
        throw new Error('WASI not initialized - WASMLoader should initialize WASI first')
      }

      // Get WASI module from WASIInit
      const wasiModule = getWASI()
      this.WASIClass = wasiModule.WASI

      if (!this.WASIClass) {
        throw new Error('WASI class not found in module')
      }

      // Use provided module or load from URL
      if (providedModule) {
        this.r2Module = providedModule
      } else {
        const r2Url = new URL('../wasm/radare2.wasm', import.meta.url).href
        const r2Response = await fetch(r2Url)
        if (!r2Response.ok) {
          throw new Error(`Failed to fetch radare2.wasm: ${r2Response.status}`)
        }
        const r2Bytes = await r2Response.arrayBuffer()
        this.r2Module = await WebAssembly.compile(r2Bytes)
      }

      this.initialized = true
    } catch (error) {
      console.error('[R2Wasi] Init failed:', error)
      throw error
    }
  }

  // Run radare2 with commands and return stdout
  private async runCommands(commands: string[]): Promise<string> {
    if (!this.WASIClass || !this.r2Module || !this.fileData) {
      console.error('[R2Wasi] Missing required components:', {
        hasWASI: !!this.WASIClass,
        hasModule: !!this.r2Module,
        hasFile: !!this.fileData
      })
      return ''
    }

    try {
      const cmdString = commands.join(';')
      const args = [
        'radare2',
        '-q',
        '-e', 'scr.color=false',
        '-e', 'scr.utf8=false',
        '-e', 'asm.bytes=true',
        '-e', 'bin.relocs.apply=false',
        '-c', cmdString,
        '/tmp/binary'
      ]

      // Create WASI instance with larger buffer for stdout
      const wasi = new this.WASIClass({
        args,
        env: { HOME: '/home', TERM: 'xterm' },
        stdoutBuffer: new Uint8Array(1024 * 1024 * 10)
      })

      // Create directory and write file
      const fs = wasi.fs
      fs.createDir('/tmp')
      const file = fs.open('/tmp/binary', { create: true, write: true, read: true })
      file.write(this.fileData)

      // Build imports
      const imports: Record<string, Record<string, any>> = {}
      const wasiImports = wasi.getImports(this.r2Module)
      for (const [moduleName, moduleImports] of Object.entries(wasiImports)) {
        imports[moduleName] = moduleImports as Record<string, any>
      }

      // Add custom r2 imports
      imports['r2'] = {
        key_next: () => 0,
        is_tty: () => 0,
        set_raw_mode: (_mode: number) => {},
        http_get: (_url: number, _buf: number, _len: number) => BigInt(0),
        http_post: (_url: number, _data: number, _len: number, _buf: number, _buflen: number, _method: number) => 0,
      }

      // Instantiate WASM
      const wasmResult = await WebAssembly.instantiate(this.r2Module, imports) as WebAssembly.Instance | { instance: WebAssembly.Instance }
      const instance = (wasmResult as any).instance || wasmResult

      // Run WASI program
      wasi.start(instance)

      // Get stdout
      const stdout = wasi.getStdoutString() || ''
      const cleanOutput = stdout
        .split('\n')
        .filter((line: string) => !line.startsWith('INFO:') && !line.startsWith('WARN:') && !line.startsWith('ERROR:'))
        .join('\n')

      return cleanOutput
    } catch (e) {
      console.error('[R2Wasi] runCommands error:', e)
      return ''
    }
  }

  async loadFile(data: Uint8Array, name: string): Promise<boolean> {
    this.fileData = data
    this.fileName = name
    return true
  }

  async analyze(): Promise<void> {
    // Analysis will run with first query
  }

  async getFileInfo(): Promise<FileInfo> {
    const ijOutput = await this.runCommands(['ij'])
    const iSjOutput = await this.runCommands(['iSj'])

    try {
      const info = JSON.parse(ijOutput) as R2FileInfoJSON
      const core = info.core || {}
      const bin = info.bin || {}

      let sections: Section[] = []
      try {
        const rawSections = JSON.parse(iSjOutput) as R2Section[]
        sections = rawSections.map(s => ({
          name: s.name,
          size: s.size,
          vaddr: s.vaddr,
          paddr: s.paddr,
          flags: s.perm || ''
        }))
      } catch {
        console.warn('[R2Wasi] Failed to parse iSj')
      }

      return {
        name: core.file || this.fileName,
        size: core.size || this.fileData?.length || 0,
        type: bin.bintype || core.type || 'unknown',
        architecture: bin.arch || 'unknown',
        bits: bin.bits || 32,
        format: bin.bintype || core.format || 'unknown',
        entrypoint: bin.entry || 0,
        sections
      }
    } catch (e) {
      console.error('[R2Wasi] Failed to parse ij:', e)
      return {
        name: this.fileName,
        size: this.fileData?.length || 0,
        type: 'unknown',
        architecture: 'unknown',
        bits: 32,
        format: 'unknown',
        entrypoint: 0,
        sections: []
      }
    }
  }

  async getSections(): Promise<Section[]> {
    const output = await this.runCommands(['iSj'])
    try {
      const sections = JSON.parse(output) as R2Section[]
      return sections.map(s => ({
        name: s.name,
        size: s.size,
        vaddr: s.vaddr,
        paddr: s.paddr,
        flags: s.perm || ''
      }))
    } catch (e) {
      console.error('[R2Wasi] Failed to parse iSj:', e)
      return []
    }
  }

  async getFunctions(): Promise<Function[]> {
    const output = await this.runCommands(['aaa', 'aflj'])
    try {
      const funcs = JSON.parse(output) as R2Function[]
      return funcs.map(f => ({
        name: f.name,
        offset: f.addr || f.offset || 0,
        size: f.size || 32,
        type: f.type || 'fcn'
      })).slice(0, 500)
    } catch (e) {
      console.error('[R2Wasi] Failed to parse aflj:', e)
      return []
    }
  }

  async disassemble(offset: number, count: number): Promise<Instruction[]> {
    const output = await this.runCommands(['aa', `s 0x${offset.toString(16)}`, `pdj ${count}`])
    try {
      const insts = JSON.parse(output) as R2Instruction[]
      return insts.map(i => {
        // Handle missing disasm/opcode fields (some ARM instructions)
        const disasm = i.disasm || i.opcode || 'unknown'
        const parts = disasm.split(' ')
        return {
          offset: i.addr || i.offset || 0,
          bytes: i.bytes || '',
          mnemonic: parts[0] || 'unknown',
          operands: parts.slice(1).join(' ') || '',
          // Include control flow info from radare2
          jump: i.jump,
          fail: i.fail,
          type: i.type
        }
      })
    } catch (e) {
      console.error('[R2Wasi] Failed to parse pdj:', e)
      return []
    }
  }

  async disassembleAll(): Promise<Instruction[]> {
    const funcs = await this.getFunctions()
    const allInstructionsMap = new Map<number, Instruction>()

    for (const func of funcs) {
      // Calculate instruction count based on function size and typical instruction size (avg 4-6 bytes)
      // Add generous buffer to ensure we capture all instructions including variable-length ones
      const estimatedInstCount = Math.ceil((func.size || 100) / 3) + 50
      const insts = await this.disassemble(func.offset, estimatedInstCount)
      for (const inst of insts) {
        // Only include instructions within function bounds
        if (inst.offset >= func.offset && inst.offset < func.offset + (func.size || 1000)) {
          allInstructionsMap.set(inst.offset, inst)
        }
      }
      if (allInstructionsMap.size > 20000) break // Limit for very large binaries
    }

    return Array.from(allInstructionsMap.values()).sort((a, b) => a.offset - b.offset)
  }

  async getStrings(): Promise<StringInfo[]> {
    const output = await this.runCommands(['izzj'])
    try {
      const strings = JSON.parse(output) as R2String[]
      return strings.map(s => ({
        offset: s.paddr || s.vaddr,
        value: s.string,
        type: s.type || 'ascii',
        section: s.section
      })).slice(0, 500)
    } catch (e) {
      console.error('[R2Wasi] Failed to parse izzj:', e)
      return []
    }
  }

  async getSymbols(): Promise<any[]> {
    const output = await this.runCommands(['isj'])
    try {
      const symbols = JSON.parse(output) as R2Symbol[]
      return symbols.map(s => ({
        name: s.name,
        realname: s.realname || s.name,
        address: s.vaddr,
        size: s.size || 0,
        type: s.type || 'NOTYPE',
        bind: s.bind || 'LOCAL',
        is_imported: s.is_imported || false
      }))
    } catch (e) {
      console.error('[R2Wasi] Failed to parse isj:', e)
      return []
    }
  }

  async getImports(): Promise<any[]> {
    const output = await this.runCommands(['iij'])
    try {
      const imports = JSON.parse(output) as R2Import[]
      return imports.map(i => ({
        name: i.name,
        library: 'libc.so.6',
        offset: i.plt || 0,
        type: i.type || 'FUNC',
        bind: i.bind || 'GLOBAL'
      }))
    } catch (e) {
      console.error('[R2Wasi] Failed to parse iij:', e)
      return []
    }
  }

  async getHexDump(offset: number, size: number): Promise<HexLine[]> {
    const output = await this.runCommands([`s 0x${offset.toString(16)}`, `pxj ${size}`])

    if (!this.fileData) return []

    try {
      // pxj returns raw byte array [127, 69, 76, 70, ...]
      const bytes = JSON.parse(output) as number[]
      const lines: HexLine[] = []

      for (let i = 0; i < bytes.length; i += 16) {
        const lineBytes = bytes.slice(i, Math.min(i + 16, bytes.length))
        lines.push({
          offset: offset + i,
          bytes: lineBytes.map(b => b.toString(16).padStart(2, '0')).join(' '),
          ascii: lineBytes.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('')
        })
      }
      return lines
    } catch (e) {
      // Fallback: manual hex dump
      const lines: HexLine[] = []
      for (let i = offset; i < offset + size && i < this.fileData.length; i += 16) {
        const chunk = this.fileData.slice(i, Math.min(i + 16, this.fileData.length))
        lines.push({
          offset: i,
          bytes: Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' '),
          ascii: Array.from(chunk).map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('')
        })
      }
      return lines
    }
  }

  async seek(_offset: number): Promise<void> {}

  getCurrentOffset(): number {
    return 0
  }

  async cmd(command: string): Promise<R2CommandResult> {
    const output = await this.runCommands([command])
    return {
      success: output.length > 0 || command.startsWith('a'),
      output: output
    }
  }

  // Get CFG for current function using radare2's built-in analysis
  async getFunctionCFG(offset: number): Promise<{ nodes: any[], edges: any[] }> {
    try {
      // Use agfj to get CFG in JSON format
      const output = await this.runCommands(['aaa', `s 0x${offset.toString(16)}`, 'agfj'])

      if (!output || output.trim() === '') {
        return { nodes: [], edges: [] }
      }

      // Parse the JSON output
      const cfgData = JSON.parse(output)

      // agfj returns an array of function objects, each containing a "blocks" array
      let blocks: any[] = []

      if (Array.isArray(cfgData) && cfgData.length > 0) {
        const funcObj = cfgData[0]
        blocks = funcObj.blocks || []
      } else if (cfgData.nodes) {
        return {
          nodes: cfgData.nodes.map((n: any) => ({
            id: `n${n.offset || n.address}`,
            address: n.offset || n.address,
            size: n.size
          })),
          edges: cfgData.edges || []
        }
      }

      // Process blocks
      const nodes: any[] = []
      const edges: any[] = []

      for (const block of blocks) {
        const blockAddr = block.addr || block.address || 0

        nodes.push({
          id: `n${blockAddr}`,
          address: blockAddr,
          size: block.size || 16
        })

        if (block.jump !== undefined && block.jump !== null) {
          edges.push({
            from: `n${blockAddr}`,
            to: `n${block.jump}`,
            type: block.fail !== undefined ? 'condition_true' : 'normal'
          })
        }
        if (block.fail !== undefined && block.fail !== null) {
          edges.push({
            from: `n${blockAddr}`,
            to: `n${block.fail}`,
            type: 'condition_false'
          })
        }
      }

      return { nodes, edges }
    } catch (e) {
      return { nodes: [], edges: [] }
    }
  }

  // Get decompiled pseudo-C code for current function using radare2's pdcj command
  async getDecompiledCode(offset: number): Promise<DecompilerResult> {
    try {
      // First analyze the function, then decompile
      const output = await this.runCommands([
        `af @ 0x${offset.toString(16)}`,
        `s 0x${offset.toString(16)}`,
        'pdcj'
      ])

      if (!output || output.trim() === '') {
        // Fallback to pdc (plain text pseudo-C)
        const pdcOutput = await this.runCommands([
          `af @ 0x${offset.toString(16)}`,
          `s 0x${offset.toString(16)}`,
          'pdc'
        ])
        if (pdcOutput && pdcOutput.trim()) {
          return { code: pdcOutput, annotations: [] }
        }
        return { code: '// No decompilation available', annotations: [] }
      }

      // Parse JSON output
      const decompiledData = JSON.parse(output)

      return {
        code: decompiledData.code || '// No code generated',
        annotations: decompiledData.annotations || []
      }
    } catch (e) {
      // Try plain pdc as fallback
      try {
        const pdcOutput = await this.runCommands([
          `af @ 0x${offset.toString(16)}`,
          `s 0x${offset.toString(16)}`,
          'pdc'
        ])
        if (pdcOutput && pdcOutput.trim()) {
          return { code: pdcOutput, annotations: [] }
        }
      } catch {
        // ignore
      }
      return { code: `// Error: ${e}`, annotations: [] }
    }
  }

  destroy(): void {
    this.fileData = null
    this.fileName = ''
  }
}