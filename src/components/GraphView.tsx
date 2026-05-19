import { useState, useRef, useEffect } from 'react'
import { useR2 } from '../hooks/useR2'

interface GraphNode {
  id: string
  address: number
  content: string[]
  type: 'block' | 'condition' | 'return'
  x: number
  y: number
  width: number
  height: number
}

interface GraphEdge {
  from: string
  to: string
  type: 'normal' | 'condition_true' | 'condition_false'
}

interface CFGData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  totalHeight: number
  totalWidth: number
  originalCount: number
  nodeLevels?: Map<string, number>
  nodeColumns?: Map<string, number>
}

export function GraphView() {
  const { fileInfo, currentOffset, allInstructions, functions, r2 } = useR2()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cfgData, setCfgData] = useState<CFGData>({ nodes: [], edges: [], totalHeight: 400, totalWidth: 600, originalCount: 0 })

  // Fetch CFG from radare2 when function changes
  useEffect(() => {
    const fetchCFG = async () => {
      if (!r2 || currentOffset === undefined || !functions || functions.length === 0) {
        console.log('[Graph] Skipping CFG fetch: r2=', !!r2, 'currentOffset=', currentOffset, 'functions=', functions?.length)
        return
      }

      // Find current function
      const currentFunc = functions.find(f => f.offset === currentOffset) ||
                          functions.find(f =>
                            f.offset <= currentOffset &&
                            f.offset + f.size > currentOffset &&
                            !f.name.startsWith('sym.imp.')
                          ) ||
                          functions.find(f => !f.name.startsWith('sym.imp.'))

      if (!currentFunc) {
        console.log('[Graph] No function found for offset:', currentOffset)
        return
      }

      console.log('[Graph] Fetching CFG for function:', currentFunc.name, 'offset:', currentFunc.offset)

      // Use radare2's built-in CFG analysis
      const cfg = await r2.getFunctionCFG(currentFunc.offset)
      console.log('[Graph] Radare2 CFG:', cfg)

      if (cfg.nodes.length === 0) {
        // Fallback to manual CFG construction
        setCfgData(buildManualCFG(allInstructions, currentFunc))
        return
      }

      // Get instructions for each block
      const nodes: GraphNode[] = []
      for (const r2Node of cfg.nodes) {
        // Address is already a number from r2Node.address
        const addr = r2Node.address || 0
        console.log('[Graph] Node address:', addr, 'type:', typeof addr)

        // Find instructions in this block
        const blockInsts = allInstructions?.filter(inst =>
          inst.offset >= addr && inst.offset < addr + (r2Node.size || 16)
        ) || []

        console.log('[Graph] Block instructions:', blockInsts.length, 'for addr:', addr)

        // Determine block type
        const lastInst = blockInsts[blockInsts.length - 1]
        const isConditional = lastInst?.type === 'cjmp'
        const isReturn = lastInst?.type === 'ret' || ['ret', 'retn', 'iret'].includes(lastInst?.mnemonic?.toLowerCase())

        nodes.push({
          id: r2Node.id,
          address: addr,
          content: blockInsts.length > 0 ? blockInsts.map(i => `${i.mnemonic} ${i.operands}`) : [`Block at 0x${addr.toString(16)}`],
          type: isReturn ? 'return' : isConditional ? 'condition' : 'block',
          x: 100,
          y: 50,
          width: 280,
          height: Math.max(blockInsts.length * 16 + 35, 60)
        })
      }

      // Apply layout
      const layoutedData = applyLayout(nodes, cfg.edges)
      setCfgData(layoutedData)
    }

    fetchCFG()
  }, [r2, currentOffset, functions, allInstructions])

  // Manual CFG construction fallback
  const buildManualCFG = (instructions: any[] | null | undefined, currentFunc: any): CFGData => {
    console.log('[Graph] Building manual CFG, currentFunc:', currentFunc?.name, 'offset:', currentFunc?.offset)

    if (!instructions || instructions.length === 0) {
      console.log('[Graph] No instructions available')
      return { nodes: [], edges: [], totalHeight: 400, totalWidth: 600, originalCount: 0 }
    }

    if (!currentFunc || isNaN(currentFunc.offset)) {
      console.log('[Graph] Invalid function data')
      return { nodes: [], edges: [], totalHeight: 400, totalWidth: 600, originalCount: 0 }
    }

    const funcInstructions = instructions.filter(inst =>
      inst.offset >= currentFunc.offset && inst.offset < currentFunc.offset + (currentFunc.size || 1000)
    )

    console.log('[Graph] Function instructions:', funcInstructions.length)

    if (funcInstructions.length === 0) return { nodes: [], edges: [], totalHeight: 400, totalWidth: 600, originalCount: 0 }

    // Build block leaders from jump/fail info
    const blockLeaders = new Set<number>()
    blockLeaders.add(currentFunc.offset)

    for (const inst of funcInstructions) {
      if (inst.jump !== undefined) {
        const targetAddr = inst.jump
        if (targetAddr >= currentFunc.offset && targetAddr < currentFunc.offset + (currentFunc.size || 1000)) {
          blockLeaders.add(targetAddr)
        }
      }
      if (inst.fail !== undefined && inst.type === 'cjmp') {
        const failAddr = inst.fail
        if (failAddr >= currentFunc.offset && failAddr < currentFunc.offset + (currentFunc.size || 1000)) {
          blockLeaders.add(failAddr)
        }
      }
    }

    const sortedLeaders = Array.from(blockLeaders).sort((a, b) => a - b)
    let nodes: GraphNode[] = []
    let edges: GraphEdge[] = []

    for (let i = 0; i < sortedLeaders.length; i++) {
      const blockStart = sortedLeaders[i]
      const blockEnd = sortedLeaders[i + 1] || currentFunc.offset + (currentFunc.size || 1000)
      const blockInsts = funcInstructions.filter(inst => inst.offset >= blockStart && inst.offset < blockEnd)

      if (blockInsts.length === 0) continue

      const lastInst = blockInsts[blockInsts.length - 1]
      const isConditionalJump = lastInst.type === 'cjmp'
      const isReturn = lastInst.type === 'ret'
      const isUnconditionalJump = lastInst.type === 'jmp' && !isConditionalJump

      nodes.push({
        id: `n${i}`,
        address: blockStart,
        content: blockInsts.map(i => `${i.mnemonic} ${i.operands}`),
        type: isReturn ? 'return' : isConditionalJump ? 'condition' : 'block',
        x: 100,
        y: 50,
        width: 280,
        height: Math.max(blockInsts.length * 16 + 35, 60)
      })

      if (!isReturn) {
        if (lastInst.jump !== undefined) {
          const targetIdx = sortedLeaders.indexOf(lastInst.jump)
          if (targetIdx !== -1) {
            edges.push({ from: `n${i}`, to: `n${targetIdx}`, type: isConditionalJump ? 'condition_true' : 'normal' })
          }
        }
        if (lastInst.fail !== undefined) {
          const failIdx = sortedLeaders.indexOf(lastInst.fail)
          if (failIdx !== -1) {
            edges.push({ from: `n${i}`, to: `n${failIdx}`, type: 'condition_false' })
          }
        } else if (!isUnconditionalJump && i + 1 < sortedLeaders.length) {
          edges.push({ from: `n${i}`, to: `n${i + 1}`, type: 'normal' })
        }
      }
    }

    // Limit nodes
    const MAX_NODES = 50
    const originalCount = nodes.length
    if (nodes.length > MAX_NODES) {
      nodes = nodes.slice(0, MAX_NODES)
      const displayedIds = new Set(nodes.map(n => n.id))
      edges = edges.filter(e => displayedIds.has(e.from) && displayedIds.has(e.to))
    }

    return applyLayout(nodes, edges, originalCount)
  }

  // Apply layered layout to nodes
  const applyLayout = (nodes: GraphNode[], edges: GraphEdge[], originalCount?: number): CFGData => {
    if (nodes.length === 0) {
      return { nodes: [], edges: [], totalHeight: 400, totalWidth: 600, originalCount: 0 }
    }

    // Calculate node levels using BFS from entry node
    const nodeLevels = new Map<string, number>()
    const queue: { id: string; level: number }[] = [{ id: nodes[0].id, level: 0 }]
    nodeLevels.set(nodes[0].id, 0)

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      for (const edge of edges.filter(e => e.from === id)) {
        if (!nodeLevels.has(edge.to)) {
          nodeLevels.set(edge.to, level + 1)
          queue.push({ id: edge.to, level: level + 1 })
        }
      }
    }

    // Assign levels to isolated nodes
    for (let i = 0; i < nodes.length; i++) {
      if (!nodeLevels.has(nodes[i].id)) {
        nodeLevels.set(nodes[i].id, i)
      }
    }

    // Group by level
    const levelGroups = new Map<number, GraphNode[]>()
    for (const node of nodes) {
      const level = nodeLevels.get(node.id) || 0
      if (!levelGroups.has(level)) levelGroups.set(level, [])
      levelGroups.get(level)!.push(node)
    }

    // Position nodes
    const LEVEL_HEIGHT = 150  // Increased vertical spacing
    const NODE_WIDTH = 280
    const NODE_SPACING = 40
    const COLUMN_OFFSET = 100

    for (const [level, levelNodes] of levelGroups) {
      levelNodes.sort((a, b) => a.address - b.address)
      const totalWidth = levelNodes.reduce((sum) => sum + NODE_WIDTH + NODE_SPACING, -NODE_SPACING)
      const startX = COLUMN_OFFSET + Math.max(0, (600 - totalWidth) / 2)

      for (let i = 0; i < levelNodes.length; i++) {
        levelNodes[i].x = startX + i * (NODE_WIDTH + NODE_SPACING)
        levelNodes[i].y = 50 + level * LEVEL_HEIGHT
      }
    }

    // Adjust heights
    for (const node of nodes) {
      const level = nodeLevels.get(node.id) || 0
      let yPos = 50
      for (let l = 0; l < level; l++) {
        const prevNodes = levelGroups.get(l) || []
        yPos = Math.max(yPos, ...prevNodes.map(n => n.y + n.height + 30))
      }
      node.y = yPos
    }

    const totalHeight = nodes.reduce((max, n) => Math.max(max, n.y + n.height + 30), 100)
    const totalWidth = nodes.reduce((max, n) => Math.max(max, n.x + n.width + 20), 600)

    return {
      nodes,
      edges,
      totalHeight,
      totalWidth,
      originalCount: originalCount || nodes.length,
      nodeLevels,
      nodeColumns: new Map(nodes.map(n => [n.id, levelGroups.get(nodeLevels.get(n.id) || 0)?.indexOf(n) || 0]))
    }
  }

  // Reset position when offset changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }, [currentOffset])

  const formatAddress = (addr: number) => {
    if (addr === undefined || addr === null || isNaN(addr)) {
      return '0x????????'
    }
    return `0x${addr.toString(16).padStart(fileInfo?.bits === 64 ? 16 : 8, '0')}`
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(Math.max(0.1, Math.min(3, scale + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Calculate entry point distribution for nodes with multiple incoming edges
  const getEntryPointX = (nodeId: string, edgeIndex: number, totalEdges: number): number => {
    const node = cfgData.nodes.find(n => n.id === nodeId)
    if (!node) return 300

    // Distribute entry points evenly across the top edge
    // Leave some margin from the corners
    const margin = 30
    const availableWidth = node.width - 2 * margin

    if (totalEdges === 1) {
      // Single edge: center
      return node.x + node.width / 2
    }

    // Multiple edges: distribute evenly
    // edgeIndex 0, 1, 2, ... totalEdges-1
    const spacing = availableWidth / (totalEdges + 1)
    return node.x + margin + spacing * (edgeIndex + 1)
  }

  // Build mapping of incoming edges for each node
  const incomingEdgesMap = new Map<string, { edge: GraphEdge, index: number }[]>()
  for (const edge of cfgData.edges) {
    const existing = incomingEdgesMap.get(edge.to) || []
    existing.push({ edge, index: existing.length })
    incomingEdgesMap.set(edge.to, existing)
  }

  // Render all edges
  const renderEdges = () => {
    const paths: React.ReactElement[] = []

    // Process edges in order to assign entry points
    for (const edge of cfgData.edges) {
      const fromNode = cfgData.nodes.find(n => n.id === edge.from)
      const toNode = cfgData.nodes.find(n => n.id === edge.to)
      if (!fromNode || !toNode) continue

      // Find this edge's index among incoming edges to the target
      const incomingList = incomingEdgesMap.get(edge.to) || []
      const edgeInfo = incomingList.find(e => e.edge.from === edge.from && e.edge.to === edge.to)
      const edgeIndex = edgeInfo?.index || 0
      const totalIncoming = incomingList.length

      // Colors based on edge type
      const color = edge.type === 'condition_true' ? 'var(--success)' :
                    edge.type === 'condition_false' ? 'var(--error)' : 'var(--accent)'
      const markerId = edge.type === 'condition_true' ? 'arrow-success' :
                       edge.type === 'condition_false' ? 'arrow-error' : 'arrow'

      // Exit point: bottom center of source node
      const x1 = fromNode.x + fromNode.width / 2
      const y1 = fromNode.y + fromNode.height

      // Entry point: distributed across top edge of target node
      const x2 = getEntryPointX(edge.to, edgeIndex, totalIncoming)
      const y2 = toNode.y

      // Build path that avoids crossing nodes
      let pathD: string

      // Check if this is a back edge (going to a higher node - loop)
      const isBackEdge = toNode.y <= fromNode.y

      // Calculate horizontal offset needed
      const xOffset = x2 - x1

      if (isBackEdge) {
        // Back edge (loop): route around the side of the source node
        // Determine which side based on the target's position relative to source
        const goRight = xOffset >= 0
        const sideX = goRight ? fromNode.x + fromNode.width + 30 : fromNode.x - 30

        pathD = `M ${x1} ${y1}
                 L ${x1} ${y1 + 15}
                 L ${sideX} ${y1 + 15}
                 L ${sideX} ${y2 - 15}
                 L ${x2} ${y2 - 15}
                 L ${x2} ${y2}`
      } else if (Math.abs(xOffset) < 20) {
        // Nearly aligned vertically: simple vertical line
        pathD = `M ${x1} ${y1} L ${x2} ${y2}`
      } else {
        // Need horizontal routing: go down then sideways then down
        // Route at a point between the nodes
        const midY = Math.min(y1 + 30, (y1 + y2) / 2)

        pathD = `M ${x1} ${y1}
                 L ${x1} ${midY}
                 L ${x2} ${midY}
                 L ${x2} ${y2}`
      }

      paths.push(
        <g key={`${edge.from}-${edge.to}`}>
          <path
            d={pathD}
            stroke={color}
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#${markerId})`}
          />
          {/* Label for conditional edges */}
          {edge.type === 'condition_true' && (
            <text x={x1 + 5} y={y1 + 12} fill="var(--success)" fontSize="10" fontWeight="bold">T</text>
          )}
          {edge.type === 'condition_false' && (
            <text x={x1 - 15} y={y1 + 12} fill="var(--error)" fontSize="10" fontWeight="bold">F</text>
          )}
        </g>
      )
    }

    return paths
  }

  const renderNode = (node: GraphNode) => {
    const bgColor = node.type === 'condition' ? 'rgba(249, 226, 175, 0.2)' :
                    node.type === 'return' ? 'rgba(166, 227, 161, 0.2)' :
                    'var(--bg-secondary)'

    const borderColor = node.type === 'condition' ? 'var(--warning)' :
                        node.type === 'return' ? 'var(--success)' :
                        'var(--border)'

    return (
      <g key={node.id}>
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth="2"
          rx="4"
        />
        <text x={node.x + 8} y={node.y + 20} fill="var(--address)" fontSize="11">
          {formatAddress(node.address)}
        </text>
        {node.content.map((line, idx) => (
          <text key={idx} x={node.x + 8} y={node.y + 35 + idx * 14} fill="var(--text-primary)" fontSize="10">
            {line}
          </text>
        ))}
      </g>
    )
  }

  return (
    <div className="graph-view">
      <div className="view-header">
        <h3>Control Flow Graph</h3>
        {cfgData.originalCount > 50 && (
          <span className="graph-warning" title="Large functions are limited for performance">
            Showing {cfgData.nodes.length} of {cfgData.originalCount} blocks
          </span>
        )}
        <div className="graph-controls">
          <button onClick={() => setScale(scale * 1.2)}>+</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(scale * 0.8)}>-</button>
        </div>
      </div>
      <div
        className="graph-content"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={cfgData.totalWidth || '100%'}
          height={cfgData.totalHeight || '100%'}
          viewBox={`0 0 ${cfgData.totalWidth || 600} ${cfgData.totalHeight || 400}`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: '0 0',
            minWidth: cfgData.totalWidth,
            minHeight: cfgData.totalHeight,
          }}
        >
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
              <path d="M0,0 L0,4 L5,2 z" fill="var(--accent)" />
            </marker>
            <marker id="arrow-success" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
              <path d="M0,0 L0,4 L5,2 z" fill="var(--success)" />
            </marker>
            <marker id="arrow-error" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
              <path d="M0,0 L0,4 L5,2 z" fill="var(--error)" />
            </marker>
          </defs>
          {renderEdges()}
          {cfgData.nodes.map(renderNode)}
        </svg>
      </div>
      <style>{`
        .graph-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .view-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border);
        }
        .view-header h3 {
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .graph-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .graph-controls button {
          padding: 4px 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          border-radius: 4px;
        }
        .graph-controls span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .graph-warning {
          color: var(--warning);
          font-size: 0.8rem;
          padding: 4px 8px;
          background: rgba(249, 226, 175, 0.1);
          border-radius: 4px;
          border: 1px solid var(--warning);
        }
        .graph-content {
          flex: 1;
          overflow: hidden;
          cursor: grab;
          background: var(--bg-primary);
        }
        .graph-content:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}