import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ShoppingBag, Store, GraduationCap, Plus, Shield,
  Users, Calendar, Zap,
} from 'lucide-react'
import { ReputationBadge } from '@/components/shared/reputation-badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // Creators get their own dashboard
  if (profile.creator_type) redirect('/creator-dashboard')

  const [
    { data: subaccount },
    { count: ordersCount },
    { count: activeSubsCount },
    { data: upcomingBookings },
  ] = await Promise.all([
    supabase
      .from('paystack_subaccounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('bookings')
      .select('id, booking_services(title), booking_slots(starts_at), proposed_time')
      .eq('buyer_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ?? 'U')[0].toUpperCase()

  const adminLinks = [
    { label: 'Listings', href: '/admin/listings' },
    { label: 'Gigs', href: '/admin/jobs' },
    { label: 'Stores', href: '/admin/stores' },
    { label: 'Disputes', href: '/admin/disputes' },
    { label: 'Opportunities', href: '/admin/opportunities' },
    { label: 'Analytics', href: '/admin/analytics' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">

      {/* Payout Setup Banner */}
      {!subaccount && (
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-400">Set up your payout account</p>
            <p className="text-xs text-amber-600 mt-0.5">Required to receive payments when you sell</p>
          </div>
          <Link href="/seller/setup"
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
            Set Up Now
          </Link>
        </div>
      )}

      {/* Creator nudge */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-300">Are you a creator?</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Set your creator type to unlock bookings, subscriptions, and a creator dashboard
          </p>
        </div>
        <Link href="/profile/edit"
          className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
          Set Up
        </Link>
      </div>

      {/* Profile Bar */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || ''} />
            )}
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-white">{profile.full_name || 'Student'}</h2>
            <p className="text-xs text-zinc-500">
              {profile.university || 'No university'}
            </p>
            <div className="mt-0.5">
              <ReputationBadge
                score={profile.reputation_score || 0}
                totalReviews={profile.total_reviews || 0}
              />
            </div>
          </div>
        </div>
        <Link href="/profile/edit">
          <span className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
            Edit
          </span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{ordersCount ?? 0}</p>
          <p className="text-xs text-zinc-500">Orders</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{activeSubsCount ?? 0}</p>
          <p className="text-xs text-zinc-500">Subscriptions</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">
            {profile.reputation_score?.toFixed(1) || '0.0'}
          </p>
          <p className="text-xs text-zinc-500">Reputation</p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="rounded-xl border border-blue-800/30 bg-blue-900/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-400">Upcoming Sessions</h3>
            <Link href="/bookings" className="text-xs text-zinc-400 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((b: any) => {
              const service = Array.isArray(b.booking_services)
                ? b.booking_services[0] : b.booking_services
              const slot = Array.isArray(b.booking_slots)
                ? b.booking_slots[0] : b.booking_slots
              const time = slot?.starts_at || b.proposed_time
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{service?.title ?? 'Session'}</p>
                    {time && (
                      <p className="text-xs text-zinc-500">
                        {new Date(time).toLocaleString('en-NG', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-blue-400">Confirmed</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Explore</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/marketplace"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Marketplace</h4>
            <p className="text-xs text-zinc-500">Buy products</p>
          </Link>
          <Link href="/gigs"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Zap className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Gigs</h4>
            <p className="text-xs text-zinc-500">Find paid work</p>
          </Link>
          <Link href="/creators"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Users className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Creators</h4>
            <p className="text-xs text-zinc-500">Hire a student</p>
          </Link>
          <Link href="/opportunities"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <GraduationCap className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Opportunities</h4>
            <p className="text-xs text-zinc-500">Scholarships & grants</p>
          </Link>
          <Link href="/store"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Store className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Stores</h4>
            <p className="text-xs text-zinc-500">Browse student stores</p>
          </Link>
          <Link href="/bookings"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Calendar className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Bookings</h4>
            <p className="text-xs text-zinc-500">Your sessions</p>
          </Link>
        </div>
      </div>

      {/* Start Selling CTA */}
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-emerald-400">Start Earning</h3>
            <p className="text-sm text-emerald-300/70">
              Post your first listing and make money on campus
            </p>
          </div>
          <Link href="/marketplace/new">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              Sell Now
            </span>
          </Link>
        </div>
      </div>

      {/* Admin Panel */}
      {profile.is_admin && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Admin Panel</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="rounded-lg border border-amber-800/30 bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-900/40">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}