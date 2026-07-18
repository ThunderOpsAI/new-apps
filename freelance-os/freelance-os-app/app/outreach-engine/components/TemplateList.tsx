'use client'

import { useEffect, useState } from 'react'
import { getTemplates, deleteTemplate } from '@/app/outreach-engine/lib/api'

interface Template {
  id: string
  name: string
  tone: string
  structure: any
}

interface TemplateListProps {
  onSelect: (template: Template) => void
}

export default function TemplateList({ onSelect }: TemplateListProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await deleteTemplate(id)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (err) {
      alert('Failed to delete template')
    }
  }

  if (loading) return <div className="stack">Loading templates...</div>

  return (
    <div className="stack">
      <h2 className="stack">Saved Templates</h2>
      {templates.length === 0 ? (
        <p className="stack">No templates saved yet.</p>
      ) : (
        <div className="stack">
          {templates.map((template) => (
            <div
              key={template.id}
              className="panel"
            >
              <div
                className="stack"
                onClick={() => onSelect(template)}
              >
                <p className="stack">{template.name}</p>
                <p className="stack">{template.tone}</p>
              </div>
              <button
                onClick={() => handleDelete(template.id)}
                className="stack"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}