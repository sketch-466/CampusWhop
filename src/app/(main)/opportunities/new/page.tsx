'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createOpportunity } from '@/lib/actions/opportunities'

const CATEGORIES = [
  { value: 'scholarship', label: '🎓 Scholarship' },
  { value: 'internship', label: '💼 Internship' },
  { value: 'grant', label: '💰 Grant' },
  { value: 'competition', label: '🏆 Competition' },
]

type FormErrors = Partial<Record<string, string>>

export default function NewOpportunityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [category, setCategory] = useState('scholarship')
  const [title, setTitle] = useState('')
  const [organization, setOrganization] = useState('')
  const [description, setDescription] = useState('')
  const [eligibility, setEligibility] = useState('')
  const [amount, setAmount] = useState('')
  const [location, setLocation] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [applyUrl, setApplyUrl] = useState('')
  const [deadline, setDeadline] = useState('')

  function validate(): boolean {
    const e: FormErrors = {}
    if (title.length < 10) e.title = 'Title must be at least 10 characters'
    if (organization.length < 2) e.organization = 'Organization name required'
    if (description.length < 30) e.description = 'Description must be at least 30 characters'
    if (!applyUrl) e.apply_url = 'Application link is required'
    else {
      try { new URL(applyUrl) } catch { e.apply_url = 'Enter a valid URL' }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    setError(null)

    try {
      await createOpportunity({
        category: category as 'scholarship' | 'internship' | 'grant' | 'competition',
        title: title.trim(),
        organization: organization.trim(),
        description: description.trim(),
        eligibility: eligibility.trim() || undefined,
        amount: amount.trim() || undefined,
        location: location.trim() || undefined,
        is_remote: isRemote,
        apply_url: applyUrl.trim(),
        deadline: deadline || undefined,
      })
      router.push('/opportunities/my-posts?success=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit opportunity')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <button
          onClick={() => router.back()}
          className="mb-3 text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-zinc-100">Submit Opportunity</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Share a scholarship, internship, grant or competition with the community
        </p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`rounded-lg border py-2.5 text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs text-zinc-400">
            Opportunity Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MTN Foundation Scholarship 2025"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
        </div>

        {/* Organization */}
        <div className="space-y-1.5">
          <Label htmlFor="organization" className="text-xs text-zinc-400">
            Organization / Provider
          </Label>
          <Input
            id="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="e.g. MTN Foundation"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.organization && (
            <p className="text-xs text-red-400">{errors.organization}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs text-zinc-400">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the opportunity — what it is, who it's for, what's involved..."
            rows={4}
            className="resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Eligibility */}
        <div className="space-y-1.5">
          <Label htmlFor="eligibility" className="text-xs text-zinc-400">
            Eligibility <span className="text-zinc-600">(optional)</span>
          </Label>
          <Textarea
            id="eligibility"
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            placeholder="e.g. Open to Nigerian undergraduates with minimum 3.5 GPA..."
            rows={3}
            className="resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs text-zinc-400">
            Award / Value <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. ₦500,000 or Fully Funded or $2,000"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
        </div>

        {/* Location + Remote */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs text-zinc-400">
            Location <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lagos, Nigeria or Worldwide"
            disabled={isRemote}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setIsRemote(!isRemote)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
              isRemote
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
            }`}
          >
            <span>{isRemote ? '✓' : '○'}</span>
            Remote / Online / Worldwide
          </button>
        </div>

        {/* Apply URL */}
        <div className="space-y-1.5">
          <Label htmlFor="apply_url" className="text-xs text-zinc-400">
            Application Link
          </Label>
          <Input
            id="apply_url"
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            placeholder="https://example.com/apply"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.apply_url && (
            <p className="text-xs text-red-400">{errors.apply_url}</p>
          )}
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="deadline" className="text-xs text-zinc-400">
            Deadline <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="deadline"
            type="date"
            min={today}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500">
            ⏳ Your submission will be reviewed by our team before going live.
            Make sure the application link works before submitting.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? 'Submitting...' : 'Submit Opportunity'}
        </Button>
      </div>
    </div>
  )
}