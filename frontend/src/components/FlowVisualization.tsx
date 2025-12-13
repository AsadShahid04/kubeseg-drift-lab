import { useEffect, useRef, useState } from 'react'
import { Network } from 'vis-network'
import 'vis-network/dist/vis-network.min.css'
import axios from 'axios'

interface Flow {
  src_ns: string
  src_pod: string
  src_labels: Record<string, string>
  dst_ns: string
  dst_pod: string
  dst_labels: Record<string, string>
  port: number
  protocol: string
  verdict: 'allow' | 'deny'
  is_risky?: boolean
  is_unprotected?: boolean
  risk_score?: number
}

interface FlowsResponse {
  flows: Flow[]
}

export default function FlowVisualization() {
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstanceRef = useRef<Network | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [filterNamespace, setFilterNamespace] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')

  const buildNetwork = (flows: Flow[]) => {
    if (!networkRef.current) return

    // Filter flows based on selected filters
    let filteredFlows = flows
    if (filterNamespace !== 'all') {
      filteredFlows = filteredFlows.filter(
        f => f.src_ns === filterNamespace || f.dst_ns === filterNamespace
      )
    }
    if (filterRisk === 'risky') {
      filteredFlows = filteredFlows.filter(f => f.is_risky)
    } else if (filterRisk === 'unprotected') {
      filteredFlows = filteredFlows.filter(f => f.is_unprotected)
    }

    // Build nodes (pods) and edges (flows)
    const nodesMap = new Map<string, any>()
    const edges: any[] = []

    filteredFlows.forEach((flow, index) => {
      // Source node
      const srcId = `${flow.src_ns}/${flow.src_pod}`
      if (!nodesMap.has(srcId)) {
        const isRisky = flow.is_risky || false
        const nodeColor = getNodeColor(flow.src_labels, flow.src_ns, isRisky)
        nodesMap.set(srcId, {
          id: srcId,
          label: `${flow.src_pod}\n${flow.src_ns}`,
          title: `Namespace: ${flow.src_ns}\nPod: ${flow.src_pod}\nLabels: ${JSON.stringify(flow.src_labels, null, 2)}`,
          color: nodeColor,
          shape: 'box',
          font: { size: 14, color: '#333' },
          borderWidth: 2,
          borderColor: isRisky ? '#ef4444' : '#e5e7eb',
          metadata: {
            namespace: flow.src_ns,
            pod: flow.src_pod,
            labels: flow.src_labels,
            isRisky
          }
        })
      }

      // Destination node
      const dstId = `${flow.dst_ns}/${flow.dst_pod}`
      if (!nodesMap.has(dstId)) {
        const isRisky = flow.is_risky || false
        const nodeColor = getNodeColor(flow.dst_labels, flow.dst_ns, isRisky)
        nodesMap.set(dstId, {
          id: dstId,
          label: `${flow.dst_pod}\n${flow.dst_ns}`,
          title: `Namespace: ${flow.dst_ns}\nPod: ${flow.dst_pod}\nLabels: ${JSON.stringify(flow.dst_labels, null, 2)}`,
          color: nodeColor,
          shape: 'box',
          font: { size: 14, color: '#333' },
          borderWidth: 2,
          borderColor: isRisky ? '#ef4444' : '#e5e7eb',
          metadata: {
            namespace: flow.dst_ns,
            pod: flow.dst_pod,
            labels: flow.dst_labels,
            isRisky
          }
        })
      }

      // Edge (flow)
      const edgeId = `edge-${index}`
      const edgeColor = getEdgeColor(flow)
      const edgeWidth = flow.is_risky ? 3 : flow.is_unprotected ? 2 : 1
      
      edges.push({
        id: edgeId,
        from: srcId,
        to: dstId,
        label: `${flow.port}/${flow.protocol}`,
        color: {
          color: edgeColor,
          highlight: edgeColor,
          hover: edgeColor
        },
        width: edgeWidth,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1.2
          }
        },
        title: `From: ${flow.src_ns}/${flow.src_pod}\nTo: ${flow.dst_ns}/${flow.dst_pod}\nPort: ${flow.port}\nProtocol: ${flow.protocol}\nVerdict: ${flow.verdict}\n${flow.is_risky ? '⚠️ RISKY FLOW' : ''}\n${flow.is_unprotected ? '🔓 UNPROTECTED' : ''}`,
        metadata: flow
      })
    })

    const nodes = Array.from(nodesMap.values())

    // Network options (Illumio-like styling)
    const options = {
      nodes: {
        shape: 'box',
        font: {
          size: 14,
          face: 'Inter, system-ui, sans-serif'
        },
        margin: 10,
        widthConstraint: {
          maximum: 150
        },
        heightConstraint: {
          maximum: 80
        }
      },
      edges: {
        font: {
          size: 11,
          align: 'middle'
        },
        smooth: {
          type: 'continuous',
          roundness: 0.5
        },
        arrowStrikethrough: false
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 200
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.1,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: false
        }
      }
    }

    const data = { nodes, edges }

    // Destroy existing network if it exists
    if (networkInstanceRef.current) {
      networkInstanceRef.current.destroy()
    }

    // Create new network
    const network = new Network(networkRef.current, data, options)
    networkInstanceRef.current = network

    // Store node/edge data for access
    const nodeDataMap = new Map<string, any>()
    const edgeDataMap = new Map<string, any>()
    nodes.forEach((node: any) => {
      nodeDataMap.set(node.id, node.metadata)
    })
    edges.forEach((edge: any) => {
      edgeDataMap.set(edge.id, edge.metadata)
    })

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string
        setSelectedNode(nodeId)
        setSelectedEdge(null)
        setSelectedNodeDataState(nodeDataMap.get(nodeId) || null)
        setSelectedEdgeDataState(null)
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0] as string
        setSelectedEdge(edgeId)
        setSelectedNode(null)
        setSelectedEdgeDataState(edgeDataMap.get(edgeId) || null)
        setSelectedNodeDataState(null)
      } else {
        setSelectedNode(null)
        setSelectedEdge(null)
        setSelectedNodeDataState(null)
        setSelectedEdgeDataState(null)
      }
    })

    network.on('hoverNode', (params) => {
      if (networkRef.current) {
        networkRef.current.style.cursor = 'pointer'
      }
    })

    network.on('blurNode', () => {
      if (networkRef.current) {
        networkRef.current.style.cursor = 'default'
      }
    })
  }

  const getNodeColor = (labels: Record<string, string>, namespace: string, isRisky: boolean): any => {
    // Color by namespace and risk
    if (isRisky) {
      return {
        background: '#fee2e2',
        border: '#ef4444',
        highlight: {
          background: '#fecaca',
          border: '#dc2626'
        }
      }
    }

    // Color by namespace
    const namespaceColors: Record<string, string> = {
      'prod': '#dcfce7',      // green
      'non-prod': '#fef3c7',  // yellow
      'staging': '#dbeafe',   // blue
      'dev': '#e0e7ff'        // indigo
    }

    const bgColor = namespaceColors[namespace] || '#f3f4f6'
    return {
      background: bgColor,
      border: '#9ca3af',
      highlight: {
        background: bgColor,
        border: '#3b82f6'
      }
    }
  }

  const getEdgeColor = (flow: Flow): string => {
    if (flow.verdict === 'deny') {
      return '#ef4444' // red for denied
    }
    if (flow.is_risky) {
      return '#f59e0b' // orange for risky
    }
    if (flow.is_unprotected) {
      return '#eab308' // yellow for unprotected
    }
    return '#10b981' // green for safe
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<FlowsResponse>('/api/flows')
        buildNetwork(response.data.flows)
        setError(null)
      } catch (err) {
        setError('Failed to load flow data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Rebuild network when filters change
  useEffect(() => {
    if (!loading) {
      const fetchData = async () => {
        try {
          const response = await axios.get<FlowsResponse>('/api/flows')
          buildNetwork(response.data.flows)
        } catch (err) {
          console.error(err)
        }
      }
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNamespace, filterRisk])

  const [selectedNodeData, setSelectedNodeDataState] = useState<any>(null)
  const [selectedEdgeData, setSelectedEdgeDataState] = useState<any>(null)

  // Get unique namespaces for filter
  const [namespaces, setNamespaces] = useState<string[]>([])
  useEffect(() => {
    axios.get<FlowsResponse>('/api/flows').then(response => {
      const uniqueNamespaces = new Set<string>()
      response.data.flows.forEach(flow => {
        uniqueNamespaces.add(flow.src_ns)
        uniqueNamespaces.add(flow.dst_ns)
      })
      setNamespaces(Array.from(uniqueNamespaces).sort())
    })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading network visualization...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Namespace
            </label>
            <select
              value={filterNamespace}
              onChange={(e) => setFilterNamespace(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Risk
            </label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Flows</option>
              <option value="risky">Risky Only</option>
              <option value="unprotected">Unprotected Only</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Unprotected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Risky</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Denied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Graph */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div
          ref={networkRef}
          style={{ width: '100%', height: '600px', minHeight: '600px' }}
          className="bg-gray-50"
        />
      </div>

      {/* Details Panel */}
      {(selectedNodeData || selectedEdgeData) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedNodeData ? 'Node Details' : 'Flow Details'}
          </h3>
          {selectedNodeData && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pod:</span>{' '}
                <span className="text-gray-900">{selectedNodeData.pod}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Namespace:</span>{' '}
                <span className="text-gray-900">{selectedNodeData.namespace}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Labels:</span>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedNodeData.labels, null, 2)}
                </pre>
              </div>
              {selectedNodeData.isRisky && (
                <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                  ⚠️ Risky Node
                </div>
              )}
            </div>
          )}
          {selectedEdgeData && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Source:</span>{' '}
                <span className="text-gray-900">
                  {selectedEdgeData.src_ns}/{selectedEdgeData.src_pod}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Destination:</span>{' '}
                <span className="text-gray-900">
                  {selectedEdgeData.dst_ns}/{selectedEdgeData.dst_pod}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Port/Protocol:</span>{' '}
                <span className="text-gray-900">
                  {selectedEdgeData.port}/{selectedEdgeData.protocol}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Verdict:</span>{' '}
                <span className={`font-medium ${
                  selectedEdgeData.verdict === 'allow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedEdgeData.verdict.toUpperCase()}
                </span>
              </div>
              {selectedEdgeData.is_risky && (
                <div className="mt-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                  ⚠️ Risky Flow (Score: {selectedEdgeData.risk_score})
                </div>
              )}
              {selectedEdgeData.is_unprotected && (
                <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  🔓 Unprotected Flow
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

