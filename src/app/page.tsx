import Link from "next/link";
import {
  ShoppingBag,
  Store,
  Shield,
  Star,
  ArrowRight,
  Users,
  Calendar,
  Zap,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-emerald-500">
            CampusWhop
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-md px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
            🚀 Now live at FUNAI · Free to join
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Where FUNAI Students
<br />
<span className="text-emerald-500">Make Money</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Sell your skills, products, and services to fellow students. Get paid safely with escrow. Build a reputation that follows you beyond campus.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Browse Creators
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            No credit card required · Takes 2 minutes to set up
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: "🎓", label: "FUNAI Launch Campus" },
            { icon: "💳", label: "Escrow Protected" },
            { icon: "⚡", label: "Instant Digital Delivery" },
            { icon: "🔄", label: "Recurring Subscriptions" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium text-zinc-300">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Every tool a student entrepreneur needs
          </h2>
          <p className="mt-3 text-zinc-400">
            Built specifically for Nigerian university students who want to make money.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Creator Profiles",
              description:
                "Set up your creator page, showcase your skills, and get discovered by students who need to hire someone like you.",
            },
            {
              icon: ShoppingBag,
              title: "Marketplace",
              description:
                "Buy and sell physical and digital products. Payments are held in escrow and released when delivery is confirmed.",
            },
            {
              icon: Calendar,
              title: "Booking System",
              description:
                "Offer sessions as a tutor, designer, or consultant. Students book your time and pay upfront — you confirm and deliver.",
            },
            {
              icon: TrendingUp,
              title: "Subscriptions",
              description:
                "Create monthly subscription plans. Charge students for recurring access to your content, mentorship, or services.",
            },
            {
              icon: Store,
              title: "Student Stores",
              description:
                "Launch your own branded storefront. Sell multiple products, manage inventory, and build a campus brand.",
            },
            {
              icon: Zap,
              title: "Gigs Board",
              description:
                "Post freelance gigs or find paid work. Connect students who need services with creators who offer them.",
            },
            {
              icon: BookOpen,
              title: "Opportunities Hub",
              description:
                "Find scholarships, grants, competitions, and internships — all curated and relevant to Nigerian university students.",
            },
            {
              icon: Shield,
              title: "Escrow Payments",
              description:
                "Every transaction is protected. Funds only release when both parties are satisfied. No more getting scammed.",
            },
            {
              icon: Star,
              title: "Reputation Engine",
              description:
                "Build a verified track record across every sale, booking, and gig. Your reputation is your most valuable asset.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <feature.icon className="h-7 w-7 text-emerald-500" />
              <h3 className="mt-4 text-base font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is this for */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl mb-10">
          Built for every kind of student entrepreneur
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { emoji: "🎨", type: "Designers", action: "Sell design packages, take bookings, run a monthly retainer" },
            { emoji: "📚", type: "Tutors", action: "Offer fixed time slots, charge per session, build a subscriber base" },
            { emoji: "📸", type: "Photographers", action: "Post your portfolio, accept bookings, get paid upfront" },
            { emoji: "💻", type: "Developers", action: "Offer consultation calls, sell templates, take project requests" },
            { emoji: "✍️", type: "Writers", action: "Sell articles, offer content subscriptions, take writing gigs" },
            { emoji: "🎵", type: "Musicians", action: "Sell beats, offer lessons, run a monthly content subscription" },
          ].map((item) => (
            <div
              key={item.type}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5"
            >
              <span className="text-2xl">{item.emoji}</span>
              <h3 className="mt-3 font-semibold text-white">{item.type}</h3>
              <p className="mt-1 text-sm text-zinc-400">{item.action}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl mb-10">
          Up and running in 3 steps
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create your account",
              description: "Sign up with your university email or Google. Takes under 2 minutes.",
            },
            {
              step: "2",
              title: "Set up your creator profile",
              description: "Add your skills, tagline, and what you offer. Get discovered immediately.",
            },
            {
              step: "3",
              title: "Start earning",
              description: "Post a listing, create a booking service, or launch a subscription plan.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center sm:px-12">
    <h2 className="text-2xl font-bold text-white sm:text-3xl">
      Just getting started — and that&apos;s the point.
    </h2>
    <p className="mx-auto mt-4 max-w-xl text-zinc-400 leading-relaxed">
      CampusWhop is launching now at FUNAI. The first students to join will be the ones who shape what this becomes. No fake reviews. No inflated numbers. Just a platform built for you, launching with you.
    </p>
    <Link
      href="/register"
      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
    >
      Join as a Founding Member
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
</section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <div className="rounded-2xl bg-emerald-900/40 border border-emerald-800/50 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Your campus business starts today
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-300">
            Join FUNAI students already selling, booking, and earning on CampusWhop.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-zinc-500">Free forever for students · No credit card needed</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#09090b]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Link href="/" className="text-lg font-bold text-emerald-500">
                CampusWhop
              </Link>
              <p className="mt-2 text-sm text-zinc-500">
                The Operating System for African Student Entrepreneurs.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300">Platform</h4>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li><Link href="/marketplace" className="hover:text-zinc-300">Marketplace</Link></li>
                <li><Link href="/creators" className="hover:text-zinc-300">Creators</Link></li>
                <li><Link href="/store" className="hover:text-zinc-300">Stores</Link></li>
                <li><Link href="/gigs" className="hover:text-zinc-300">Gigs</Link></li>
                <li><Link href="/opportunities" className="hover:text-zinc-300">Opportunities</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li>About</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
            © 2026 CampusWhop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}