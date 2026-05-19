// radare2 WebAssembly Interface using WASI runtime
// This module wraps the compiled radare2 WASI WASM for use in the browser

import { WASI } from '@wasmer/wasi'
import { WasmFs } from '@wasmer/wasmfs'
import type { FileInfo, Function, Instruction, StringInfo, HexLine, R2CommandResult } from '../types'

// WASM file URLs
const radare2WasmUrl = new URL('../wasm/radare2.wasm', import.meta.url).href
const rabin2WasmUrl = new URL('../wasm/rabin2.wasm', import.meta.url).href

export class R2Wasm {
  private wasmFs: WasmFs | null = null
  private module: WebAssembly.Module | null = null
  private rabin2Module: WebAssembly.Module | null = null
  private filePath: string = ''
  private fileData: Uint8Array | null = null
  private loaded: boolean = false
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    // Prevent double initialization
    if (this.initPromise) return this.initPromise

    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    try {
      console.log('[R2Wasm] Starting initialization...')

      // Initialize virtual filesystem
      this.wasmFs = new WasmFs()
      console.log('[R2Wasm] Virtual filesystem initialized')

      // Load WASM modules with progress
      console.log('[R2Wasm] Loading radare2.wasm (42MB)...')
      const startTime = Date.now()

      // Use rabin2 for initial analysis (smaller, faster for basic info)
      console.log('[R2Wasm] Loading rabin2.wasm for quick analysis...')
      const rabin2Response = await fetch(rabin2WasmUrl)
      if (!rabin2Response.ok) {
        throw new Error(`Failed to fetch rabin2.wasm: ${rabin2Response.status}`)
      }
      const rabin2Bytes = await rabin2Response.arrayBuffer()
      this.rabin2Module = await WebAssembly.compile(rabin2Bytes)
      console.log(`[R2Wasm] rabin2.wasm loaded in ${Date.now() - startTime}ms`)

      // Load full radare2 module
      const radare2StartTime = Date.now()
      const radare2Response = await fetch(radare2WasmUrl)
      if (!radare2Response.ok) {
        throw new Error(`Failed to fetch radare2.wasm: ${radare2Response.status}`)
      }
      const radare2Bytes = await radare2Response.arrayBuffer()
      this.module = await WebAssembly.compile(radare2Bytes)
      console.log(`[R2Wasm] radare2.wasm loaded in ${Date.now() - radare2StartTime}ms`)

      console.log('[R2Wasm] All WASM modules loaded successfully')
    } catch (error) {
      console.error('[R2Wasm] Initialization failed:', error)
      throw error
    }
  }

  async loadFile(data: Uint8Array, name: string): Promise<boolean> {
    if (!this.wasmFs) {
      console.error('[R2Wasm] wasmFs not initialized')
      return false
    }

    try {
      console.log(`[R2Wasm] Loading file: ${name} (${data.length} bytes)`)

      // Store file data
      this.fileData = data
      this.filePath = `/tmp/${name}`

      // Write file to virtual filesystem
      this.wasmFs.fs.writeFileSync(this.filePath, data)
      console.log(`[R2Wasm] File written to ${this.filePath}`)

      this.loaded = true
      return true
    } catch (error) {
      console.error('[R2Wasm] Error loading file:', error)
      return false
    }
  }

  // Run a WASI WASM program and capture output
  private async runWasiProgram(
    module: WebAssembly.Module,
    args: string[]
  ): Promise<{ exitCode: number; output: string; error: string }> {
    if (!this.wasmFs) {
      return { exitCode: -1, output: '', error: 'wasmFs not initialized' }
    }

    const outputChunks: string[] = []
    const errorChunks: string[] = []

    // Create new WASI instance with arguments
    const wasi = new WASI({
      args: args,
      env: {},
      bindings: {
        ...WASI.defaultBindings,
        fs: this.wasmFs.fs,
      },
    })

    // Create new instance
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasi.wasiImport,
    })

    // Capture stdout/stderr by intercepting writes
    const originalWriteSync = this.wasmFs.fs.writeSync.bind(this.wasmFs.fs)
    this.wasmFs.fs.writeSync = (fd: number, buffer: Uint8Array, offset?: number, length?: number, _position?: number) => {
      const actualOffset = offset || 0
      const actualLength = length || buffer.length

      if (fd === 1) { // stdout
        const str = new TextDecoder().decode(buffer.slice(actualOffset, actualOffset + actualLength))
        outputChunks.push(str)
      } else if (fd === 2) { // stderr
        const str = new TextDecoder().decode(buffer.slice(actualOffset, actualOffset + actualLength))
        errorChunks.push(str)
      }
      return actualLength
    }

    let exitCode = 0
    try {
      wasi.start(instance)
    } catch (e: any) {
      // WASI exits by throwing - check for exit code
      if (e?.message?.includes('WASI Exit') || e?.code) {
        exitCode = e.code || 0
      } else {
        console.error('[R2Wasm] WASI execution error:', e)
        exitCode = 1
      }
    }

    // Restore original writeSync
    this.wasmFs.fs.writeSync = originalWriteSync

    return {
      exitCode,
      output: outputChunks.join(''),
      error: errorChunks.join(''),
    }
  }

  async cmd(command: string): Promise<R2CommandResult> {
    if (!this.loaded || !this.module) {
      return { success: false, output: '', error: 'No file loaded or module not ready' }
    }

    try {
      console.log(`[R2Wasm] Running command: ${command}`)

      // Run radare2 with command
      const result = await this.runWasiProgram(
        this.module,
        ['radare2', '-q', '-c', command, '-n', this.filePath]
      )

      console.log(`[R2Wasm] Command result: exit=${result.exitCode}, output=${result.output.substring(0, 100)}...`)

      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error || (result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined),
      }
    } catch (error) {
      console.error('[R2Wasm] Command failed:', error)
      return { success: false, output: '', error: String(error) }
    }
  }

  async analyze(): Promise<void> {
    console.log('[R2Wasm] Running analysis...')
    // Use lighter analysis for WASM (aaa can be slow)
    const result = await this.cmd('aa')
    if (!result.success) {
      console.warn('[R2Wasm] Analysis warning:', result.error)
    }
    console.log('[R2Wasm] Analysis complete')
  }

  async getFileInfo(): Promise<FileInfo> {
    if (!this.loaded || !this.rabin2Module) {
      throw new Error('No file loaded')
    }

    try {
      console.log('[R2Wasm] Getting file info with rabin2...')

      // Use rabin2 for quick file info (faster than radare2)
      const result = await this.runWasiProgram(
        this.rabin2Module,
        ['rabin2', '-j', this.filePath]
      )

      if (result.exitCode !== 0 || !result.output) {
        throw new Error(`rabin2 failed: ${result.error}`)
      }

      console.log('[R2Wasm] rabin2 output:', result.output.substring(0, 200))

      const info = JSON.parse(result.output)

      // Parse rabin2 JSON output
      return {
        name: this.filePath.split('/').pop() || '',
        size: this.fileData?.length || 0,
        type: info.format || 'Unknown',
        architecture: info.arch || 'unknown',
        bits: info.bits || 32,
        format: (info.format || 'unknown').toLowerCase(),
        entrypoint: info.entry || 0,
        sections: (info.sections || []).map((s: any) => ({
          name: s.name,
          size: s.size,
          vaddr: s.vaddr || s.paddr,
          paddr: s.paddr,
          flags: s.flags || '',
        })),
      }
    } catch (error) {
      console.error('[R2Wasm] getFileInfo failed:', error)
      throw error
    }
  }

  async getFunctions(): Promise<Function[]> {
    const result = await this.cmd('aflj')
    if (!result.success || !result.output) return []

    try {
      const funcs = JSON.parse(result.output)
      return funcs.map((f: any) => ({
        name: f.name,
        offset: f.offset,
        size: f.size,
        type: f.type || 'fcn',
      }))
    } catch {
      return []
    }
  }

  async disassemble(offset: number, count: number): Promise<Instruction[]> {
    const result = await this.cmd(`pdj ${count} @ 0x${offset.toString(16)}`)
    if (!result.success || !result.output) {
      // Fallback: return hex dump as disassembly
      const hexResult = await this.cmd(`p8 ${count * 4} @ 0x${offset.toString(16)}`)
      if (hexResult.success && hexResult.output) {
        // Return at least one instruction with hex
        return [{
          offset: offset,
          bytes: hexResult.output.trim(),
          mnemonic: 'raw',
          operands: '',
        }]
      }
      return []
    }

    try {
      const instructions = JSON.parse(result.output)
      return instructions.map((i: any) => ({
        offset: i.offset,
        bytes: i.bytes || '',
        mnemonic: i.disasm?.split(' ')[0] || '',
        operands: i.disasm?.split(' ').slice(1).join(' ') || '',
        comment: i.comment,
      }))
    } catch {
      return []
    }
  }

  async getStrings(): Promise<StringInfo[]> {
    const result = await this.cmd('izj')
    if (!result.success || !result.output) return []

    try {
      const strings = JSON.parse(result.output)
      return strings.map((s: any) => ({
        offset: s.paddr || s.vaddr,
        value: s.string,
        type: s.type || 'ascii',
        section: s.section,
      }))
    } catch {
      return []
    }
  }

  async getHexDump(offset: number, size: number): Promise<HexLine[]> {
    const result = await this.cmd(`pxj ${size} @ 0x${offset.toString(16)}`)
    if (!result.success || !result.output) {
      // Fallback: use file data directly
      if (this.fileData) {
        const lines: HexLine[] = []
        const bytesPerLine = 16
        const startOffset = Math.min(offset, this.fileData!.length)
        const endOffset = Math.min(offset + size, this.fileData!.length)

        for (let i = startOffset; i < endOffset; i += bytesPerLine) {
          const lineEnd = Math.min(i + bytesPerLine, endOffset)
          const lineBytes = this.fileData!.slice(i, lineEnd)
          lines.push({
            offset: i,
            bytes: Array.from(lineBytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
            ascii: Array.from(lineBytes).map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join(''),
          })
        }
        return lines
      }
      return []
    }

    try {
      const bytes = JSON.parse(result.output)
      const lines: HexLine[] = []
      const bytesPerLine = 16

      for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const lineBytes = bytes.slice(i, i + bytesPerLine)
        lines.push({
          offset: offset + i,
          bytes: lineBytes.map((b: number) => b.toString(16).padStart(2, '0')).join(' '),
          ascii: lineBytes.map((b: number) => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join(''),
        })
      }
      return lines
    } catch {
      return []
    }
  }

  async seek(offset: number): Promise<void> {
    // Just track internally - WASM runs fresh each time
    console.log(`[R2Wasm] Seek to 0x${offset.toString(16)}`)
  }

  getCurrentOffset(): number {
    return 0
  }

  destroy(): void {
    this.wasmFs = null
    this.module = null
    this.rabin2Module = null
    this.loaded = false
    this.fileData = null
  }
}