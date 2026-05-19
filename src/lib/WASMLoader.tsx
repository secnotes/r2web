// WASM Loader Manager - manages loading of all WASM modules
// Shows progress during initial load

import { useState, useEffect, createContext, useContext } from 'react'
import { initWASI } from './WASIInit'

interface WASMModule {
  name: string
  url: string
  size: number // in MB
  loaded?: boolean
  error?: string | null
}

interface WASMProgress {
  totalModules: number
  loadedModules: number
  currentModule: string
  percent: number
  isLoading: boolean
  error: string | null
}

interface WASMContextType {
  progress: WASMProgress
  isReady: boolean
  modules: Map<string, WebAssembly.Module>
}

const WASMContext = createContext<WASMContextType | null>(null)

export function useWASMLoader() {
  const context = useContext(WASMContext)
  if (!context) throw new Error('useWASMLoader must be used within WASMLoaderProvider')
  return context
}

// Define WASM modules to load (URLs resolved via import.meta.url for Vite)
const WASM_MODULES: WASMModule[] = [
  // Primary: radare2 for full analysis (includes all functionality)
  { name: 'radare2', url: new URL('../wasm/radare2.wasm', import.meta.url).href, size: 42 },
  // Backup: rasm2 for fast disassembly (smaller, faster)
  { name: 'rasm2', url: new URL('../wasm/rasm2.wasm', import.meta.url).href, size: 23 },
]

export function WASMLoaderProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<WASMProgress>({
    totalModules: WASM_MODULES.length,
    loadedModules: 0,
    currentModule: '',
    percent: 0,
    isLoading: true,
    error: null
  })
  const [modules] = useState(new Map<string, WebAssembly.Module>())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const loadModules = async () => {
      try {
        console.log('[WASM] Starting module loading...')

        // Step 1: Initialize WASI runtime first
        console.log('[WASM] Initializing WASI runtime...')
        setProgress(prev => ({
          ...prev,
          currentModule: 'WASI Runtime',
          percent: 0
        }))

        await initWASI()
        console.log('[WASM] WASI runtime ready')

        // Step 2: Load radare2 WASM modules
        for (const module of WASM_MODULES) {
          setProgress(prev => ({
            ...prev,
            currentModule: module.name
          }))

          console.log(`[WASM] Loading ${module.name}...`)

          const startTime = Date.now()
          const response = await fetch(module.url)

          if (!response.ok) {
            throw new Error(`Failed to fetch ${module.name}: ${response.status}`)
          }

          // Get content length for progress tracking
          const contentLength = response.headers.get('content-length')
          const totalSize = contentLength ? parseInt(contentLength) : module.size * 1024 * 1024

          // Stream the response to track progress
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          const chunks: Uint8Array[] = []
          let loadedBytes = 0

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            chunks.push(value)
            loadedBytes += value.length

            // Update progress within module
            const modulePercent = (loadedBytes / totalSize) * 100
            const overallPercent = ((progress.loadedModules + modulePercent / 100) / WASM_MODULES.length) * 100

            setProgress(prev => ({
              ...prev,
              percent: Math.round(overallPercent)
            }))
          }

          // Combine chunks
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunks) {
            combined.set(chunk, offset)
            offset += chunk.length
          }

          console.log(`[WASM] Downloaded ${module.name} in ${Date.now() - startTime}ms`)

          // Compile WASM
          const compiledModule = await WebAssembly.compile(combined)
          modules.set(module.name, compiledModule)

          setProgress(prev => ({
            ...prev,
            loadedModules: prev.loadedModules + 1,
            percent: Math.round(((prev.loadedModules + 1) / WASM_MODULES.length) * 100)
          }))

          console.log(`[WASM] Compiled ${module.name}`)
        }

        setProgress(prev => ({
          ...prev,
          isLoading: false,
          percent: 100,
          currentModule: ''
        }))
        setIsReady(true)
        console.log('[WASM] All modules loaded successfully')

      } catch (error) {
        console.error('[WASM] Loading failed:', error)
        setProgress(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    loadModules()
  }, [])

  return (
    <WASMContext.Provider value={{ progress, isReady, modules }}>
      {children}
    </WASMContext.Provider>
  )
}

// Progress Bar Component
export function WASMProgressBar() {
  const { progress, isReady } = useWASMLoader()

  if (isReady) return null

  return (
    <div className="wasm-loader-overlay">
      <div className="wasm-loader-content">
        <div className="wasm-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">R2Web</span>
        </div>
        <div className="wasm-progress-bar">
          <div
            className="wasm-progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="wasm-progress-info">
          {progress.error ? (
            <span className="wasm-error">Error: {progress.error}</span>
          ) : (
            <span>
              Loading {progress.currentModule}... {progress.percent}%
            </span>
          )}
        </div>
        <div className="wasm-progress-detail">
          {progress.loadedModules} / {progress.totalModules} modules loaded
        </div>
      </div>
      <style>{`
        .wasm-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .wasm-loader-content {
          text-align: center;
          max-width: 400px;
        }
        .wasm-logo {
          margin-bottom: 30px;
        }
        .logo-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }
        .logo-text {
          font-size: 32px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .wasm-progress-bar {
          width: 100%;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .wasm-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--success));
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .wasm-progress-info {
          color: var(--text-primary);
          font-size: 16px;
          margin-bottom: 8px;
          text-align: center;
        }
        .wasm-progress-detail {
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
        }
        .wasm-error {
          color: var(--error);
        }
      `}</style>
    </div>
  )
}