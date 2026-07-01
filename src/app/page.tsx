import Link from "next/link";
import {
  Briefcase,
  ShoppingBag,
  Store,
  Shield,
  Star,
  Home,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* 1. Navbar */}
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

      {/* 2. Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            The Economic OS for
            <br />
            <span className="text-emerald-500">Nigerian Students</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Earn money, find jobs, sell products, build your business, and grow
            your reputation — all in one platform built for Nigerian university
            students.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Launching at FUNAI · Free to join · No credit card required
          </p>
        </div>
      </section>

      {/* 3. Stats Bar */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { icon: "🎓", label: "1 University" },
            { icon: "💼", label: "Jobs & Gigs" },
            { icon: "🛒", label: "Marketplace" },
            { icon: "🔒", label: "Escrow Protected" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <span className="text-lg">{stat.icon}</span>
              <span className="text-sm font-medium text-zinc-300">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Everything students need to thrive
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Briefcase,
              title: "Campus Jobs",
              description:
                "Find internships, gigs, ambassador roles, and remote work from verified campus employers.",
            },
            {
              icon: ShoppingBag,
              title: "Marketplace",
              description:
                "Buy and sell phones, laptops, books, and services safely with escrow protection.",
            },
            {
              icon: Store,
              title: "Student Stores",
              description:
                "Launch your own storefront, sell products, and build a campus business from your phone.",
            },
            {
              icon: Shield,
              title: "Escrow Payments",
              description:
                "Every transaction is protected. Funds release only when both parties confirm delivery.",
            },
            {
              icon: Star,
              title: "Reputation Engine",
              description:
                "Build a verified track record. Your reputation follows you across every campus.",
            },
            {
              icon: Home,
              title: "Housing Platform",
              description:
                "Find verified hostels, rate landlords, and connect with roommates near your campus.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <feature.icon className="h-8 w-8 text-emerald-500" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Get started in 3 steps
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create your account",
              description:
                "Sign up with your university email or Google account in under a minute.",
            },
            {
              step: "2",
              title: "Complete your profile",
              description:
                "Add your university, matric number, and what you're here to do.",
            },
            {
              step: "3",
              title: "Start earning or buying",
              description:
                "Post a gig, list a product, or browse opportunities on your campus.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Built for students like you
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              quote:
                "CampusWhop is exactly what FUNAI students have been waiting for.",
              name: "Chukwuemeka O.",
              detail: "300 Level, Computer Science, FUNAI",
            },
            {
              quote:
                "Finally a platform where I can sell my design work and actually get paid safely.",
              name: "Adaeze N.",
              detail: "200 Level, Mass Communication, FUNAI",
            },
            {
              quote:
                "The escrow feature alone makes this worth using. No more being scammed.",
              name: "Emeka I.",
              detail: "400 Level, Engineering, FUNAI",
            },
          ].map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <span className="text-2xl text-emerald-500">"</span>
              <p className="text-sm leading-relaxed text-zinc-300">
                {testimonial.quote}
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium text-white">
                  — {testimonial.name}
                </p>
                <p className="text-xs text-zinc-500">{testimonial.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <div className="rounded-2xl bg-emerald-900 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to take control of your campus life?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-emerald-100">
            Join thousands of students building their future on CampusWhop.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-emerald-900 transition-colors hover:bg-zinc-100"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-zinc-800 bg-[#09090b]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Link
                href="/"
                className="text-lg font-bold text-emerald-500"
              >
                CampusWhop
              </Link>
              <p className="mt-2 text-sm text-zinc-500">
                The Economic OS for Nigerian Students.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-zinc-500">
                <li>Jobs</li>
                <li>Marketplace</li>
                <li>Stores</li>
                <li>Housing</li>
                <li>Reputation</li>
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
