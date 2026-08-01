import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJobById, hasAppliedToJob } from '@/lib/actions/jobs'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Clock, Banknote, ExternalLink, Mail, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JobApplicationForm } from '@/components/shared/job-application-form'
import ViewTracker from '@/components/shared/view-tracker'

interface GigDetailPageProps {
  params: Promise<{ id: string }>
}

const gigTypeLabels: Record<string, string> = {
  job: 'Part-time',
  internship: 'Internship',
  gig: 'One-time Gig',
  ambassador: 'Ambassador',
  remote: 'Remote',
  freelance: 'Freelance',
}

export default async function GigDetailPage({ params }: GigDetailPageProps) {
  const { id } = await params
  const { job: gig, error } = await getJobById(id)

  if (error || !gig) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isOwner = user?.id === gig.poster_id
  const { hasApplied } = await hasAppliedToJob(id)
  const isExpired = gig.deadline && new Date(gig.deadline) < new Date()

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <ViewTracker entityType="job" entityId={id} userId={user?.id ?? null} />

      <Link
        href="/gigs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Gigs
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="default">{gigTypeLabels[gig.job_type] || gig.job_type}</Badge>
            {gig.is_remote && <Badge variant="outline">Remote</Badge>}
            {gig.is_paid && <Badge variant="success">Paid</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-white">{gig.title}</h1>
          <p className="text-lg text-emerald-400 mt-1">{gig.company}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {gig.location}
          </span>
          {gig.pay_range && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Banknote className="h-4 w-4" />
              {gig.pay_range}
            </span>
          )}
          {gig.deadline && (
            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
              <Clock className="h-4 w-4" />
              Deadline: {new Date(gig.deadline).toLocaleDateString()}
            </span>
          )}
          <span className="text-zinc-500">{gig.views_count} views</span>
        </div>

        {/* Poster */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-white">
              {gig.poster?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-white">
                {gig.poster?.full_name || 'Unknown'}
              </p>
              <ReputationBadge
                score={gig.poster?.reputation_score || 0}
                totalReviews={gig.poster?.total_reviews || 0}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-white mb-2">Description</h3>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {gig.description}
          </p>
        </div>

        {/* Requirements */}
        {gig.requirements && (
          <div>
            <h3 className="font-semibold text-white mb-2">Requirements</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {gig.requirements}
            </p>
          </div>
        )}

        {/* Apply Section */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          {isOwner ? (
            <div className="text-center">
              <p className="text-sm text-yellow-400">This is your gig post.</p>
              {gig.apply_method === 'internal' && (
                <Link href={`/gigs/${id}/applicants`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Applicants
                  </Button>
                </Link>
              )}
            </div>
          ) : !user ? (
            <div className="text-center">
              <p className="text-sm text-zinc-400">Sign in to apply for this gig.</p>
              <Link href="/login">
                <Button className="mt-2 bg-emerald-500 hover:bg-emerald-600">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : hasApplied ? (
            <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-4 text-center">
              <p className="text-sm text-emerald-400">✓ You have applied for this gig</p>
            </div>
          ) : gig.apply_method === 'external' ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Apply via:</p>
              <div className="flex flex-wrap gap-2">
                {gig.apply_url && (
                  <a
                    href={gig.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply Online
                  </a>
                )}
                {gig.apply_email && (
                  <a
                    href={`mailto:${gig.apply_email}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <Mail className="h-4 w-4" />
                    Apply via Email
                  </a>
                )}
                {gig.apply_whatsapp && (
                  <a
                    href={`https://wa.me/${gig.apply_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-900/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Apply via WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <JobApplicationForm jobId={id} />
          )}
        </div>
      </div>
    </div>
  )
}