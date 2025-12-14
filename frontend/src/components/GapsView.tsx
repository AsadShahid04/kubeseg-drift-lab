import { useEffect, useState } from "react";
import apiClient from "../api/client";
import YamlBlock from "./YamlBlock";

interface PRSnippet {
  file_path: string;
  diff: string;
  commit_message: string;
  description: string;
}

interface BundledFixes {
  yaml_content: string;
  commit_message: string;
  description: string;
  policies_count: number;
}

interface Flow {
  src_ns: string;
  src_pod: string;
  src_labels: Record<string, string>;
  dst_ns: string;
  dst_pod: string;
  dst_labels: Record<string, string>;
  port: number;
  protocol: string;
  verdict: string;
}

interface RiskyFlow {
  flow: Flow;
  risk_score: number;
  reason: string;
  risk_level?: string;
  summary?: string;
}

interface GapFlow {
  flow: Flow;
  reason: string;
}

interface SuggestedPolicy {
  namespace: string;
  target_labels: Record<string, string>;
  yaml: string;
}

interface GapsResponse {
  risky_flows: RiskyFlow[];
  unprotected_flows: GapFlow[];
  suggested_policies: SuggestedPolicy[];
}

export default function GapsView() {
  const [data, setData] = useState<GapsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prSnippets, setPrSnippets] = useState<Map<number, PRSnippet>>(
    new Map()
  );
  const [bundledFixes, setBundledFixes] = useState<BundledFixes | null>(null);
  const [loadingSnippet, setLoadingSnippet] = useState<number | null>(null);
  const [expandedPolicies, setExpandedPolicies] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<GapsResponse>("/api/gaps");
        setData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load gap analysis data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getRiskColor = (score: number, level?: string) => {
    if (level === "critical" || score >= 80) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    if (level === "high" || score >= 60) {
      return "bg-orange-100 text-orange-800 border-orange-300";
    }
    if (level === "medium" || score >= 40) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getRiskLevelBadge = (level?: string, score?: number) => {
    const effectiveLevel =
      level ||
      (score !== undefined && score >= 80
        ? "critical"
        : score !== undefined && score >= 60
        ? "high"
        : score !== undefined && score >= 40
        ? "medium"
        : "low");
    const colors = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-yellow-600 text-white",
      low: "bg-blue-600 text-white",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded ${
          colors[effectiveLevel as keyof typeof colors] || colors.medium
        }`}
      >
        {effectiveLevel.toUpperCase()}
      </span>
    );
  };

  const togglePolicy = (idx: number) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedPolicies(newExpanded);
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Risky Flows
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.risky_flows.length}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {
              data.risky_flows.filter(
                (f) => f.risk_level === "critical" || f.risk_score >= 80
              ).length
            }{" "}
            critical
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Unprotected Flows
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {data.unprotected_flows.length}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Require policy protection
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Suggested Policies
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {data.suggested_policies.length}
          </div>
          <div className="text-xs text-gray-500 mt-2">Ready to implement</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Avg Risk Score
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.risky_flows.length > 0
              ? Math.round(
                  data.risky_flows.reduce((sum, f) => sum + f.risk_score, 0) /
                    data.risky_flows.length
                )
              : 0}
          </div>
          <div className="text-xs text-gray-500 mt-2">Out of 100</div>
        </div>
      </div>

      {/* Risky Flows */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Risky Flows
        </h2>
        {data.risky_flows.length === 0 ? (
          <p className="text-gray-600">No risky flows detected.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source → Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Port/Protocol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.risky_flows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <span className="font-medium">
                          {item.flow.src_ns}/{item.flow.src_pod}
                        </span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="font-medium">
                          {item.flow.dst_ns}/{item.flow.dst_pod}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.flow.port}/{item.flow.protocol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskLevelBadge(item.risk_level, item.risk_score)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded border ${getRiskColor(
                            item.risk_score,
                            item.risk_level
                          )}`}
                        >
                          {item.risk_score}/100
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.risk_score >= 80
                                ? "bg-red-600"
                                : item.risk_score >= 60
                                ? "bg-orange-600"
                                : item.risk_score >= 40
                                ? "bg-yellow-600"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${item.risk_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-md">
                        {item.summary || item.reason}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Factors: {item.reason}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unprotected Flows */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Unprotected Flows
        </h2>
        {data.unprotected_flows.length === 0 ? (
          <p className="text-gray-600">No unprotected flows detected.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source → Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Port/Protocol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Policy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.unprotected_flows.map((item, idx) => {
                  // Find corresponding suggested policy
                  const suggestedPolicy = data.suggested_policies.find(
                    (p) =>
                      p.namespace === item.flow.dst_ns &&
                      Object.keys(p.target_labels).every(
                        (k) => item.flow.dst_labels[k] === p.target_labels[k]
                      )
                  );
                  const policyIndex = suggestedPolicy
                    ? data.suggested_policies.indexOf(suggestedPolicy)
                    : -1;

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <span className="font-medium">
                            {item.flow.src_ns}/{item.flow.src_pod}
                          </span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="font-medium">
                            {item.flow.dst_ns}/{item.flow.dst_pod}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.flow.port}/{item.flow.protocol}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.reason}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {policyIndex >= 0 ? (
                          <button
                            onClick={() => togglePolicy(policyIndex)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                          >
                            {expandedPolicies.has(policyIndex)
                              ? "Hide Policy"
                              : "View Policy"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No policy available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Suggested Policies - Embedded */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Suggested Policies
          </h2>
          {data.suggested_policies.length > 0 && (
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get<BundledFixes>(
                    "/api/bundled-fixes",
                    { params: { top_n: 3 } }
                  );
                  setBundledFixes(response.data);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Bundle Top 3 Fixes
            </button>
          )}
        </div>
        {data.suggested_policies.length === 0 ? (
          <p className="text-gray-600">No policy suggestions.</p>
        ) : (
          <div className="space-y-4">
            {data.suggested_policies.map((policy, idx) => {
              const snippet = prSnippets.get(idx);
              const isExpanded = expandedPolicies.has(idx);

              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Policy for {policy.namespace} namespace
                      </h3>
                      <p className="text-xs text-gray-600">
                        Target:{" "}
                        {Object.entries(policy.target_labels)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          if (snippet) {
                            setPrSnippets(
                              new Map(prSnippets.set(idx, snippet))
                            );
                            return;
                          }
                          setLoadingSnippet(idx);
                          try {
                            const response = await apiClient.get<PRSnippet>(
                              `/api/pr-snippets/${idx}`
                            );
                            setPrSnippets(
                              new Map(prSnippets.set(idx, response.data))
                            );
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setLoadingSnippet(null);
                          }
                        }}
                        disabled={loadingSnippet === idx}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 font-medium"
                      >
                        {loadingSnippet === idx
                          ? "Loading..."
                          : snippet
                          ? "Hide PR"
                          : "Show PR"}
                      </button>
                      <button
                        onClick={() => togglePolicy(idx)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        {isExpanded ? "Hide Policy" : "View Policy"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {snippet && (
                        <div className="mb-4 space-y-2">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Commit Message:
                            </div>
                            <div className="text-xs font-mono text-gray-900 whitespace-pre-wrap">
                              {snippet.commit_message}
                            </div>
                          </div>
                          <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                            <pre>{snippet.diff}</pre>
                          </div>
                        </div>
                      )}

                      <YamlBlock
                        yaml={policy.yaml}
                        title="NetworkPolicy YAML"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bundled Fixes Modal */}
      {bundledFixes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Bundled Fixes (Top {bundledFixes.policies_count})
              </h3>
              <button
                onClick={() => setBundledFixes(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Commit Message:
                </div>
                <div className="text-sm font-mono text-gray-900 whitespace-pre-wrap">
                  {bundledFixes.commit_message}
                </div>
              </div>
              <YamlBlock
                yaml={bundledFixes.yaml_content}
                title="Bundled YAML"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
