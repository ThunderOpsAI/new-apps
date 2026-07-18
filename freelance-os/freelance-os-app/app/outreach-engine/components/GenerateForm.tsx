'use client'

import { useState } from 'react'
import type { GenerateRequest, Tone } from '@/types/outreach'

interface GenerateFormProps {
  onSubmit: (data: GenerateRequest) => Promise<void>
  loading: boolean
}

export default function GenerateForm({ onSubmit, loading }: GenerateFormProps) {
  const [formData, setFormData] = useState<GenerateRequest>({
    company_name: '',
    offer: '',
    company_url: '',
    target_name: '',
    role: '',
    tone: 'direct'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: GenerateRequest) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="panel">
      <div>
        <label className="stack">Company Name *</label>
        <input
          required
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          className="stack"
        />
      </div>

      <div>
        <label className="stack">Offer / Service *</label>
        <textarea
          required
          name="offer"
          value={formData.offer}
          onChange={handleChange}
          rows={3}
          className="stack"
        />
      </div>

      <div className="stack">
        <div>
          <label className="stack">Company URL (optional)</label>
          <input
            type="url"
            name="company_url"
            value={formData.company_url}
            onChange={handleChange}
            className="stack"
          />
        </div>

        <div>
          <label className="stack">Target Name (optional)</label>
          <input
            name="target_name"
            value={formData.target_name}
            onChange={handleChange}
            className="stack"
          />
        </div>
      </div>

      <div>
        <label className="stack">Role/Title (optional)</label>
        <input
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="stack"
        />
      </div>

      <div>
        <label className="stack">Tone</label>
        <div className="stack">
          {(['casual', 'formal', 'direct'] as Tone[]).map((t) => (
            <label key={t} className="stack">
              <input
                type="radio"
                name="tone"
                value={t}
                checked={formData.tone === t}
                onChange={handleChange}
                className="stack"
              />
              <span className="stack">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="button button--primary"
      >
        {loading ? 'Generating...' : 'Generate →'}
      </button>
    </form>
  )
}