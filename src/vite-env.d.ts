// Global constants defined by Vite
declare const __APP_VERSION__: string

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.scss' {
  const content: Record<string, string>
  export default content
}

declare module '*.wasm' {
  const content: string
  export default content
}

declare module '@wasmer/wasi' {
  export class WASI {
    static defaultBindings: any
    wasiImport: any
    constructor(config: {
      args?: string[]
      env?: Record<string, string>
      bindings?: any
    })
    start(instance: WebAssembly.Instance): void
  }
}

declare module '@wasmer/wasmfs' {
  export class WasmFs {
    fs: any
  }
}