'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createRoommateListing } from '@/lib/actions/housing'

const GENDER_OPTIONS = [
  { value: 'male', label: '👨 Males Only' },
  { value: 'female', label: '👩 Females Only' },
  { value: 'any', label: '🤝 Any Gender' },
]

type FormErrors = Partial<Record<string, string>>

export default function NewRoommateListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [university, setUniversity] = useState('FUNAI')
  const [budgetPerYear, setBudgetPerYear] = useState('')
  const [preferredGender, setPreferredGender] = useState('any')
  const [moveInDate, setMoveInDate] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  function validate(): boolean {
    const e: FormErrors = {}
    if (title.length < 10) e.title = 'Title must be at least 10 characters'
    if (description.length < 20) e.description = 'Tell us more about yourself'
    if (location.length < 3) e.location = 'Location is required'
    if (university.length < 3) e.university = 'University is required'
    const budget = parseInt(budgetPerYear)
    if (!budget || budget < 10000) e.budget_per_year = 'Minimum budget is ₦10,000'
    if (!moveInDate) e.move_in_date = 'Move-in date is required'
    if (whatsappNumber.length < 11) e.whatsapp_number = 'Enter a valid WhatsApp number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    setError(null)

    try {
      await createRoommateListing({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        university: university.trim(),
        budget_per_year: parseInt(budgetPerYear),
        preferred_gender: preferredGender as 'male' | 'female' | 'any',
        move_in_date: moveInDate,
        whatsapp_number: whatsappNumber.trim(),
      })
      router.push('/housing/my-listings?success=roommate')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
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
        <h1 className="text-lg font-bold text-zinc-100">Find a Roommate</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Post your roommate request and connect with students looking to share
        </p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs text-zinc-400">
            Post Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Looking for female roommate near FUNAI"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs text-zinc-400">
            About You
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell potential roommates about yourself — your habits, study schedule, lifestyle..."
            rows={4}
            className="resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs text-zinc-400">
            Preferred Area
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Abakaliki Road, anywhere near campus"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
        </div>

        {/* University */}
        <div className="space-y-1.5">
          <Label htmlFor="university" className="text-xs text-zinc-400">
            University
          </Label>
          <Input
            id="university"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="e.g. FUNAI"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.university && (
            <p className="text-xs text-red-400">{errors.university}</p>
          )}
        </div>

        {/* Budget */}
        <div className="space-y-1.5">
          <Label htmlFor="budget" className="text-xs text-zinc-400">
            Budget Per Year (₦)
          </Label>
          <Input
            id="budget"
            type="number"
            value={budgetPerYear}
            onChange={(e) => setBudgetPerYear(e.target.value)}
            placeholder="e.g. 80000"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {budgetPerYear && !isNaN(parseInt(budgetPerYear)) && (
            <p className="text-xs text-zinc-500">
              = ₦{parseInt(budgetPerYear).toLocaleString()} per year
            </p>
          )}
          {errors.budget_per_year && (
            <p className="text-xs text-red-400">{errors.budget_per_year}</p>
          )}
        </div>

        {/* Preferred Gender */}
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Preferred Roommate Gender</Label>
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setPreferredGender(g.value)}
                className={`rounded-lg border py-2.5 text-xs font-medium transition-colors ${
                  preferredGender === g.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Move-in Date */}
        <div className="space-y-1.5">
          <Label htmlFor="move_in_date" className="text-xs text-zinc-400">
            Available From
          </Label>
          <Input
            id="move_in_date"
            type="date"
            min={today}
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
          />
          {errors.move_in_date && (
            <p className="text-xs text-red-400">{errors.move_in_date}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp" className="text-xs text-zinc-400">
            WhatsApp Number
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 08012345678"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
          />
          {errors.whatsapp_number && (
            <p className="text-xs text-red-400">{errors.whatsapp_number}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? 'Posting...' : 'Post Roommate Request'}
        </Button>
      </div>
    </div>
  )
}