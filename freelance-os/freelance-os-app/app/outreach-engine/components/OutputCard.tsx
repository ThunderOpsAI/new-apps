'use client'

import { useState } from 'react'

interface OutputCardProps {
  title: string
  content: string
  label?: string
}

export default function OutputCard({ title, content, label }: OutputCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel">
      <div className="stack">
        <h3 className="stack">{title}</h3>
        <button
          onClick={copyToClipboard}
          className="button button--secondary"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {label && <p className="stack">{label}</p>}
      <div className="stack">
        <textarea
          readOnly
          value={content}
          rows={Math.min(10, content.split('\n').length + 1)}
          className="panel"
        />
      </div>
    </div>
  )
}