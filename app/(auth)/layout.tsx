export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">CampusWhop</h1>
          <p className="text-muted-foreground text-sm">The Economic Layer of Nigerian Campuses</p>
        </div>
        {children}
      </div>
    </div>
  );
}
