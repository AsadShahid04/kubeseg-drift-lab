import { useEffect, useState } from 'react'
import axios from 'axios'
import YamlBlock from './YamlBlock'

interface Flow {
  src_ns: string
  src_pod: string
  dst_ns: string
  dst_pod: string
  port: number
  protocol: string
  verdict: string
}

interface RiskyFlow {
  flow: Flow
  risk_score: number
  reason: string
}

interface GapFlow {
  flow: Flow
  reason: string
}

interface SuggestedPolicy {
  namespace: string
  target_labels: Record<string, string>
  yaml: string
}

interface GapsResponse {
  risky_flows: RiskyFlow[]
  unprotected_flows: GapFlow[]
  suggested_policies: SuggestedPolicy[]
}

export default function GapsView() {
  const [data, setData] = useState<GapsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<GapsResponse>('/api/gaps')
        setData(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load gap analysis data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading...</div>
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

  if (!data) {
    return null
  }

  const getRiskColor = (score: number) => {
    if (score >= 10) return 'bg-red-100 text-red-800 border-red-300'
    if (score >= 7) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  return (
    <div className="space-y-8">
      {/* Risky Flows */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Risky Flows</h2>
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
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.risky_flows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{item.flow.src_ns}/{item.flow.src_pod}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="font-medium">{item.flow.dst_ns}/{item.flow.dst_pod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.flow.port}/{item.flow.protocol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRiskColor(item.risk_score)}`}>
                        {item.risk_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.reason}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Unprotected Flows</h2>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.unprotected_flows.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <span className="font-medium">{item.flow.src_ns}/{item.flow.src_pod}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="font-medium">{item.flow.dst_ns}/{item.flow.dst_pod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.flow.port}/{item.flow.protocol}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Suggested Policies */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Policies</h2>
        {data.suggested_policies.length === 0 ? (
          <p className="text-gray-600">No policy suggestions.</p>
        ) : (
          <div className="space-y-4">
            {data.suggested_policies.map((policy, idx) => (
              <YamlBlock
                key={idx}
                yaml={policy.yaml}
                title={`Policy for ${policy.namespace} namespace (target: ${Object.entries(policy.target_labels).map(([k, v]) => `${k}=${v}`).join(', ')})`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

