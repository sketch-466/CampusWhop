import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Settings, Shield, Bell, CreditCard, User } from "lucide-react";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, notifications, and preferences
        </p>
      </div>

      <SettingsTabs profile={profile} user={user} />
    </div>
  );
}
