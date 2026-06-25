import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Now live at FUNAI
        </div>

        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          The Student Economy
          <span className="text-emerald-400"> Starts Here</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Buy and sell safely. Find campus jobs. Build your reputation.
          CampusWhop is the economic operating system for Nigerian students.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Get Started Free
          </Link>
          <Link
            href="/marketplace"
            className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold px-8 py-3 rounded-lg transition-colors duration-200 border border-border"
          >
            Browse Marketplace
          </Link>
        </div>

        <p className="text-muted-foreground text-sm mt-8">
          Your money is protected until you confirm delivery.
        </p>
      </div>
    </main>
  );
}
