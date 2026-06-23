import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VerificationForm } from "@/components/verify/verification-form";

export default async function VerifyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, verification_status")
    .eq("id", user.id)
    .single();

  if (profile?.is_verified) {
    redirect("/feed");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Verify Your Student Identity
          </h1>
          <p className="text-sm text-muted-foreground">
            CampusWhop is a verified student-only marketplace. Complete verification
            to buy, sell, and create courses.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { step: 1, label: "Student ID" },
            { step: 2, label: "Email Verify" },
            { step: 3, label: "Review" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                    i === 0
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {item.step}
                </div>
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
              {i < 2 && (
                <div className="w-12 h-0.5 bg-border mb-5" />
              )}
            </div>
          ))}
        </div>

        <VerificationForm userId={user.id} />
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
