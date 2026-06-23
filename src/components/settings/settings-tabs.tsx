"use client";

import { useState } from "react";
import { User, Bell, Shield, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  profile: any;
  user: any;
}

export function SettingsTabs({ profile, user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    university: profile?.university || "",
    department: profile?.department || "",
  });

  const [notifications, setNotifications] = useState({
    sales: true,
    messages: true,
    drops: true,
    disputes: true,
    email_digest: false,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update(formData)
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-emerald-400" : "")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-950 border-2 border-emerald-500/20 flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-400">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">Coming soon: upload avatar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Bio</Label>
            <Input
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell campus about yourself..."
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234..."
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">University</Label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : null}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="glass rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Push Notifications</h3>

          {[
            { key: "sales", label: "Sales & Purchases", desc: "When someone buys your item or you make a purchase" },
            { key: "messages", label: "Messages", desc: "New direct messages from buyers or sellers" },
            { key: "drops", label: "Campus Drops", desc: "Flash sales from sellers you follow" },
            { key: "disputes", label: "Disputes", desc: "Updates on your dispute cases" },
            { key: "email_digest", label: "Weekly Email Digest", desc: "Summary of your campus activity" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, [item.key]: checked })
                }
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          ))}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="glass rounded-xl p-6 space-y-5">
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Account Secure</p>
                <p className="text-xs text-muted-foreground">
                  Your account is protected with Supabase Auth
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Email</Label>
            <Input value={user.email} disabled className="bg-muted/50 border-border opacity-60" />
          </div>

          <div className="pt-4 border-t border-border">
            <Button variant="outline" className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10">
              Sign Out All Devices
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
