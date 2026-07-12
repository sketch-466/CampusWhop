'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createHousingListing, uploadHousingImage } from '@/lib/actions/housing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, X, CheckCircle, Loader2 } from 'lucide-react'

type ListingType =
  | 'hostel'
  | 'self_contain'
  | 'shared_apartment'
  | 'roommate_wanted'

type PosterRole = 'student' | 'landlord' | 'agent'

type PricePeriod = 'per_session' | 'per_month' | 'per_year'

const listingTypes: { value: ListingType; label: string }[] = [
  { value: 'hostel', label: 'Hostel' },
  { value: 'self_contain', label: 'Self Contain' },
  { value: 'shared_apartment', label: 'Shared Apartment' },
  { value: 'roommate_wanted', label: 'Roommate Wanted' },
]

const posterRoles: { value: PosterRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Agent' },
]

const pricePeriods: { value: PricePeriod; label: string }[] = [
  { value: 'per_session', label: 'Per Session' },
  { value: 'per_month', label: 'Per Month' },
  { value: 'per_year', label: 'Per Year' },
]

const universities: string[] = ['FUNAI']

const amenityOptions: { value: string; label: string }[] = [
  { value: 'water', label: 'Running Water' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'security', label: 'Security' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'generator', label: 'Generator' },
  { value: 'parking', label: 'Parking' },
  { value: 'furnished', label: 'Furnished' },
]

interface FormData {
  poster_role: PosterRole
  listing_type: ListingType
  title: string
  description: string
  university: string
  location_area: string
  distance_to_campus_mins: string
  room_type: string
  amenities: string[]
  images: string[]
  price: string
  price_period: PricePeriod | ''
  budget_min: string
  budget_max: string
}

export default function NewHousingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    poster_role: 'student',
    listing_type: 'hostel',
    title: '',
    description: '',
    university: 'FUNAI',
    location_area: '',
    distance_to_campus_mins: '',
    room_type: '',
    amenities: [],
    images: [],
    price: '',
    price_period: '',
    budget_min: '',
    budget_max: '',
  })

  const isRoommateWanted = formData.listing_type === 'roommate_wanted'

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function toggleAmenity(amenity: string) {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploadingImages(true)
      setError(undefined)

      const newImages: string[] = []

      for (const file of Array.from(files)) {
        const uploadForm = new FormData()
        uploadForm.append('image', file)

        const result = await uploadHousingImage(uploadForm)

        if (result.success && result.url) {
          newImages.push(result.url)
        } else {
          setError(result.error || 'Failed to upload image')
          break
        }
      }

      if (newImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newImages],
        }))
      }

      setUploadingImages(false)
      e.target.value = ''
    },
    []
  )

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(undefined)

    const submitForm = new FormData()
    submitForm.append('poster_role', formData.poster_role)
    submitForm.append('listing_type', formData.listing_type)
    submitForm.append('title', formData.title)
    submitForm.append('description', formData.description)
    submitForm.append('university', formData.university)
    submitForm.append('location_area', formData.location_area)
    submitForm.append(
      'distance_to_campus_mins',
      formData.distance_to_campus_mins
    )
    submitForm.append('room_type', formData.room_type)
    submitForm.append('amenities', JSON.stringify(formData.amenities))
    submitForm.append('images', JSON.stringify(formData.images))

    if (isRoommateWanted) {
      submitForm.append('budget_min', formData.budget_min)
      submitForm.append('budget_max', formData.budget_max)
    } else {
      submitForm.append('price', formData.price)
      submitForm.append('price_period', formData.price_period)
    }

    const result = await createHousingListing(submitForm)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Something went wrong')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Listing Submitted!</h1>
        <p className="text-zinc-400 mt-2">
          Your housing listing is pending admin review. You will be notified
          once it is approved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/housing">
            <Button variant="outline">Browse Housing</Button>
          </Link>
          <Link href="/housing/my-listings">
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              My Listings
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/housing"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Housing
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Post Housing</h1>

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
          <h2 className="text-lg font-semibold text-white">Listing Type</h2>

          <div>
            <Label className="text-zinc-300">I am a</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {posterRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => updateField('poster_role', role.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    formData.poster_role === role.value
                      ? 'bg-emerald-500 text-white'
                      : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300">Listing Type</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {listingTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('listing_type', type.value)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${
                    formData.listing_type === type.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300">University</Label>
            <select
              value={formData.university}
              onChange={(e) => updateField('university', e.target.value)}
              disabled
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-500"
            >
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-600 mt-1">
              More universities coming soon
            </p>
          </div>

          <Button
            onClick={() => setStep(2)}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            Next: Details
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Property Details</h2>

          <div>
            <Label className="text-zinc-300">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Spacious 2-bedroom hostel near campus gate"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the property, neighborhood, rules, etc..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Location Area</Label>
            <Input
              value={formData.location_area}
              onChange={(e) => updateField('location_area', e.target.value)}
              placeholder="e.g. Behind School Gate, Abakpa"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-300">Distance to Campus (mins)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={formData.distance_to_campus_mins}
                onChange={(e) =>
                  updateField('distance_to_campus_mins', e.target.value)
                }
                placeholder="e.g. 10"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Room Type (optional)</Label>
              <Input
                value={formData.room_type}
                onChange={(e) => updateField('room_type', e.target.value)}
                placeholder="e.g. Single, Shared"
                className="mt-1"
              />
            </div>
          </div>

          {/* Conditional pricing */}
          {isRoommateWanted ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Budget Min (₦)</Label>
                <Input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => updateField('budget_min', e.target.value)}
                  placeholder="e.g. 50000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Budget Max (₦)</Label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => updateField('budget_max', e.target.value)}
                  placeholder="e.g. 80000"
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Price (₦)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="e.g. 60000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Period</Label>
                <select
                  value={formData.price_period}
                  onChange={(e) =>
                    updateField('price_period', e.target.value as PricePeriod)
                  }
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select period</option>
                  {pricePeriods.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              Next: Amenities & Photos
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Amenities & Photos
          </h2>

          <div>
            <Label className="text-zinc-300">Amenities</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenityOptions.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity.value)
                return (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => toggleAmenity(amenity.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {amenity.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300">Photos</Label>
            <div className="mt-2">
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-8 transition-colors hover:border-zinc-500">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                  <p className="mt-2 text-sm text-zinc-400">
                    Click to upload images
                  </p>
                  <p className="text-xs text-zinc-600">
                    JPG, PNG, WEBP up to 5MB each
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadingImages && (
                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
                    >
                      <img
                        src={img}
                        alt={`Upload ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 rounded-full bg-zinc-950/80 p-1 text-zinc-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || uploadingImages}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? 'Submitting...' : 'Post Listing'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
