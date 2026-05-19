// Buffer polyfill for browser (required by @wasmer/wasi)
import { Buffer } from 'buffer'
;(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { WASMLoaderProvider, WASMProgressBar } from './lib/WASMLoader'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WASMLoaderProvider>
      <WASMProgressBar />
      <App />
    </WASMLoaderProvider>
  </React.StrictMode>,
)