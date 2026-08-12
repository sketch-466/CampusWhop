export async function deleteAccount() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Soft delete the profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      full_name: "Deleted User",
      avatar_url: null,
      bio: null,
      phone_number: null,
      whatsapp_number: null,
      twitter_url: null,
      linkedin_url: null,
      portfolio_url: null,
      tagline: null,
      skills: null,
      creator_type: null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Failed to delete account" };
  }

  // Soft delete their listings
  await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "deleted" })
    .eq("seller_id", user.id);

  // Soft delete their store
  await supabase
    .from("stores")
    .update({ is_deleted: true })
    .eq("owner_id", user.id);

  // Sign out
  await supabase.auth.signOut();

  // Delete the auth user via admin client
  await adminClient.auth.admin.deleteUser(user.id);

  revalidatePath("/");
  redirect("/login");
}