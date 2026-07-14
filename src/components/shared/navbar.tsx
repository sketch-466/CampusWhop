"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShoppingBag,
  LayoutDashboard,
  Shield,
  CreditCard,
  Briefcase,
  Home,
  Store,
} from "lucide-react";

interface NavbarProps {
  user: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
    is_admin?: boolean;
  };
}

export function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email ?? "U")[0].toUpperCase();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-emerald-500">
          CampusWhop
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <LayoutDashboard className="inline h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <Link
              href="/marketplace"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ShoppingBag className="inline h-4 w-4 mr-1" />
              Marketplace
            </Link>
            <Link
              href="/housing"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Home className="inline h-4 w-4 mr-1" />
              Housing
            </Link>
            <Link
              href="/jobs"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Briefcase className="inline h-4 w-4 mr-1" />
              Jobs
            </Link>
            <Link
              href="/store/dashboard"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <Store className="inline h-4 w-4 mr-1" />
              Store
            </Link>
            {user.is_admin && (
              <Link
                href="/admin/listings"
                className="text-sm text-amber-400 transition-colors hover:text-amber-300"
              >
                <Shield className="inline h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
            >
              <Avatar className="h-7 w-7">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.full_name || ""} />
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
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
                  
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    href="/marketplace"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Marketplace
                  </Link>

                  <Link
                    href="/housing"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    Housing
                  </Link>

                  <Link
                    href="/jobs"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Briefcase className="h-4 w-4" />
                    Jobs
                  </Link>

                  <Link
                    href="/store/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Store className="h-4 w-4" />
                    My Store
                  </Link>

                  <Link
                    href="/seller/setup"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Seller Setup
                  </Link>

                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    My Orders
                  </Link>

                  <Link
                    href="/store/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Store className="h-4 w-4" />
                    My Store
                  </Link>

                  <Link
                    href="/jobs/applications"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Briefcase className="h-4 w-4" />
                    My Applications
                  </Link>

                  <Link
                    href="/jobs/my-posts"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Briefcase className="h-4 w-4" />
                    My Job Posts
                  </Link>

                  {user.is_admin && (
                    <Link
                      href="/admin/listings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-zinc-800 hover:text-amber-300"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-800"
                    onClick={handleSignOut}
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
  );
}
