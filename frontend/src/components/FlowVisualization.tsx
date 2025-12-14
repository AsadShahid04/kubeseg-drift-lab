import { useEffect, useRef, useState, useCallback } from "react";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.min.css";
import apiClient from "../api/client";
import LoadingToast from "./LoadingToast";

interface Flow {
  src_ns: string;
  src_pod: string;
  src_labels: Record<string, string>;
  dst_ns: string;
  dst_pod: string;
  dst_labels: Record<string, string>;
  port: number;
  protocol: string;
  verdict: "allow" | "deny";
  is_risky?: boolean;
  is_unprotected?: boolean;
  risk_score?: number;
}

interface FlowsResponse {
  flows: Flow[];
}

export default function FlowVisualization() {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_selectedNode, setSelectedNode] = useState<string | null>(null);
  const [_selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [filterNamespace, setFilterNamespace] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [layoutMode, setLayoutMode] = useState<"hierarchical" | "force">(
    "force"
  );
  const [showDetails, setShowDetails] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedNodeData, setSelectedNodeDataState] = useState<any>(null);
  const [selectedEdgeData, setSelectedEdgeDataState] = useState<any>(null);
  const [allFlows, setAllFlows] = useState<Flow[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Store data maps for quick access
  const nodeDataMapRef = useRef<Map<string, any>>(new Map());
  const edgeDataMapRef = useRef<Map<string, any>>(new Map());

  const getNodeColor = useCallback(
    (
      _labels: Record<string, string>,
      namespace: string,
      isRisky: boolean
    ): any => {
      // Illumio-style color scheme: more professional, subtle
      if (isRisky) {
        return {
          background: "#fff1f2",
          border: "#dc2626",
          highlight: {
            background: "#ffe4e6",
            border: "#b91c1c",
          },
        };
      }

      // Color by namespace (Illumio uses subtle, professional colors)
      const namespaceColors: Record<string, { bg: string; border: string }> = {
        prod: { bg: "#f0fdf4", border: "#16a34a" }, // green
        "non-prod": { bg: "#fffbeb", border: "#ca8a04" }, // amber
        staging: { bg: "#eff6ff", border: "#2563eb" }, // blue
        dev: { bg: "#f5f3ff", border: "#7c3aed" }, // purple
      };

      const colors = namespaceColors[namespace] || {
        bg: "#f9fafb",
        border: "#6b7280",
      };
      return {
        background: colors.bg,
        border: colors.border,
        highlight: {
          background: colors.bg,
          border: "#3b82f6",
        },
      };
    },
    []
  );

  // Edge color function (currently unused but kept for future use)
  // const getEdgeColor = useCallback((flow: Flow): string => {
  //   if (flow.verdict === "deny") return "#dc2626";
  //   if (flow.is_risky) return "#ea580c";
  //   if (flow.is_unprotected) return "#eab308";
  //   return "#22c55e";
  // }, []);

  const buildNetwork = useCallback(
    (flows: Flow[]) => {
      if (!networkRef.current) return;

      // Filter flows based on selected filters
      let filteredFlows = flows;
      if (filterNamespace !== "all") {
        filteredFlows = filteredFlows.filter(
          (f) => f.src_ns === filterNamespace || f.dst_ns === filterNamespace
        );
      }
      if (filterRisk === "risky") {
        filteredFlows = filteredFlows.filter((f) => f.is_risky);
      } else if (filterRisk === "unprotected") {
        filteredFlows = filteredFlows.filter((f) => f.is_unprotected);
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredFlows = filteredFlows.filter(
          (f) =>
            f.src_pod.toLowerCase().includes(searchLower) ||
            f.dst_pod.toLowerCase().includes(searchLower) ||
            f.src_ns.toLowerCase().includes(searchLower) ||
            f.dst_ns.toLowerCase().includes(searchLower)
        );
      }

      // Build nodes (pods) - Illumio groups by namespace/workload
      const nodesMap = new Map<string, any>();
      const edges: any[] = [];

      // Group flows by source-destination pairs to aggregate
      const flowGroups = new Map<string, Flow[]>();
      filteredFlows.forEach((flow) => {
        const key = `${flow.src_ns}/${flow.src_pod}→${flow.dst_ns}/${flow.dst_pod}`;
        if (!flowGroups.has(key)) {
          flowGroups.set(key, []);
        }
        flowGroups.get(key)!.push(flow);
      });

      // Create nodes
      filteredFlows.forEach((flow) => {
        // Source node
        const srcId = `${flow.src_ns}/${flow.src_pod}`;
        if (!nodesMap.has(srcId)) {
          const isRisky = flow.is_risky || false;
          const nodeColor = getNodeColor(flow.src_labels, flow.src_ns, isRisky);
          const appLabel = flow.src_labels.app || "unknown";

          nodesMap.set(srcId, {
            id: srcId,
            label: `${flow.src_pod}\n[${appLabel}]`,
            title: `Workload: ${flow.src_pod}\nNamespace: ${
              flow.src_ns
            }\nApp: ${appLabel}\nLabels: ${JSON.stringify(
              flow.src_labels,
              null,
              2
            )}`,
            color: nodeColor,
            shape: "box",
            font: {
              size: 13,
              color: "#1f2937",
              face: "Inter, -apple-system, sans-serif",
              bold: { size: 13 },
            },
            margin: 12,
            borderWidth: isRisky ? 3 : 2,
            borderColor: isRisky ? "#dc2626" : nodeColor.border,
            widthConstraint: { maximum: 180 },
            heightConstraint: { maximum: 70 },
            metadata: {
              namespace: flow.src_ns,
              pod: flow.src_pod,
              labels: flow.src_labels,
              app: appLabel,
              isRisky,
            },
            // Group by namespace for hierarchical layout
            group: flow.src_ns,
          });
        }

        // Destination node
        const dstId = `${flow.dst_ns}/${flow.dst_pod}`;
        if (!nodesMap.has(dstId)) {
          const isRisky = flow.is_risky || false;
          const nodeColor = getNodeColor(flow.dst_labels, flow.dst_ns, isRisky);
          const appLabel =
            flow.dst_labels.app || flow.dst_labels.role || "unknown";

          nodesMap.set(dstId, {
            id: dstId,
            label: `${flow.dst_pod}\n[${appLabel}]`,
            title: `Workload: ${flow.dst_pod}\nNamespace: ${
              flow.dst_ns
            }\nApp: ${appLabel}\nLabels: ${JSON.stringify(
              flow.dst_labels,
              null,
              2
            )}`,
            color: nodeColor,
            shape: "box",
            font: {
              size: 13,
              color: "#1f2937",
              face: "Inter, -apple-system, sans-serif",
            },
            margin: 12,
            borderWidth: isRisky ? 3 : 2,
            borderColor: isRisky ? "#dc2626" : nodeColor.border,
            widthConstraint: { maximum: 180 },
            heightConstraint: { maximum: 70 },
            metadata: {
              namespace: flow.dst_ns,
              pod: flow.dst_pod,
              labels: flow.dst_labels,
              app: appLabel,
              isRisky,
            },
            group: flow.dst_ns,
          });
        }
      });

      // Create edges - aggregate multiple flows between same pods
      flowGroups.forEach((flowGroup, key) => {
        const firstFlow = flowGroup[0];
        const srcId = `${firstFlow.src_ns}/${firstFlow.src_pod}`;
        const dstId = `${firstFlow.dst_ns}/${firstFlow.dst_pod}`;

        // Determine edge properties from the most severe flow
        const hasRisky = flowGroup.some((f) => f.is_risky);
        const hasUnprotected = flowGroup.some((f) => f.is_unprotected);
        const hasDeny = flowGroup.some((f) => f.verdict === "deny");

        const edgeColor = hasDeny
          ? "#dc2626"
          : hasRisky
          ? "#ea580c"
          : hasUnprotected
          ? "#eab308"
          : "#22c55e";

        const edgeWidth = hasRisky ? 3.5 : hasUnprotected ? 2.5 : 1.5;

        // Aggregate ports
        const ports = [
          ...new Set(flowGroup.map((f) => `${f.port}/${f.protocol}`)),
        ].join(", ");
        const portCount = flowGroup.length > 1 ? ` (${flowGroup.length})` : "";

        edges.push({
          id: key,
          from: srcId,
          to: dstId,
          label: ports + portCount,
          color: {
            color: edgeColor,
            highlight: edgeColor,
            hover: edgeColor,
            opacity: 0.8,
          },
          width: edgeWidth,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1.3,
              type: "arrow",
            },
          },
          smooth: {
            type: "continuous",
            roundness: 0.4,
          },
          font: {
            size: 10,
            color: "#374151",
            align: "middle",
            strokeWidth: 2,
            strokeColor: "#ffffff",
          },
          title: `From: ${firstFlow.src_ns}/${firstFlow.src_pod}\nTo: ${
            firstFlow.dst_ns
          }/${firstFlow.dst_pod}\nPorts: ${ports}\nFlows: ${
            flowGroup.length
          }\n${hasRisky ? "⚠️ RISKY" : ""}${
            hasUnprotected ? "\n🔓 UNPROTECTED" : ""
          }`,
          metadata: {
            flows: flowGroup,
            is_risky: hasRisky,
            is_unprotected: hasUnprotected,
            flow_count: flowGroup.length,
          },
        });
      });

      const nodes = Array.from(nodesMap.values());

      // Store data maps
      nodeDataMapRef.current.clear();
      edgeDataMapRef.current.clear();
      nodes.forEach((node: any) => {
        nodeDataMapRef.current.set(node.id, node.metadata);
      });
      edges.forEach((edge: any) => {
        edgeDataMapRef.current.set(edge.id, edge.metadata);
      });

      // Illumio-style network options
      const options: any = {
        nodes: {
          shape: "box",
          font: {
            size: 13,
            face: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            color: "#1f2937",
          },
          margin: 12,
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.1)",
            size: 5,
            x: 2,
            y: 2,
          },
        },
        edges: {
          font: {
            size: 10,
            align: "middle",
            color: "#374151",
          },
          smooth: {
            type: "continuous",
            roundness: 0.4,
          },
          arrowStrikethrough: false,
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.1)",
            size: 3,
          },
        },
        physics:
          layoutMode === "hierarchical"
            ? {
                enabled: false,
              }
            : {
                enabled: true,
                stabilization: {
                  enabled: true,
                  iterations: 250,
                  fit: true,
                },
                barnesHut: {
                  gravitationalConstant: -3000,
                  centralGravity: 0.15,
                  springLength: 250,
                  springConstant: 0.05,
                  damping: 0.12,
                  avoidOverlap: 0.8,
                },
              },
        interaction: {
          hover: true,
          tooltipDelay: 150,
          zoomView: true,
          dragView: true,
          selectConnectedEdges: true,
          navigationButtons: true,
        },
        layout:
          layoutMode === "hierarchical"
            ? {
                hierarchical: {
                  enabled: true,
                  direction: "LR", // Left to Right
                  sortMethod: "directed",
                  levelSeparation: 200,
                  nodeSpacing: 150,
                  treeSpacing: 200,
                  blockShifting: true,
                  edgeMinimization: true,
                  parentCentralization: true,
                },
              }
            : {
                improvedLayout: true,
                randomSeed: 2,
              },
        groups: {
          // Define group styles for namespaces
          prod: {
            color: { background: "#f0fdf4", border: "#16a34a" },
            font: { color: "#166534" },
          },
          "non-prod": {
            color: { background: "#fffbeb", border: "#ca8a04" },
            font: { color: "#854d0e" },
          },
          staging: {
            color: { background: "#eff6ff", border: "#2563eb" },
            font: { color: "#1e40af" },
          },
          dev: {
            color: { background: "#f5f3ff", border: "#7c3aed" },
            font: { color: "#6b21a8" },
          },
        },
      };

      const data = { nodes, edges };

      // Destroy existing network if it exists
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      // Create new network
      const network = new Network(networkRef.current, data, options);
      networkInstanceRef.current = network;

      // Event handlers
      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0] as string;
          setSelectedNode(nodeId);
          setSelectedEdge(null);
          setSelectedNodeDataState(nodeDataMapRef.current.get(nodeId) || null);
          setSelectedEdgeDataState(null);
          // Highlight connected nodes
          network.selectNodes([nodeId]);
          const connectedEdges = network.getConnectedEdges(nodeId) as string[];
          network.selectEdges(connectedEdges);
        } else if (params.edges.length > 0) {
          const edgeId = params.edges[0] as string;
          setSelectedEdge(edgeId);
          setSelectedNode(null);
          setSelectedEdgeDataState(edgeDataMapRef.current.get(edgeId) || null);
          setSelectedNodeDataState(null);
          // Highlight connected nodes
          const edge = edges.find((e) => e.id === edgeId);
          if (edge) {
            network.selectNodes([edge.from, edge.to]);
            network.selectEdges([edgeId]);
          }
        } else {
          setSelectedNode(null);
          setSelectedEdge(null);
          setSelectedNodeDataState(null);
          setSelectedEdgeDataState(null);
          network.unselectAll();
        }
      });

      network.on("hoverNode", () => {
        if (networkRef.current) {
          networkRef.current.style.cursor = "pointer";
        }
      });

      network.on("blurNode", () => {
        if (networkRef.current) {
          networkRef.current.style.cursor = "default";
        }
      });

      // Fit network to view
      network.fit({
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad",
        },
      });
    },
    [filterNamespace, filterRisk, searchTerm, layoutMode, getNodeColor]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<FlowsResponse>("/api/flows");
        setAllFlows(response.data.flows);

        // Extract unique namespaces
        const uniqueNamespaces = new Set<string>();
        response.data.flows.forEach((flow) => {
          uniqueNamespaces.add(flow.src_ns);
          uniqueNamespaces.add(flow.dst_ns);
        });
        setNamespaces(Array.from(uniqueNamespaces).sort());

        setError(null);
      } catch (err) {
        setError("Failed to load flow data");
        console.error(err);
      } finally {
        setLoading(false);
        setShowToast(false);
      }
    };

    fetchData();

    // Show toast after 3 seconds to explain potential delay
    const toastTimer = setTimeout(() => {
      setShowToast(true);
    }, 3000);

    return () => {
      clearTimeout(toastTimer);
    };
  }, []);

  // Rebuild network when filters or data change
  useEffect(() => {
    if (!loading && allFlows.length > 0) {
      buildNetwork(allFlows);
    }
  }, [allFlows, loading, buildNetwork]);

  // Handle fullscreen resize
  useEffect(() => {
    if (networkInstanceRef.current && !loading) {
      setTimeout(() => {
        networkInstanceRef.current?.fit({
          animation: {
            duration: 300,
            easingFunction: "easeInOutQuad",
          },
        });
      }, 100);
    }
  }, [isFullscreen, loading]);

  // Statistics
  const stats = {
    totalPods: new Set([
      ...allFlows.map((f) => `${f.src_ns}/${f.src_pod}`),
      ...allFlows.map((f) => `${f.dst_ns}/${f.dst_pod}`),
    ]).size,
    totalFlows: allFlows.length,
    riskyFlows: allFlows.filter((f) => f.is_risky).length,
    unprotectedFlows: allFlows.filter((f) => f.is_unprotected).length,
    namespaces: namespaces.length,
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading network visualization...</div>
        </div>
        <LoadingToast show={showToast} onClose={() => setShowToast(false)} />
      </>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-4 ${
        isFullscreen ? "fixed inset-0 z-40 bg-white" : ""
      }`}
      style={{ minHeight: isFullscreen ? "100vh" : "700px" }}
    >
      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Top Controls Bar - Illumio Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Workloads
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by pod or namespace..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
              />
            </div>

            {/* Namespace Filter */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namespace
              </label>
              <select
                value={filterNamespace}
                onChange={(e) => setFilterNamespace(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Namespaces</option>
                {namespaces.map((ns) => (
                  <option key={ns} value={ns}>
                    {ns}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Level
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

            {/* Layout Mode */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layout
              </label>
              <select
                value={layoutMode}
                onChange={(e) =>
                  setLayoutMode(e.target.value as "hierarchical" | "force")
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="force">Force-Directed</option>
                <option value="hierarchical">Hierarchical</option>
              </select>
            </div>

            {/* Fullscreen Toggle */}
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
            </div>

            {/* Statistics */}
            <div className="flex gap-4 text-xs text-gray-600">
              <div>
                <span className="font-semibold text-gray-900">
                  {stats.totalPods}
                </span>{" "}
                Workloads
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  {stats.totalFlows}
                </span>{" "}
                Flows
              </div>
              {stats.riskyFlows > 0 && (
                <div className="text-orange-600">
                  <span className="font-semibold">{stats.riskyFlows}</span>{" "}
                  Risky
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
            <div className="font-medium text-gray-700">Legend:</div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-green-600 bg-green-50"></div>
              <span>Safe Flow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-yellow-500 bg-yellow-50"></div>
              <span>Unprotected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-orange-600 bg-orange-50"></div>
              <span>Risky Flow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-red-600 bg-red-50"></div>
              <span>Denied</span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-4 h-4 rounded border-2 border-green-600 bg-green-50"></div>
              <span>Prod Namespace</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-50"></div>
              <span>Non-Prod</span>
            </div>
          </div>
        </div>

        {/* Network Graph */}
        <div
          className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative ${
            isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
          }`}
          style={{ height: isFullscreen ? "100vh" : "600px" }}
        >
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 shadow-lg font-medium"
              >
                Exit Fullscreen
              </button>
            </div>
          )}
          <div
            ref={networkRef}
            style={{ width: "100%", height: "100%" }}
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Right Side Panel - Illumio Style Details */}
      {showDetails && !isFullscreen && (
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            {selectedNodeData ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Workload Information
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Workload Name</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedNodeData.pod}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Namespace</div>
                      <div className="text-sm text-gray-900">
                        {selectedNodeData.namespace}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Application</div>
                      <div className="text-sm text-gray-900">
                        {selectedNodeData.app || "N/A"}
                      </div>
                    </div>
                    {selectedNodeData.isRisky && (
                      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                        ⚠️ This workload is involved in risky flows
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Labels
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-xs font-mono">
                    {Object.entries(selectedNodeData.labels || {}).map(
                      ([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="text-gray-600">{key}:</span>{" "}
                          <span className="text-gray-900">{String(value)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : selectedEdgeData ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Flow Information
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Source</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedEdgeData.flows[0].src_pod}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedEdgeData.flows[0].src_ns}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-2">→</div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Destination</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedEdgeData.flows[0].dst_pod}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedEdgeData.flows[0].dst_ns}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Connection Details
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ports/Protocols:</span>
                      <span className="font-mono text-gray-900">
                        {[
                          ...new Set(
                            selectedEdgeData.flows.map(
                              (f: Flow) => `${f.port}/${f.protocol}`
                            )
                          ),
                        ].join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flow Count:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedEdgeData.flow_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-semibold ${
                          selectedEdgeData.flows[0].verdict === "allow"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedEdgeData.flows[0].verdict.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEdgeData.is_risky && (
                  <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-xs font-medium text-orange-800 mb-1">
                      ⚠️ Risky Flow
                    </div>
                    <div className="text-xs text-orange-700">
                      Cross-namespace traffic to sensitive resources detected
                    </div>
                  </div>
                )}

                {selectedEdgeData.is_unprotected && (
                  <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs font-medium text-yellow-800 mb-1">
                      🔓 Unprotected Flow
                    </div>
                    <div className="text-xs text-yellow-700">
                      No NetworkPolicy protects this communication
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    All Flows
                  </div>
                  <div className="space-y-1">
                    {selectedEdgeData.flows.map((flow: Flow, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="font-mono">
                          {flow.port}/{flow.protocol} - {flow.verdict}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <div className="mb-2">👆</div>
                <div>Click on a workload or flow</div>
                <div className="text-xs mt-1">to view details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Details Button when hidden */}
      {!showDetails && !isFullscreen && (
        <button
          onClick={() => setShowDetails(true)}
          className="fixed right-4 top-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition z-10"
        >
          Show Details
        </button>
      )}

      {/* Fullscreen Controls Overlay */}
      {isFullscreen && (
        <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Exit Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
