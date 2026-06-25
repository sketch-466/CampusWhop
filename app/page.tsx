import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Briefcase, GraduationCap, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CW</span>
          </div>
          <span className="font-bold text-lg text-gradient">CampusWhop</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
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
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          The <span className="text-gradient">Economic Layer</span>
          <br />
          of Nigerian Campuses
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Earn money, find jobs, sell products, build reputation. Built for students at FUNAI and beyond.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 glow-emerald">
              Join CampusWhop <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/feed">
            <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
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
            <div key={stat.label} className="glass p-4 rounded-xl border border-white/10">
              <stat.icon className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
