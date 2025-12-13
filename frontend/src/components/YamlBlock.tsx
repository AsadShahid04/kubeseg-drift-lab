import { useState } from 'react'

interface YamlBlockProps {
  yaml: string
  title?: string
}

export default function YamlBlock({ yaml, title }: YamlBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm bg-gray-900 text-gray-100 font-mono">
          <code>{yaml}</code>
        </pre>
        {!title && (
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

