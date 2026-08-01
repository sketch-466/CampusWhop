import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewBookingServiceForm } from "@/components/shared/new-booking-service-form";

export default async function NewBookingServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_type")
    .eq("id", user.id)
    .single();

  if (!profile?.creator_type) redirect("/profile/edit");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href="/bookings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Link>
      <h1 className="text-2xl font-bold text-white">Create Booking Service</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Offer your time as a bookable service. You receive 90% of every booking.
      </p>
      <NewBookingServiceForm />
    </div>
  );
}