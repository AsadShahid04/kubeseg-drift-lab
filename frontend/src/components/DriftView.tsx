import { useEffect, useState } from "react";
import apiClient from "../api/client";

interface NamespaceBrief {
  namespace: string;
  summary: any;
  brief: string;
}

interface DriftItem {
  type: "missing_policy" | "over_permissive";
  intent_id?: string;
  policy_name?: string;
  namespace: string;
  description: string;
  suggested_action: string;
}

interface NamespaceSummary {
  namespace: string;
  intent_count: number;
  aligned_count: number;
  drift_count: number;
}

interface DriftResponse {
  missing_policies: DriftItem[];
  over_permissive: DriftItem[];
  per_namespace_summary: NamespaceSummary[];
}

export default function DriftView() {
  const [data, setData] = useState<DriftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<NamespaceBrief | null>(
    null
  );
  const [loadingBrief, setLoadingBrief] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<DriftResponse>("/api/drift");
        setData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load drift detection data");
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

  return (
    <div className="space-y-8">
      {/* Namespace Summary Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Per-Namespace Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.per_namespace_summary.map((summary, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {summary.namespace}
                </h3>
                <button
                  onClick={async () => {
                    setLoadingBrief(summary.namespace);
                    try {
                      const response = await apiClient.post<NamespaceBrief>(
                        "/api/namespace-brief",
                        {
                          namespace: summary.namespace,
                        }
                      );
                      setSelectedBrief(response.data);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingBrief(null);
                    }
                  }}
                  disabled={loadingBrief === summary.namespace}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingBrief === summary.namespace ? "..." : "AI Brief"}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Intent Rules:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.intent_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Aligned Policies:
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {summary.aligned_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Drift Items:</span>
                  <span
                    className={`text-sm font-medium ${
                      summary.drift_count > 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {summary.drift_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Missing Policies */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Missing Policies
        </h2>
        {data.missing_policies.length === 0 ? (
          <p className="text-gray-600">No missing policies detected.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intent ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Namespace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.missing_policies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.intent_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.namespace}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {item.suggested_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Over-Permissive Policies */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Over-Permissive Policies
        </h2>
        {data.over_permissive.length === 0 ? (
          <p className="text-gray-600">No over-permissive policies detected.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Policy Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Namespace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggested Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.over_permissive.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.policy_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.namespace}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {item.suggested_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Namespace Brief Drawer */}
      {selectedBrief && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Brief: {selectedBrief.namespace}
            </h3>
            <button
              onClick={() => setSelectedBrief(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  SOC-Style Brief
                </div>
                <div className="text-sm text-blue-800 whitespace-pre-wrap">
                  {selectedBrief.brief}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Services:</span>
                    <span className="font-semibold">
                      {selectedBrief.summary.service_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policies:</span>
                    <span className="font-semibold">
                      {selectedBrief.summary.policy_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risky Flows:</span>
                    <span className="font-semibold text-orange-600">
                      {selectedBrief.summary.risky_flows_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unprotected:</span>
                    <span className="font-semibold text-yellow-600">
                      {selectedBrief.summary.unprotected_flows_count}
                    </span>
                  </div>
                </div>
              </div>

              {selectedBrief.summary.top_risky_flows &&
                selectedBrief.summary.top_risky_flows.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Top Risky Flows
                    </div>
                    <div className="space-y-1">
                      {selectedBrief.summary.top_risky_flows.map(
                        (flow: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs bg-red-50 p-2 rounded"
                          >
                            <div className="font-mono">
                              {flow.src} → {flow.dst}
                            </div>
                            <div className="text-red-600">
                              Risk: {flow.risk_score}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
