import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Shield, BadgeCheck, TrendingUp, Calendar,
  ShoppingBag, Store, Zap, Plus, BarChart2,
  Users, Star,
} from 'lucide-react'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { CREATOR_TYPE_LABELS, type CreatorType } from '@/lib/validations/profile'

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // Non-creators go back to student dashboard
  if (!profile.creator_type) redirect('/dashboard')

  const [
    { data: subaccount },
    { count: listingsCount },
    { data: earningsData },
    { data: pendingBookings },
    { data: upcomingBookings },
    { data: activeSubscribers },
    { data: subscriptionRevenue },
    { count: storeProductCount },
  ] = await Promise.all([
    supabase
      .from('paystack_subaccounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .is('deleted_at', null),
    supabase
      .from('orders')
      .select('seller_amount')
      .eq('seller_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('bookings')
      .select(`
        id,
        amount,
        proposed_time,
        booking_services(title),
        booking_slots(starts_at),
        buyer:profiles!bookings_buyer_id_fkey(full_name, avatar_url)
      `)
      .eq('creator_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select(`
        id,
        amount,
        proposed_time,
        booking_services(title),
        booking_slots(starts_at),
        buyer:profiles!bookings_buyer_id_fkey(full_name)
      `)
      .eq('creator_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('subscriptions')
      .select('id, subscriber_id, subscription_plans(title, price)')
      .eq('creator_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('subscriptions')
      .select('subscription_plans(price)')
      .eq('creator_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('store_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .not('store_id', 'is', null),
  ])

  const totalEarnings = (earningsData ?? []).reduce(
    (sum: number, o: any) => sum + (o.seller_amount || 0), 0
  )

  const monthlySubRevenue = (subscriptionRevenue ?? []).reduce(
    (sum: number, s: any) => sum + (s.subscription_plans?.price || 0), 0
  )

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ?? 'U')[0].toUpperCase()

  const creatorLabel = CREATOR_TYPE_LABELS[profile.creator_type as CreatorType]

  const adminLinks = [
  { label: 'Listings', href: '/admin/listings' },
  { label: 'Gigs', href: '/admin/jobs' },
  { label: 'Stores', href: '/admin/stores' },
  { label: 'Disputes', href: '/admin/disputes' },
  { label: 'Bookings', href: '/admin/bookings' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
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
            <p className="text-xs text-amber-600 mt-0.5">
              Required to receive payments from bookings and sales
            </p>
          </div>
          <Link href="/seller/setup"
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
            Set Up Now
          </Link>
        </div>
      )}

      {/* Creator Profile Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || ''} />
              )}
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-semibold text-white">{profile.full_name || 'Creator'}</h2>
                {profile.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <span className="inline-block mt-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {creatorLabel}
              </span>
              <p className="text-xs text-zinc-500 mt-0.5">
                {profile.university || 'Nigerian University'}
              </p>
              <div className="mt-1">
                <ReputationBadge
                  score={profile.reputation_score || 0}
                  totalReviews={profile.total_reviews || 0}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Link href="/profile/edit"
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 text-center">
              Edit Profile
            </Link>
            <Link href={`/creators/${user.id}`}
              className="rounded-md border border-emerald-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-900/20 text-center">
              Public Page
            </Link>
          </div>
        </div>

        {profile.tagline && (
          <p className="mt-3 text-sm text-zinc-400 italic">&ldquo;{profile.tagline}&rdquo;</p>
        )}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">
            ₦{totalEarnings.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Total Earned</p>
        </div>
        <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">
            ₦{monthlySubRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Monthly Subs</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">
            {(activeSubscribers ?? []).length}
          </p>
          <p className="text-xs text-zinc-500">Subscribers</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">
            {profile.reputation_score?.toFixed(1) || '0.0'}
          </p>
          <p className="text-xs text-zinc-500">Reputation</p>
        </div>
      </div>

      {/* Pending Booking Requests */}
      {pendingBookings && pendingBookings.length > 0 && (
        <div className="rounded-xl border border-yellow-800/30 bg-yellow-900/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yellow-400">
              Booking Requests ({pendingBookings.length})
            </h3>
            <Link href="/bookings?tab=selling" className="text-xs text-zinc-400 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingBookings.map((b: any) => {
              const service = Array.isArray(b.booking_services)
                ? b.booking_services[0] : b.booking_services
              const buyer = Array.isArray(b.buyer) ? b.buyer[0] : b.buyer
              const slot = Array.isArray(b.booking_slots)
                ? b.booking_slots[0] : b.booking_slots
              const time = slot?.starts_at || b.proposed_time
              return (
                <div key={b.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{service?.title ?? 'Booking'}</p>
                    <p className="text-xs text-zinc-500">
                      from {buyer?.full_name ?? 'Someone'}
                      {time && ` · ${new Date(time).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                      })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-emerald-400">
                      ₦{b.amount?.toLocaleString()}
                    </span>
                    <Link href="/bookings?tab=selling"
                      className="text-xs text-yellow-400 hover:underline">
                      Respond
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirmed Upcoming Sessions */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="rounded-xl border border-blue-800/30 bg-blue-900/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-400">Confirmed Sessions</h3>
            <Link href="/bookings?tab=selling" className="text-xs text-zinc-400 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((b: any) => {
              const service = Array.isArray(b.booking_services)
                ? b.booking_services[0] : b.booking_services
              const buyer = Array.isArray(b.buyer) ? b.buyer[0] : b.buyer
              const slot = Array.isArray(b.booking_slots)
                ? b.booking_slots[0] : b.booking_slots
              const time = slot?.starts_at || b.proposed_time
              return (
                <div key={b.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{service?.title ?? 'Session'}</p>
                    <p className="text-xs text-zinc-500">
                      with {buyer?.full_name ?? 'Client'}
                      {time && ` · ${new Date(time).toLocaleString('en-NG', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}`}
                    </p>
                  </div>
                  <span className="text-xs text-blue-400 shrink-0">Confirmed</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Subscribers */}
      {activeSubscribers && activeSubscribers.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Active Subscribers</h3>
            <Link href="/subscriptions?tab=plans" className="text-xs text-zinc-400 hover:text-white">
              Manage plans →
            </Link>
          </div>
          <div className="space-y-2">
            {activeSubscribers.map((sub: any) => {
              const plan = Array.isArray(sub.subscription_plans)
                ? sub.subscription_plans[0] : sub.subscription_plans
              return (
                <div key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <p className="text-sm text-zinc-300">{plan?.title ?? 'Subscription'}</p>
                  <p className="text-xs font-medium text-emerald-400">
                    ₦{plan?.price?.toLocaleString()}/mo
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Creator Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/marketplace/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">New Listing</h4>
            <p className="text-xs text-zinc-500">Sell a product</p>
          </Link>
          <Link href="/bookings/services/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Calendar className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">New Service</h4>
            <p className="text-xs text-zinc-500">Offer a booking</p>
          </Link>
          <Link href="/subscriptions/plans/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Zap className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">New Plan</h4>
            <p className="text-xs text-zinc-500">Create a subscription</p>
          </Link>
          <Link href="/store/dashboard"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Store className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">My Store</h4>
            <p className="text-xs text-zinc-500">Manage storefront</p>
          </Link>
          <Link href="/profile/analytics"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <BarChart2 className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Analytics</h4>
            <p className="text-xs text-zinc-500">Views & performance</p>
          </Link>
          <Link href="/gigs/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Plus className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Post a Gig</h4>
            <p className="text-xs text-zinc-500">Find collaborators</p>
          </Link>
        </div>
      </div>

      {/* No bookings CTA */}
      {(!pendingBookings || pendingBookings.length === 0) &&
       (!upcomingBookings || upcomingBookings.length === 0) && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center">
          <Calendar className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No bookings yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Share your{' '}
            <Link href={`/creators/${user.id}`} className="text-emerald-400 hover:underline">
              creator page
            </Link>
            {' '}to attract clients.
          </p>
          <Link href="/bookings/services/new">
            <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              Create a Service
            </span>
          </Link>
        </div>
      )}

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