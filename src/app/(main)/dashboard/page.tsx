import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ShoppingBag, Store, GraduationCap, Plus, Shield,
  Users, Calendar, Zap, BadgeCheck, TrendingUp,
} from 'lucide-react'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { CREATOR_TYPE_LABELS, type CreatorType } from '@/lib/validations/profile'

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

  const [
    { data: subaccount },
    { count: listingsCount },
    { count: ordersCount },
    { data: earningsData },
    { data: pendingBookings },
    { data: upcomingBookings },
    { data: activeSubscriptions },
    { data: subscriptionRevenue },
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
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id),
    supabase
      .from('orders')
      .select('seller_amount')
      .eq('seller_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('bookings')
      .select('id, booking_services(title), buyer:profiles!bookings_buyer_id_fkey(full_name), proposed_time, booking_slots(starts_at)')
      .eq('creator_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('bookings')
      .select('id, booking_services(title), booking_slots(starts_at), proposed_time')
      .eq('buyer_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('subscriber_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('subscription_plans(price)')
      .eq('creator_id', user.id)
      .eq('status', 'active'),
  ])

  const totalEarnings = (earningsData ?? []).reduce(
    (sum: number, o: any) => sum + (o.seller_amount || 0), 0
  )

  const monthlySubscriptionRevenue = (subscriptionRevenue ?? []).reduce(
    (sum: number, s: any) => sum + (s.subscription_plans?.price || 0), 0
  )

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ?? 'U')[0].toUpperCase()

  const isCreator = !!profile.creator_type

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
          <Link
            href="/seller/setup"
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
          >
            Set Up Now
          </Link>
        </div>
      )}

      {/* Creator Profile nudge */}
      {!isCreator && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Complete your Creator Profile</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Get discovered by students looking to hire
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Set Up
          </Link>
        </div>
      )}

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
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-white">{profile.full_name || 'Student'}</h2>
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
              )}
            </div>
            {profile.creator_type && (
              <span className="text-xs text-emerald-400">
                {CREATOR_TYPE_LABELS[profile.creator_type as CreatorType]}
              </span>
            )}
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{listingsCount ?? 0}</p>
          <p className="text-xs text-zinc-500">Listings</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">{ordersCount ?? 0}</p>
          <p className="text-xs text-zinc-500">Orders</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-emerald-400">
            ₦{totalEarnings.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">Earned</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">
            {profile.reputation_score?.toFixed(1) || '0.0'}
          </p>
          <p className="text-xs text-zinc-500">Reputation</p>
        </div>
      </div>

      {/* Creator Revenue Row — only shown if creator */}
      {isCreator && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-800/30 bg-emerald-900/10 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-emerald-400 font-medium">Monthly Sub Revenue</p>
            </div>
            <p className="text-xl font-bold text-white">
              ₦{monthlySubscriptionRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              from {(subscriptionRevenue ?? []).length} subscriber(s)
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <p className="text-xs text-zinc-400 font-medium">Pending Bookings</p>
            </div>
            <p className="text-xl font-bold text-white">
              {(pendingBookings ?? []).length}
            </p>
            <Link href="/bookings?tab=selling" className="text-xs text-emerald-400 hover:underline">
              Review →
            </Link>
          </div>
        </div>
      )}

      {/* Pending booking requests — creator only */}
      {isCreator && pendingBookings && pendingBookings.length > 0 && (
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
                ? b.booking_services[0]
                : b.booking_services
              const buyer = Array.isArray(b.buyer) ? b.buyer[0] : b.buyer
              const slot = Array.isArray(b.booking_slots)
                ? b.booking_slots[0]
                : b.booking_slots
              const time = slot?.starts_at || b.proposed_time
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{service?.title ?? 'Booking'}</p>
                    <p className="text-xs text-zinc-500">
                      from {buyer?.full_name ?? 'Someone'}
                      {time && ` · ${new Date(time).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  <Link
                    href="/bookings?tab=selling"
                    className="text-xs text-emerald-400 hover:underline shrink-0"
                  >
                    Respond
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming sessions — buyer */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="rounded-xl border border-blue-800/30 bg-blue-900/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-400">
              Upcoming Sessions
            </h3>
            <Link href="/bookings" className="text-xs text-zinc-400 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((b: any) => {
              const service = Array.isArray(b.booking_services)
                ? b.booking_services[0]
                : b.booking_services
              const slot = Array.isArray(b.booking_slots)
                ? b.booking_slots[0]
                : b.booking_slots
              const time = slot?.starts_at || b.proposed_time
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{service?.title ?? 'Session'}</p>
                    {time && (
                      <p className="text-xs text-zinc-500">
                        {new Date(time).toLocaleString('en-NG', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
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

      {/* Active subscriptions summary */}
      {(activeSubscriptions as any)?.count > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {(activeSubscriptions as any).count} Active Subscription{(activeSubscriptions as any).count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-zinc-500">Creators you support</p>
            </div>
          </div>
          <Link href="/subscriptions" className="text-xs text-emerald-400 hover:underline">
            Manage →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/marketplace/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Sell Something</h4>
            <p className="text-xs text-zinc-500">List a product</p>
          </Link>
          <Link href="/gigs"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <Zap className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Browse Gigs</h4>
            <p className="text-xs text-zinc-500">Find paid work</p>
          </Link>
          <Link href="/creators"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <Users className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Creators</h4>
            <p className="text-xs text-zinc-500">Hire a student</p>
          </Link>
          <Link href="/store/dashboard"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <Store className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">My Store</h4>
            <p className="text-xs text-zinc-500">Manage storefront</p>
          </Link>
          <Link href="/bookings/services/new"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <Calendar className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Offer Session</h4>
            <p className="text-xs text-zinc-500">Create a booking service</p>
          </Link>
          <Link href="/opportunities"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50">
            <GraduationCap className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Opportunities</h4>
            <p className="text-xs text-zinc-500">Scholarships & grants</p>
          </Link>
        </div>
      </div>

      {/* Sell Something CTA — only if no listings */}
      {(listingsCount ?? 0) === 0 && (
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
                List Now
              </span>
            </Link>
          </div>
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
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-amber-800/30 bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-900/40"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}