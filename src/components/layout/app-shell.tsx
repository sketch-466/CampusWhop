"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { User } from "@supabase/supabase-js";

interface AppShellProps {
  user: User;
  profile: any;
  children: React.ReactNode;
}

export function AppShell({ user, profile, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNav
        user={user}
        profile={profile}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar user={user} profile={profile} />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border animate-in slide-in-from-left duration-200">
            <Sidebar
              user={user}
              profile={profile}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
