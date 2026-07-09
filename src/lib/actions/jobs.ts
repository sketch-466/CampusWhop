'use server'

import { createClient } from '@/lib/supabase/server'
import { jobPostSchema, jobApplicationSchema, type JobPostInput, type JobApplicationInput } from '@/lib/validations/jobs'
import { revalidatePath } from 'next/cache'

// Helper to normalize Supabase joined relation
function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

interface PosterProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  reputation_score: number | null
  total_reviews: number | null
}

export async function createJobPost(data: JobPostInput) {
  const supabase = await createClient()

  const parsed = jobPostSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const deadline = parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null

  const { data: job, error } = await supabase
    .from('job_posts')
    .insert({
      poster_id: user.id,
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      job_type: parsed.data.job_type,
      location: parsed.data.location,
      is_remote: parsed.data.is_remote,
      apply_method: parsed.data.apply_method,
      apply_url: parsed.data.apply_url || null,
      apply_email: parsed.data.apply_email || null,
      apply_whatsapp: parsed.data.apply_whatsapp || null,
      deadline,
      is_paid: parsed.data.is_paid,
      pay_range: parsed.data.pay_range || null,
      requirements: parsed.data.requirements || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Create job post error:', error)
    return { error: 'Failed to create job post' }
  }

  revalidatePath('/jobs')
  return { success: true, jobId: job.id }
}

export async function getActiveJobs(filters?: {
  job_type?: string
  search?: string
  is_paid?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('job_posts')
    .select(`
      *,
      poster:profiles(id, full_name, avatar_url, reputation_score, total_reviews)
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.job_type) {
    query = query.eq('job_type', filters.job_type)
  }

  if (filters?.is_paid !== undefined) {
    query = query.eq('is_paid', filters.is_paid)
  }

  if (filters?.search) {
    query = query.textSearch('title', filters.search, {
      type: 'websearch',
      config: 'english',
    })
  }

  const { data, error } = await query

  if (error) {
    return { error: 'Failed to fetch jobs' }
  }

  const jobs = (data || []).map((item) => ({
    ...item,
    poster: normalizeRelation<PosterProfile>(item.poster as PosterProfile | PosterProfile[] | null),
  }))

  return { jobs }
}

export async function getJobById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('job_posts')
    .select(`
      *,
      poster:profiles(id, full_name, avatar_url, reputation_score, total_reviews)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return { error: 'Job not found' }
  }

  // Only return active jobs to non-owners/non-admins
  if (data.status !== 'active' && data.poster_id !== user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user?.id || '')
      .single()

    if (!profile?.is_admin) {
      return { error: 'Job not available' }
    }
  }

  // Increment view count
  if (data.poster_id !== user?.id) {
    await supabase
      .from('job_posts')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id)
  }

  const job = {
    ...data,
    poster: normalizeRelation<PosterProfile>(data.poster as PosterProfile | PosterProfile[] | null),
  }

  return { job }
}

export async function getUserJobPosts() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('job_posts')
    .select(`
      *,
      applications_count:job_applications(count)
    `)
    .eq('poster_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Failed to fetch job posts' }
  }

  return { jobs: data || [] }
}

export async function closeJobPost(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('job_posts')
    .update({ status: 'closed' })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) {
    return { error: 'Failed to close job post' }
  }

  revalidatePath('/jobs/my-posts')
  revalidatePath('/jobs')
  return { success: true }
}

export async function deleteJobPost(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('job_posts')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'deleted',
    })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) {
    return { error: 'Failed to delete job post' }
  }

  revalidatePath('/jobs/my-posts')
  revalidatePath('/jobs')
  return { success: true }
}

export async function applyToJob(data: JobApplicationInput) {
  const supabase = await createClient()

  const parsed = jobApplicationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to apply' }
  }

  // Check job exists, is active, and uses internal apply
  const { data: job, error: jobError } = await supabase
    .from('job_posts')
    .select('poster_id, status, apply_method')
    .eq('id', data.job_id)
    .single()

  if (jobError || !job) {
    return { error: 'Job not found' }
  }

  if (job.status !== 'active') {
    return { error: 'This job is no longer accepting applications' }
  }

  if (job.apply_method !== 'internal') {
    return { error: 'This job uses external application' }
  }

  if (job.poster_id === user.id) {
    return { error: 'You cannot apply to your own job post' }
  }

  // Check not already applied
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', data.job_id)
    .eq('applicant_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'You have already applied to this job' }
  }

  const { error: insertError } = await supabase
    .from('job_applications')
    .insert({
      job_id: data.job_id,
      applicant_id: user.id,
      cover_letter: data.cover_letter,
    })

  if (insertError) {
    console.error('Apply error:', insertError)
    return { error: 'Failed to submit application' }
  }

  revalidatePath(`/jobs/${data.job_id}`)
  revalidatePath('/jobs/applications')
  return { success: true }
}

export async function getUserApplications() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      job:job_posts(id, title, company, status)
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Failed to fetch applications' }
  }

  return { applications: data || [] }
}

export async function getJobApplications(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is the job poster
  const { data: job } = await supabase
    .from('job_posts')
    .select('poster_id')
    .eq('id', jobId)
    .single()

  if (!job || job.poster_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      applicant:profiles(id, full_name, avatar_url, university, reputation_score, total_reviews)
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Failed to fetch applications' }
  }

  const applications = (data || []).map((item) => ({
    ...item,
    applicant: normalizeRelation(item.applicant as any),
  }))

  return { applications }
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected']
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' }
  }

  // Verify user owns the job this application is for
  const { data: app } = await supabase
    .from('job_applications')
    .select('job_id')
    .eq('id', applicationId)
    .single()

  if (!app) {
    return { error: 'Application not found' }
  }

  const { data: job } = await supabase
    .from('job_posts')
    .select('poster_id')
    .eq('id', app.job_id)
    .single()

  if (!job || job.poster_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    return { error: 'Failed to update status' }
  }

  revalidatePath(`/jobs/${app.job_id}/applicants`)
  return { success: true }
}

// Admin actions
export async function getPendingJobs() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('job_posts')
    .select(`
      *,
      poster:profiles(full_name, email, university)
    `)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'Failed to fetch pending jobs' }
  }

  return { jobs: data || [] }
}

export async function approveJob(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('job_posts')
    .update({ status: 'active' })
    .eq('id', id)

  if (error) {
    return { error: 'Failed to approve job' }
  }

  revalidatePath('/admin/jobs')
  revalidatePath('/jobs')
  return { success: true }
}

export async function rejectJob(id: string, reason: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('job_posts')
    .update({
      status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', id)

  if (error) {
    return { error: 'Failed to reject job' }
  }

  revalidatePath('/admin/jobs')
  return { success: true }
}

export async function hasAppliedToJob(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { hasApplied: false }
  }

  const { data } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('applicant_id', user.id)
    .maybeSingle()

  return { hasApplied: !!data }
}
