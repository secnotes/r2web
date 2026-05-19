import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

// Read version from package.json
const pkg = require('./package.json')

export default defineConfig({
  plugins: [react(), wasm()],
  base: './',  // Use relative paths for local file access and GitHub Pages
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  optimizeDeps: {
    exclude: ['@wasmer/wasi', '@wasmer/wasmfs']
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: 'docs'  // Output to docs for GitHub Pages
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  assetsInclude: ['**/*.wasm']
})