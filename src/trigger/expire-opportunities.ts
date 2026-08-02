import { schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

export const expireOpportunities = schedules.task({
  id: "expire-opportunities",
  cron: "0 0 * * *", // midnight every day
  run: async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("opportunities")
      .update({
        status: "closed",
        updated_at: now,
      })
      .eq("status", "active")
      .lt("deadline", now)
      .select("id, title");

    if (error) {
      console.error("Failed to expire opportunities:", error.message);
      throw new Error(error.message);
    }

    console.log(`Expired ${data?.length ?? 0} opportunities`);
    return { expired: data?.length ?? 0 };
  },
});