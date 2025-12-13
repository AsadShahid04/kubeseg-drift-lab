import { useEffect, useState } from 'react'
import axios from 'axios'

interface DriftItem {
  type: 'missing_policy' | 'over_permissive'
  intent_id?: string
  policy_name?: string
  namespace: string
  description: string
  suggested_action: string
}

interface NamespaceSummary {
  namespace: string
  intent_count: number
  aligned_count: number
  drift_count: number
}

interface DriftResponse {
  missing_policies: DriftItem[]
  over_permissive: DriftItem[]
  per_namespace_summary: NamespaceSummary[]
}

export default function DriftView() {
  const [data, setData] = useState<DriftResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<DriftResponse>('/api/drift')
        setData(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load drift detection data')
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

  return (
    <div className="space-y-8">
      {/* Namespace Summary Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Per-Namespace Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.per_namespace_summary.map((summary, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{summary.namespace}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Intent Rules:</span>
                  <span className="text-sm font-medium text-gray-900">{summary.intent_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aligned Policies:</span>
                  <span className="text-sm font-medium text-green-600">{summary.aligned_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Drift Items:</span>
                  <span className={`text-sm font-medium ${summary.drift_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Missing Policies</h2>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Over-Permissive Policies</h2>
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
    </div>
  )
}

