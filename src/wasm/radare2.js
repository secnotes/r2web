// Mock radare2 WASM module for development
// This will be replaced with the actual compiled WASM module

interface MockModule {
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  HEAPU8: Uint8Array
  HEAPU32: Uint32Array
  callMain?: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
    unlink: (path: string) => void
    mkdir: (path: string) => void
  }
}

interface ModuleConfig {
  noInitialRun?: boolean
  locateFile?: (file: string) => string
}

export default async function createMockModule(config: ModuleConfig): Promise<MockModule> {
  // Return a mock module for development
  console.log('Loading mock radare2 module (WASM not yet compiled)')

  const mockMemory = new Uint8Array(1024 * 1024) // 1MB mock memory
  const mockMemory32 = new Uint32Array(mockMemory.buffer)

  const mockFS = {
    files: new Map<string, Uint8Array>(),
    writeFile: (path: string, data: Uint8Array) => {
      mockFS.files.set(path, data)
      console.log(`Mock FS: wrote ${data.length} bytes to ${path}`)
    },
    readFile: (path: string) => {
      const data = mockFS.files.get(path)
      if (!data) throw new Error(`File not found: ${path}`)
      return data
    },
    unlink: (path: string) => {
      mockFS.files.delete(path)
    },
    mkdir: (path: string) => {
      console.log(`Mock FS: created directory ${path}`)
    }
  }

  return {
    _malloc: (size: number) => {
      // Return a mock pointer
      return 100
    },
    _free: (ptr: number) => {
      // Mock free
    },
    HEAPU8: mockMemory,
    HEAPU32: mockMemory32,
    callMain: (args: string[]) => {
      console.log(`Mock callMain with args:`, args)
      return 0 // Success
    },
    FS: mockFS as any
  }
}