import { useState } from 'react'
import axios from 'axios'

interface NLIntentResponse {
  intent?: {
    src_selector: {
      namespace: string | null
      labels: Record<string, string>
    }
    dst_selector: {
      namespace: string | null
      labels: Record<string, string>
    }
    allowed_ports: Array<{ port: number; protocol: string }>
    description: string
  }
  policy_yaml?: string
  explanation?: string
  confidence?: number
  policy_name?: string
  namespace?: string
  error?: string
}

export default function PolicySandbox() {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NLIntentResponse | null>(null)
  const [useGPT4, setUseGPT4] = useState(false)
  const [copied, setCopied] = useState(false)

  const exampleQueries = [
    "Allow frontend pods in prod namespace to access payments service on port 443 only",
    "Only pods with label app=api can talk to database pods with label role=db on port 5432",
    "Block all traffic to pods with label env=prod except from monitoring namespace",
    "Allow web-frontend to access api-gateway on HTTPS (443) in production namespace"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    setResult(null)
    setCopied(false)

    try {
      const response = await axios.post<NLIntentResponse>('/api/nl-intent', {
        description: description.trim(),
        use_gpt4: useGPT4
      })

      setResult(response.data)
    } catch (error: any) {
      setResult({
        error: error.response?.data?.error || error.message || 'Failed to process request'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const useExample = (example: string) => {
    setDescription(example)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Policy Sandbox</h2>
        <p className="mt-2 text-sm text-gray-600">
          Describe your network policy in plain English and see the generated Kubernetes NetworkPolicy.
          This is a safe sandbox - no policies are applied to your cluster.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Policy Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Allow frontend pods in prod namespace to access payments service on port 443 only"
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Describe what traffic should be allowed. Be specific about source pods, destination pods, and ports.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useGPT4}
                onChange={(e) => setUseGPT4(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">
                Use GPT-4 (more accurate, higher cost)
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Policy'}
            </button>
          </div>
        </form>

        {/* Example Queries */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Example Queries:</p>
          <div className="space-y-2">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => useExample(example)}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                disabled={loading}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Error State */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">Error</h3>
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}

          {/* Success State */}
          {!result.error && result.intent && (
            <>
              {/* Explanation */}
              {result.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Explanation</h3>
                  <p className="text-sm text-blue-700">{result.explanation}</p>
                  {result.confidence && (
                    <p className="mt-2 text-xs text-blue-600">
                      Confidence: {(result.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}

              {/* Three Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Natural Language Input */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Your Input</h3>
                  <p className="text-sm text-gray-600 italic">"{description}"</p>
                </div>

                {/* Parsed Intent */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Parsed Intent</h3>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.intent, null, 2))}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64">
                    {JSON.stringify(result.intent, null, 2)}
                  </pre>
                </div>

                {/* Generated Policy */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">NetworkPolicy YAML</h3>
                    <button
                      onClick={() => copyToClipboard(result.policy_yaml || '')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copied ? 'Copied!' : 'Copy YAML'}
                    </button>
                  </div>
                  <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64">
                    <pre className="whitespace-pre-wrap font-mono">{result.policy_yaml}</pre>
                  </div>
                  {result.policy_name && result.namespace && (
                    <p className="mt-2 text-xs text-gray-500">
                      Policy: <span className="font-mono">{result.policy_name}</span> in namespace{' '}
                      <span className="font-mono">{result.namespace}</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">ℹ️ About This Sandbox</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>This is a safe testing environment - no policies are applied to your cluster</li>
          <li>Generated policies follow Kubernetes NetworkPolicy best practices</li>
          <li>Use GPT-3.5-turbo for faster, cheaper results (default)</li>
          <li>Use GPT-4 for more complex queries and better accuracy</li>
          <li>Review the generated policy before applying to production</li>
        </ul>
      </div>
    </div>
  )
}

