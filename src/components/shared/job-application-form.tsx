'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { applyToJob } from '@/lib/actions/jobs'

interface JobApplicationFormProps {
  jobId: string
}

export function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const router = useRouter()
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (coverLetter.length < 50) {
      setError('Cover letter must be at least 50 characters')
      return
    }

    setLoading(true)
    setError(undefined)

    const result = await applyToJob({
      job_id: jobId,
      cover_letter: coverLetter,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-4 text-center">
        <p className="text-sm text-emerald-400">✓ Application submitted successfully</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white">Apply for this position</p>
      <Textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Write a cover letter explaining why you're a good fit for this role..."
        rows={5}
        maxLength={1000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{coverLetter.length}/1000</span>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-emerald-500 hover:bg-emerald-600"
      >
        {loading ? 'Submitting...' : 'Submit Application'}
      </Button>
    </div>
  )
}
