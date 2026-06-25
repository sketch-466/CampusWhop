import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Briefcase, GraduationCap, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <span className="font-bold text-lg text-emerald-400">CampusWhop</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
          The <span className="text-emerald-400">Economic Layer</span>
          <br />
          of Nigerian Campuses
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Earn money, find jobs, sell products, build reputation. Built for students at FUNAI and beyond.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8">
              Join CampusWhop <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/feed">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Explore Feed
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {[
            { icon: ShoppingBag, label: "Products Sold", value: "1,200+" },
            { icon: Briefcase, label: "Jobs Posted", value: "500+" },
            { icon: GraduationCap, label: "Students", value: "3,000+" },
            { icon: TrendingUp, label: "Transactions", value: "₦50M+" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl">
              <stat.icon className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
