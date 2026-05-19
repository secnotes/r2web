// WASI Runtime Initialization
// This module ensures WASI is properly initialized before any WASM modules are loaded

import { Buffer } from 'buffer'
// Ensure Buffer is available globally
;(globalThis as any).Buffer = Buffer

let wasiInitialized = false
let wasiModule: any = null

export async function initWASI(): Promise<any> {
  if (wasiInitialized && wasiModule) {
    return wasiModule
  }

  console.log('[WASIInit] Starting WASI initialization...')

  try {
    // Import WASI module
    const module = await import('@wasmer/wasi') as any
    console.log('[WASIInit] Module imported, exports:', Object.keys(module))

    // Call init to load WASI WASM
    const initFn = module.init || module.default
    if (typeof initFn === 'function') {
      console.log('[WASIInit] Calling init()...')
      await initFn()
      console.log('[WASIInit] init() completed successfully')
    } else {
      console.warn('[WASIInit] No init function found')
    }

    wasiModule = module
    wasiInitialized = true
    console.log('[WASIInit] WASI initialized successfully')

    return wasiModule
  } catch (error) {
    console.error('[WASIInit] Initialization failed:', error)
    throw error
  }
}

export function getWASI(): any {
  if (!wasiModule) {
    throw new Error('WASI not initialized - call initWASI() first')
  }
  return wasiModule
}

export function isWASIReady(): boolean {
  return wasiInitialized
}