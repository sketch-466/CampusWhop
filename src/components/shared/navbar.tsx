'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  User, Settings, LogOut, ChevronDown, ShoppingBag,
  LayoutDashboard, Shield, CreditCard, Store, GraduationCap,
  BarChart2, Zap, Users, Calendar, MessageCircle, Gift,
  BookOpen, Coins, Briefcase, BadgeCheck,
} from 'lucide-react'
import MessagesNavLink from '@/components/shared/messages-nav-link'
import CoinBalance from '@/components/shared/coin-balance'

interface NavbarProps {
  user: {
    full_name: string | null
    avatar_url: string | null
    email: string
    is_admin?: boolean
  }
}

export function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email ?? 'U')[0].toUpperCase()

  const close = () => setDropdownOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-emerald-500">
          CampusWhop
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-white">
              <LayoutDashboard className="inline h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <Link href="/marketplace" className="text-sm text-zinc-400 transition-colors hover:text-white">
              <ShoppingBag className="inline h-4 w-4 mr-1" />
              Products
            </Link>
            <Link href="/creators" className="text-sm text-zinc-400 transition-colors hover:text-white">
              <Users className="inline h-4 w-4 mr-1" />
              Creators
            </Link>
            <Link href="/gigs" className="text-sm text-zinc-400 transition-colors hover:text-white">
              <Zap className="inline h-4 w-4 mr-1" />
              Gigs
            </Link>
            <Link href="/novels" className="text-sm text-zinc-400 transition-colors hover:text-white">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Novels
            </Link>
            <MessagesNavLink />
            <CoinBalance />
          </div>

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
            >
              <Avatar className="h-7 w-7">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.full_name || ''} />
                )}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm text-zinc-300 sm:inline">
                {user.full_name || user.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={close} />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl max-h-[85vh] overflow-y-auto">

                  {/* — Account — */}
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Account</p>
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link href="/messages" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <MessageCircle className="h-4 w-4" />
                    Messages
                  </Link>
                  <Link href="/referrals" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Gift className="h-4 w-4" />
                    Refer & Earn
                  </Link>
                  <Link href="/coins" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Coins className="h-4 w-4" />
                    My Coins
                  </Link>

                  {/* — Mobile-only Browse — */}
                  <div className="my-1 border-t border-zinc-800 sm:hidden" />
                  <div className="px-4 py-1.5 sm:hidden">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Browse</p>
                  </div>
                  <Link href="/marketplace" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <ShoppingBag className="h-4 w-4" />
                    Products
                  </Link>
                  <Link href="/store" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <Store className="h-4 w-4" />
                    Stores
                  </Link>
                  <Link href="/creators" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <Users className="h-4 w-4" />
                    Creators
                  </Link>
                  <Link href="/gigs" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <Zap className="h-4 w-4" />
                    Gigs
                  </Link>
                  <Link href="/opportunities" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <GraduationCap className="h-4 w-4" />
                    Opportunities
                  </Link>
                  <Link href="/novels" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white sm:hidden" onClick={close}>
                    <BookOpen className="h-4 w-4" />
                    Novels
                  </Link>

                  {/* — Selling — */}
                  <div className="my-1 border-t border-zinc-800" />
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Selling</p>
                  </div>
                  <Link href="/seller/setup" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <CreditCard className="h-4 w-4" />
                    Seller Setup
                  </Link>
                  <Link href="/marketplace/my-listings" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <ShoppingBag className="h-4 w-4" />
                    My Listings
                  </Link>
                  <Link href="/store/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Store className="h-4 w-4" />
                    My Store
                  </Link>
                  <Link href="/bookings/services/new" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Briefcase className="h-4 w-4" />
                    My Services
                  </Link>
                  <Link href="/gigs/my-posts" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Zap className="h-4 w-4" />
                    My Gigs
                  </Link>
                  <Link href="/opportunities/my-posts" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <GraduationCap className="h-4 w-4" />
                    My Opportunities
                  </Link>

                  {/* — Buying — */}
                  <div className="my-1 border-t border-zinc-800" />
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Buying</p>
                  </div>
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <ShoppingBag className="h-4 w-4" />
                    My Orders
                  </Link>
                  <Link href="/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Calendar className="h-4 w-4" />
                    My Bookings
                  </Link>
                  <Link href="/subscriptions" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Zap className="h-4 w-4" />
                    Subscriptions
                  </Link>

                  {/* — Analytics — */}
                  <div className="my-1 border-t border-zinc-800" />
                  <div className="px-4 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Analytics</p>
                  </div>
                  <Link href="/profile/analytics" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <BarChart2 className="h-4 w-4" />
                    My Activity
                  </Link>
                  <Link href="/store/dashboard/analytics" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <BarChart2 className="h-4 w-4" />
                    Store Analytics
                  </Link>

                  {/* — Admin — */}
                  {user.is_admin && (
                    <>
                      <div className="my-1 border-t border-zinc-800" />
                      <div className="px-4 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Admin</p>
                      </div>
                      <Link href="/admin/verification" className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300" onClick={close}>
                        <BadgeCheck className="h-4 w-4" />
                        Verification
                      </Link>
                      <Link href="/admin/founders" className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300" onClick={close}>
                        <Shield className="h-4 w-4" />
                        Founding Creators
                      </Link>
                      <Link href="/admin/analytics" className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300" onClick={close}>
                        <Shield className="h-4 w-4" />
                        Platform Analytics
                      </Link>
                    </>
                  )}

                  {/* — Settings — */}
                  <div className="my-1 border-t border-zinc-800" />
                  <Link href="/profile/edit" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={close}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-zinc-800"
                    onClick={() => { close(); signOut() }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}