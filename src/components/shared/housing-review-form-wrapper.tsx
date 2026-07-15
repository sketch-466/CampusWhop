'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HousingReviewForm } from '@/components/shared/housing-review-form'

type Props = {
  listingId: string
}

export function HousingReviewFormWrapper({ listingId }: Props) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-400">✓ Review submitted!</p>
        <p className="text-xs text-zinc-500 mt-1">Thank you for helping other students.</p>
      </div>
    )
  }

  return (
    <HousingReviewForm
      listingId={listingId}
      onSuccess={() => {
        setSubmitted(true)
        router.refresh()
      }}
    />
  )
}