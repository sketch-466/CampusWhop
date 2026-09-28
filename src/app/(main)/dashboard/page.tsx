import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ShoppingBag, Store, GraduationCap, Plus, Shield,
  Users, Calendar, Zap, Wallet, Package, CheckCircle,
  Clock, XCircle,
} from 'lucide-react'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import PulseFeed from '@/components/shared/pulse-feed'

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
  if (profile.creator_type) redirect('/creator-dashboard')

  const [
    { data: subaccount },
    { count: ordersCount },
    { count: activeSubsCount },
    { data: upcomingBookings },
    { data: wallet },
    { count: listingsCount },
    { count: salesCount },
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
    supabase
      .from('coin_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .neq('status', 'deleted'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id),
  ])

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ?? 'U')[0].toUpperCase()

  const isAdmin = ['admin', 'super_admin'].includes(profile?.role ?? '') || profile?.is_admin === true
  const isSuperAdmin = profile?.role === 'super_admin'
  const isSeller = (listingsCount ?? 0) > 0 || (salesCount ?? 0) > 0

  const verificationStatus = profile?.verification_status ?? null

  const adminLinks = [
    { label: 'Listings', href: '/admin/listings' },
    { label: 'Gigs', href: '/admin/jobs' },
    { label: 'Stores', href: '/admin/stores' },
    { label: 'Disputes', href: '/admin/disputes' },
    { label: 'Opportunities', href: '/admin/opportunities' },
    { label: 'Verification', href: '/admin/verification' },
    { label: 'Users', href: '/admin/users' },
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

      {/* Verification Status Banner */}
      {verificationStatus === null || verificationStatus === 'unverified' ? (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-300">Verify your student identity</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Required to post listings and build trust with buyers
              </p>
            </div>
          </div>
          <Link
            href="/verification"
            className="shrink-0 rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Verify Now
          </Link>
        </div>
      ) : verificationStatus === 'pending' ? (
        <div className="rounded-lg border border-blue-800/40 bg-blue-900/10 p-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-400">Verification under review</p>
            <p className="text-xs text-blue-400/60 mt-0.5">
              We'll notify you once your documents are approved
            </p>
          </div>
        </div>
      ) : verificationStatus === 'rejected' ? (
        <div className="rounded-lg border border-red-800/40 bg-red-900/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Verification rejected</p>
              <p className="text-xs text-red-400/60 mt-0.5">
                Please resubmit with a valid FUNAI document
              </p>
            </div>
          </div>
          <Link
            href="/verification"
            className="shrink-0 rounded-md border border-red-700/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/20"
          >
            Resubmit
          </Link>
        </div>
      ) : verificationStatus === 'verified' ? (
        <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/10 p-4 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-400">Identity verified</p>
            <p className="text-xs text-emerald-400/60 mt-0.5">
              Your FUNAI student status is confirmed
            </p>
          </div>
        </div>
      ) : null}

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
            <p className="text-xs text-zinc-500">{profile.university || 'No university'}</p>
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
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/orders?tab=buying"
          className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center hover:border-zinc-700 transition-colors"
        >
          <p className="text-lg font-bold text-white">{ordersCount ?? 0}</p>
          <p className="text-xs text-zinc-500">My Orders</p>
        </Link>
        <Link
          href="/orders?tab=selling"
          className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center hover:border-zinc-700 transition-colors"
        >
          <p className="text-lg font-bold text-white">{salesCount ?? 0}</p>
          <p className="text-xs text-zinc-500">My Sales</p>
        </Link>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-lg font-bold text-white">
            {profile.reputation_score?.toFixed(1) || '0.0'}
          </p>
          <p className="text-xs text-zinc-500">Reputation</p>
        </div>
      </div>

      {/* Seller Section — only show if user has listings or sales */}
      {isSeller && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-300">Seller Hub</h3>
            <Link
              href="/marketplace/new"
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
            >
              <Plus className="h-3 w-3" />
              New Listing
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/marketplace/my-listings"
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 hover:border-zinc-600 transition-colors"
            >
              <p className="text-base font-bold text-white">{listingsCount ?? 0}</p>
              <p className="text-xs text-zinc-500">Active Listings</p>
            </Link>
            <Link
              href="/orders?tab=selling"
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 hover:border-zinc-600 transition-colors"
            >
              <p className="text-base font-bold text-white">{salesCount ?? 0}</p>
              <p className="text-xs text-zinc-500">Total Sales</p>
            </Link>
          </div>
        </div>
      )}

      {/* Wallet Card */}
      <Link
        href="/coins"
        className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <Wallet className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Coin Wallet</p>
            <p className="text-xs text-zinc-500">Use coins to unlock novel chapters</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-400">
            {(wallet?.balance ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-zinc-600">coins</p>
        </div>
      </Link>

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

      {/* Pulse Feed */}
      <PulseFeed />

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Explore</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/marketplace"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Marketplace</h4>
            <p className="text-xs text-zinc-500">Buy & sell products</p>
          </Link>
          <Link href="/orders"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Package className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Orders</h4>
            <p className="text-xs text-zinc-500">Track purchases & sales</p>
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
          <Link href="/dashboard/transactions"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700">
            <Wallet className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-2 text-sm font-medium text-white">Transactions</h4>
            <p className="text-xs text-zinc-500">Your financial history</p>
          </Link>
        </div>
      </div>

      {/* Start Selling CTA — only show if not yet a seller */}
      {!isSeller && (
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
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">
              {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
            </h3>
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