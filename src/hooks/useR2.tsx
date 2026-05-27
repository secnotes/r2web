import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import type { FileInfo, Function, Instruction, StringInfo, HexLine, ConsoleEntry, R2CommandResult, Section, DecompilerResult } from '../types'
import { R2WasiRuntime } from '../lib/R2WasiRuntime'
import { useWASMLoader } from '../lib/WASMLoader'

// R2 analyzer interface
interface R2AnalyzerInterface {
  init: () => Promise<void>
  loadFile: (data: Uint8Array, name: string) => Promise<boolean>
  cmd: (command: string) => Promise<R2CommandResult>
  analyze: () => Promise<void>
  getFileInfo: () => Promise<FileInfo>
  getFunctions: () => Promise<Function[]>
  getSections: () => Promise<Section[]>
  getSymbols: () => Promise<any[]>
  getImports: () => Promise<any[]>
  disassemble: (offset: number, count: number) => Promise<Instruction[]>
  disassembleAll: () => Promise<Instruction[]>
  getStrings: () => Promise<StringInfo[]>
  getHexDump: (offset: number, size: number) => Promise<HexLine[]>
  seek: (offset: number) => Promise<void>
  getCurrentOffset: () => number
  destroy: () => void
  getFunctionCFG: (offset: number) => Promise<{ nodes: any[], edges: any[] }>
  getDecompiledCode: (offset: number) => Promise<DecompilerResult>
}

interface R2ContextType {
  r2: R2AnalyzerInterface | null
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  fileInfo: FileInfo | null
  currentOffset: number
  functions: Function[]
  sections: Section[]
  symbols: any[]
  imports: any[]
  strings: StringInfo[]
  allInstructions: Instruction[]
  consoleHistory: ConsoleEntry[]
  decompiledCode: DecompilerResult | null
  loadFile: (file: File) => Promise<void>
  executeCommand: (cmd: string) => Promise<R2CommandResult>
  seekTo: (offset: number) => Promise<void>
  refreshAnalysis: () => Promise<void>
  addConsoleEntry: (entry: ConsoleEntry) => void
  decompileFunction: (offset: number) => Promise<void>
}

const R2Context = createContext<R2ContextType | null>(null)

export function useR2() {
  const context = useContext(R2Context)
  if (!context) throw new Error('useR2 must be used within R2Provider')
  return context
}

export function R2Provider({ children }: { children: React.ReactNode }) {
  const wasmLoader = useWASMLoader()
  const [r2, setR2] = useState<R2AnalyzerInterface | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [functions, setFunctions] = useState<Function[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [symbols, setSymbols] = useState<any[]>([])
  const [imports, setImports] = useState<any[]>([])
  const [strings, setStrings] = useState<StringInfo[]>([])
  const [allInstructions, setAllInstructions] = useState<Instruction[]>([])
  const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([])
  const [decompiledCode, setDecompiledCode] = useState<DecompilerResult | null>(null)
  const decompileCache = useRef<Map<number, DecompilerResult>>(new Map())
  const lastDecompiledOffset = useRef<number>(0)
  const consoleIdRef = useRef(0)

  // Define addConsoleEntry BEFORE useEffect that uses it
  const addConsoleEntry = useCallback((entry: ConsoleEntry) => {
    setConsoleHistory(prev => [...prev.slice(-100), entry])
  }, [])

  // Initialize R2 WASM when WASM modules are ready
  useEffect(() => {
    const initR2 = async () => {
      // Wait for WASM modules to load
      if (!wasmLoader.isReady) return

      try {
        setIsLoading(true)
        addConsoleEntry({
          id: consoleIdRef.current++,
          type: 'info',
          content: 'Initializing radare2 WASM...',
          timestamp: Date.now()
        })

        // Get radare2 module from loader
        const r2Module = wasmLoader.modules.get('radare2')
        const instance = await R2WasiRuntime.getInstance(r2Module)
        setR2(instance as unknown as R2AnalyzerInterface)

        addConsoleEntry({
          id: consoleIdRef.current++,
          type: 'info',
          content: 'R2Web initialized (radare2 WASM)',
          timestamp: Date.now()
        })
      } catch (e) {
        console.error('Analyzer init failed:', e)
        setError(`Failed to initialize: ${e}`)
        addConsoleEntry({
          id: consoleIdRef.current++,
          type: 'error',
          content: `Initialization failed: ${e}`,
          timestamp: Date.now()
        })
      } finally {
        setIsLoading(false)
      }
    }
    initR2()
  }, [wasmLoader.isReady, wasmLoader.modules, addConsoleEntry])

  const loadFile = useCallback(async (file: File) => {
    if (!r2) return
    try {
      setIsLoading(true)
      setError(null)
      const buffer = await file.arrayBuffer()
      const data = new Uint8Array(buffer)

      addConsoleEntry({
        id: consoleIdRef.current++,
        type: 'info',
        content: `Loading ${file.name}...`,
        timestamp: Date.now()
      })

      await r2.loadFile(data, file.name)
      await r2.analyze()

      addConsoleEntry({
        id: consoleIdRef.current++,
        type: 'info',
        content: 'Analyzing binary...',
        timestamp: Date.now()
      })

      const info = await r2.getFileInfo()
      setFileInfo(info)

      const funcs = await r2.getFunctions()
      setFunctions(funcs)

      // Get sections, symbols, imports, strings
      const secs = await r2.getSections()
      setSections(secs)

      const syms = await r2.getSymbols()
      setSymbols(syms)

      const imps = await r2.getImports()
      setImports(imps)

      const strs = await r2.getStrings()
      setStrings(strs)

      // Disassemble all functions
      addConsoleEntry({
        id: consoleIdRef.current++,
        type: 'info',
        content: `Disassembling ${funcs.length} functions...`,
        timestamp: Date.now()
      })

      const allInsts = await r2.disassembleAll()
      setAllInstructions(allInsts)

      // Set current offset to first function or entry point
      const firstFunc = funcs.find(f => f.name === '_start') || funcs[0]
      setCurrentOffset(firstFunc?.offset || info.entrypoint || 0)

      setIsLoaded(true)
      addConsoleEntry({
        id: consoleIdRef.current++,
        type: 'info',
        content: `Loaded: ${file.name} (${file.size} bytes, ${info.architecture}-${info.bits}, ${funcs.length} functions, ${allInsts.length} instructions)`,
        timestamp: Date.now()
      })
    } catch (e) {
      setError(`Failed to load file: ${e}`)
      addConsoleEntry({
        id: consoleIdRef.current++,
        type: 'error',
        content: `Error loading file: ${e}`,
        timestamp: Date.now()
      })
    } finally {
      setIsLoading(false)
    }
  }, [r2, addConsoleEntry])

  const executeCommand = useCallback(async (cmd: string): Promise<R2CommandResult> => {
    if (!r2) return { success: false, output: '', error: 'R2 not initialized' }
    addConsoleEntry({
      id: consoleIdRef.current++,
      type: 'input',
      content: cmd,
      timestamp: Date.now()
    })
    const result = await r2.cmd(cmd)
    addConsoleEntry({
      id: consoleIdRef.current++,
      type: result.success ? 'output' : 'error',
      content: result.output || result.error || '',
      timestamp: Date.now()
    })
    return result
  }, [r2, addConsoleEntry])

  const seekTo = useCallback(async (offset: number) => {
    if (!r2) return
    await r2.seek(offset)
    setCurrentOffset(offset)
  }, [r2])

  const refreshAnalysis = useCallback(async () => {
    if (!r2) return
    await r2.analyze()
    const funcs = await r2.getFunctions()
    setFunctions(funcs)
  }, [r2])

  const decompileFunction = useCallback(async (offset: number) => {
    if (!r2) return

    // Check cache first
    const cached = decompileCache.current.get(offset)
    if (cached) {
      // Only update state if offset changed
      if (lastDecompiledOffset.current !== offset) {
        setDecompiledCode(cached)
        lastDecompiledOffset.current = offset
      }
      // Always clear loading state
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const result = await r2.getDecompiledCode(offset)
      setDecompiledCode(result)
      decompileCache.current.set(offset, result)
      lastDecompiledOffset.current = offset
    } catch (e) {
      setDecompiledCode({ code: `// Error: ${e}`, annotations: [] })
    } finally {
      setIsLoading(false)
    }
  }, [r2])

  return (
    <R2Context.Provider value={{
      r2,
      isLoaded,
      isLoading,
      error,
      fileInfo,
      currentOffset,
      functions,
      sections,
      symbols,
      imports,
      strings,
      allInstructions,
      consoleHistory,
      decompiledCode,
      loadFile,
      executeCommand,
      seekTo,
      refreshAnalysis,
      addConsoleEntry,
      decompileFunction,
    }}>
      {children}
    </R2Context.Provider>
  )
}