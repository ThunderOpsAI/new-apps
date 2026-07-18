'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/app/outreach-engine/lib/supabase'
import { generateOutreach, saveTemplate } from '@/app/outreach-engine/lib/api'
import type { GenerateResponse, GenerateRequest, Template } from '@/types/outreach'
import GenerateForm from '@/app/outreach-engine/components/GenerateForm'
import OutputCard from '@/app/outreach-engine/components/OutputCard'
import TemplateList from '@/app/outreach-engine/components/TemplateList'
import { convertToCSV, downloadFile } from '@/app/outreach-engine/lib/utils'
import type { User } from '@supabase/supabase-js'

function Dashboard() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_callback') {
      setAuthError('Login could not be completed. Request a new magic link and try again.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setAuthError(error.message)
    else setMessage('Check your email for the magic link!')
    setLoading(false)
  }

  const handleGenerate = async (data: GenerateRequest) => {
    setGenerating(true)
    try {
      const res = await generateOutreach(data)
      setResult(res)
    } catch (err: any) {
      alert(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!result) return
    const name = prompt('Template Name:')
    if (!name) return

    try {
      await saveTemplate({
        name,
        tone: 'direct', // Default or from result? Result doesn't have tone back
        structure: result.output
      })
      alert('Template saved!')
    } catch (err) {
      alert('Failed to save template')
    }
  }

  const handleDownloadJSON = () => {
    if (!result) return
    downloadFile(JSON.stringify(result.output, null, 2), 'outreach.json', 'application/json')
  }

  const handleDownloadCSV = () => {
    if (!result) return
    const csv = convertToCSV(result.output)
    downloadFile(csv, 'outreach.csv', 'text/csv')
  }

  if (loading) return <div className="stack">Loading...</div>

  if (!user) {
    return (
      <div className="shell">
        <div className="panel">
          <h1 className="page-title">Outreach Engine</h1>
          <form onSubmit={handleLogin} className="stack">
            <div>
              <label className="stack">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="stack"
                placeholder="you@example.com"
              />
            </div>
            {authError && <p className="text-danger">{authError}</p>}
            {message && <p className="stack">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="button button--primary"
            >
              Send Magic Link
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <header className="stack">
        <div>
          <h1 className="page-title">Outreach Engine</h1>
          <p className="stack">{user.email}</p>
        </div>
        <div className="stack">
          {result && (
            <div className="stack">
              Credits remaining: {result.credits_remaining}
            </div>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="stack"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="stack">
        <div className="stack">
          <GenerateForm onSubmit={handleGenerate} loading={generating} />
          <TemplateList onSelect={(t: Template) => alert('Template selection not implemented in MVP form state')} />
        </div>

        <div className="stack">
          {!result ? (
            <div className="stack">
              Your generated outreach will appear here...
            </div>
          ) : (
            <div className="stack">
              <div className="stack">
                <h2 className="page-subtitle">Generated Outreach</h2>
                <div className="stack">
                  <button onClick={handleSaveTemplate} className="button button--secondary">Save Template</button>
                  <button onClick={handleDownloadJSON} className="button button--secondary">JSON</button>
                  <button onClick={handleDownloadCSV} className="button button--secondary">CSV</button>
                </div>
              </div>

              {/* Email Section */}
              <div className="stack">
                <h3 className="stack">Email Outreach</h3>
                <div className="stack">
                  {result.output.email.subjects.map((s: string, i: number) => (
                    <OutputCard key={i} title={`Subject Variant ${i + 1}`} content={s} />
                  ))}
                  <OutputCard title="Short Body" content={result.output.email.body_short} label="< 100 words" />
                  <OutputCard title="Long Body" content={result.output.email.body_long} label="150-200 words" />
                </div>
              </div>

              {/* LinkedIn Section */}
              <div className="stack">
                <h3 className="stack">LinkedIn Outreach</h3>
                <div className="stack">
                  <OutputCard title="Connection Request" content={result.output.linkedin.connect} label="< 300 chars" />
                  <OutputCard title="Follow-up 1" content={result.output.linkedin.followup_1} />
                  <OutputCard title="Follow-up 2" content={result.output.linkedin.followup_2} />
                  <OutputCard title="Follow-up 3 (Breakup)" content={result.output.linkedin.followup_3} />
                </div>
              </div>

              {/* Follow-up Section */}
              <div className="stack">
                <h3 className="stack">Nurture Sequence</h3>
                <div className="stack">
                  {result.output.followups.map((fu: any, i: number) => (
                    <div key={i} className="stack">
                      <p className="stack">Day {fu.day}</p>
                      <OutputCard title={fu.subject} content={fu.body} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default function Page() {
  return (
    <Suspense fallback={<div className="shell">Loading...</div>}>
      <Dashboard />
    </Suspense>
  )
}
