import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/shared/edit-profile-form";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <EditProfileForm
      profile={{
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        phone_number: profile.phone_number,
        whatsapp_number: profile.whatsapp_number,
        twitter_url: profile.twitter_url,
        linkedin_url: profile.linkedin_url,
        email: user.email ?? "",
        tagline: profile.tagline,
        creator_type: profile.creator_type,
        skills: profile.skills,
        portfolio_url: profile.portfolio_url,
      }}
    />
  );
}