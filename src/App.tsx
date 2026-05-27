import { useState, useRef, useCallback, useEffect } from 'react'
import { FunctionsView } from './components/FunctionsView'
import { ViewBar } from './components/ViewBar'
import { Header } from './components/Header'
import { AddressBar } from './components/AddressBar'
import { DisassemblyView } from './components/DisassemblyView'
import { HexView } from './components/HexView'
import { StringsView } from './components/StringsView'
import { ImportsView } from './components/ImportsView'
import { SectionsView } from './components/SectionsView'
import { SymbolsView } from './components/SymbolsView'
import { GraphView } from './components/GraphView'
import { ConsoleView } from './components/ConsoleView'
import { StatusBar } from './components/StatusBar'
import { FileDrop } from './components/FileDrop'
import { SearchBox } from './components/SearchBox'
import { DecompilerView } from './components/DecompilerView'
import { R2Provider, useR2 } from './hooks/useR2'
import { initLang } from './lib/i18n'
import './styles/App.css'

export type ViewType = 'disassembly' | 'hex' | 'strings' | 'imports' | 'sections' | 'symbols' | 'graph' | 'decompiler'

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('disassembly')
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [consoleHeight, setConsoleHeight] = useState(150)
  const { isLoaded, fileInfo } = useR2()
  const isResizing = useRef(false)
  const isConsoleResizing = useRef(false)

  // Sync theme with system preference (only if no saved preference)
  useEffect(() => {
    const savedTheme = localStorage.getItem('r2web-theme')
    if (!savedTheme) {
      // Only update if current theme doesn't match system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const currentTheme = document.documentElement.getAttribute('data-theme')
      const systemTheme = prefersDark ? 'dark' : 'light'
      if (currentTheme !== systemTheme) {
        document.documentElement.setAttribute('data-theme', systemTheme)
      }
    }
    initLang()
  }, [])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }, [])

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const newWidth = Math.max(150, Math.min(500, e.clientX))
    setSidebarWidth(newWidth)
  }, [])

  const stopResize = useCallback(() => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  }, [])

  const startConsoleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isConsoleResizing.current = true
    document.addEventListener('mousemove', handleConsoleResize)
    document.addEventListener('mouseup', stopConsoleResize)
  }, [])

  const handleConsoleResize = useCallback((e: MouseEvent) => {
    if (!isConsoleResizing.current) return
    const container = document.querySelector('.workspace')
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const newHeight = Math.max(50, Math.min(400, containerRect.bottom - e.clientY))
    setConsoleHeight(newHeight)
  }, [])

  const stopConsoleResize = useCallback(() => {
    isConsoleResizing.current = false
    document.removeEventListener('mousemove', handleConsoleResize)
    document.removeEventListener('mouseup', stopConsoleResize)
  }, [])

  if (!isLoaded) {
    return <FileDrop />
  }

  return (
    <div className="app-container">
      <Header />
      <AddressBar />
      <div className="main-content">
        <div className="sidebar-functions" style={{ width: sidebarWidth }}>
          <FunctionsView />
        </div>
        <div className="resize-handle" onMouseDown={startResize} />
        <div className="workspace">
          <div className="main-panel" style={{ flex: 1 }}>
            <ViewBar activeView={activeView} onViewChange={setActiveView} />
            <div className="view-content">
              {activeView === 'disassembly' && <DisassemblyView />}
              {activeView === 'hex' && <HexView />}
              {activeView === 'strings' && <StringsView />}
              {activeView === 'imports' && <ImportsView />}
              {activeView === 'sections' && <SectionsView />}
              {activeView === 'symbols' && <SymbolsView />}
              {activeView === 'graph' && <GraphView />}
              {activeView === 'decompiler' && <DecompilerView />}
            </div>
          </div>
          <div className="resize-handle-horizontal" onMouseDown={startConsoleResize} />
          <div className="console-panel" style={{ height: consoleHeight }}>
            <ConsoleView />
          </div>
        </div>
      </div>
      <StatusBar fileInfo={fileInfo} />
      <SearchBox />
    </div>
  )
}

export default function App() {
  return (
    <R2Provider>
      <AppContent />
    </R2Provider>
  )
}