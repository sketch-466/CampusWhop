'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createJobPost } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const gigTypes = [
  { value: 'freelance' as const, label: 'Freelance' },
  { value: 'gig' as const, label: 'One-time Gig' },
  { value: 'remote' as const, label: 'Remote Work' },
  { value: 'internship' as const, label: 'Internship' },
  { value: 'ambassador' as const, label: 'Brand Ambassador' },
  { value: 'job' as const, label: 'Part-time Job' },
]

type GigType = (typeof gigTypes)[number]['value']
type ApplyMethod = 'external' | 'internal'

interface FormData {
  title: string
  company: string
  job_type: GigType
  location: string
  is_remote: boolean
  description: string
  requirements: string
  deadline: string
  is_paid: boolean
  pay_range: string
  apply_method: ApplyMethod
  apply_url: string
  apply_email: string
  apply_whatsapp: string
}

export default function NewGigPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    job_type: 'freelance',
    location: '',
    is_remote: false,
    description: '',
    requirements: '',
    deadline: '',
    is_paid: true,
    pay_range: '',
    apply_method: 'internal',
    apply_url: '',
    apply_email: '',
    apply_whatsapp: '',
  })

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(undefined)
    const result = await createJobPost(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Gig Posted!</h1>
        <p className="text-zinc-400 mt-2">
          Your gig is pending admin review. You will be notified once it is approved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/gigs">
            <Button variant="outline">Browse Gigs</Button>
          </Link>
          <Link href="/gigs/my-posts">
            <Button className="bg-emerald-500 hover:bg-emerald-600">My Gigs</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/gigs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Gigs
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Post a Gig</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              s <= step ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Basic Info</h2>
          <div>
            <Label className="text-zinc-300">Gig Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Logo Design for Student Brand"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-zinc-300">Your Name / Brand</Label>
            <Input
              value={formData.company}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="e.g. SketchDesigns"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-zinc-300">Gig Type</Label>
            <select
              value={formData.job_type}
              onChange={(e) => updateField('job_type', e.target.value as GigType)}
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              {gigTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-zinc-300">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g. Lagos, Enugu, or Online"
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={formData.is_remote}
              onChange={(e) => updateField('is_remote', e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900"
            />
            This can be done remotely
          </label>
          <Button
            onClick={() => setStep(2)}
            disabled={!formData.title || !formData.company}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            Next: Details
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Gig Details</h2>
          <div>
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what the gig involves, what you need done, and any important details..."
              rows={5}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-zinc-300">Requirements (optional)</Label>
            <Textarea
              value={formData.requirements}
              onChange={(e) => updateField('requirements', e.target.value)}
              placeholder="Any skills or experience needed..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-zinc-300">Deadline (optional)</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={formData.is_paid}
              onChange={(e) => updateField('is_paid', e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900"
            />
            This is a paid gig
          </label>
          {formData.is_paid && (
            <div>
              <Label className="text-zinc-300">Budget / Pay</Label>
              <Input
                value={formData.pay_range}
                onChange={(e) => updateField('pay_range', e.target.value)}
                placeholder="e.g. ₦15,000 flat or ₦5,000/hr"
                className="mt-1"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!formData.description}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              Next: How to Apply
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">How to Apply</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 cursor-pointer transition-colors hover:border-zinc-700">
              <input
                type="radio"
                name="apply_method"
                value="internal"
                checked={formData.apply_method === 'internal'}
                onChange={() => updateField('apply_method', 'internal')}
              />
              <div>
                <p className="font-medium text-white">In-App Applications</p>
                <p className="text-xs text-zinc-500">
                  Students apply on CampusWhop. Review them in your dashboard.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 cursor-pointer transition-colors hover:border-zinc-700">
              <input
                type="radio"
                name="apply_method"
                value="external"
                checked={formData.apply_method === 'external'}
                onChange={() => updateField('apply_method', 'external')}
              />
              <div>
                <p className="font-medium text-white">External</p>
                <p className="text-xs text-zinc-500">
                  Students reach you via link, email, or WhatsApp.
                </p>
              </div>
            </label>
          </div>

          {formData.apply_method === 'external' && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Provide at least one contact method:
              </p>
              <div>
                <Label className="text-zinc-300">Link (optional)</Label>
                <Input
                  value={formData.apply_url}
                  onChange={(e) => updateField('apply_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Email (optional)</Label>
                <Input
                  value={formData.apply_email}
                  onChange={(e) => updateField('apply_email', e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">WhatsApp (optional)</Label>
                <Input
                  value={formData.apply_whatsapp}
                  onChange={(e) => updateField('apply_whatsapp', e.target.value)}
                  placeholder="+234..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? 'Posting...' : 'Post Gig'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}