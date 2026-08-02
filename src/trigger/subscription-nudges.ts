import { schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const subscriptionNudges = schedules.task({
  id: "subscription-nudges",
  cron: "0 9 * * *", // 9am every day
  run: async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY!);

    // Find subscriptions expiring in the next 3 days
    const now = new Date();
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        current_period_end,
        subscription_plans(title, price),
        subscriber:profiles!subscriptions_subscriber_id_fkey(full_name, email),
        creator:profiles!subscriptions_creator_id_fkey(full_name)
      `)
      .in("status", ["active", "non-renewing"])
      .lte("current_period_end", in3days.toISOString())
      .gte("current_period_end", now.toISOString());

    if (error) {
      console.error("Failed to fetch expiring subscriptions:", error.message);
      throw new Error(error.message);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions expiring soon");
      return { nudged: 0 };
    }

    let nudged = 0;

    for (const sub of subscriptions) {
      const plan = Array.isArray(sub.subscription_plans)
        ? sub.subscription_plans[0]
        : sub.subscription_plans;
      const subscriber = Array.isArray(sub.subscriber)
        ? sub.subscriber[0]
        : sub.subscriber;
      const creator = Array.isArray(sub.creator)
        ? sub.creator[0]
        : sub.creator;

      if (!subscriber?.email) continue;

      const expiryDate = sub.current_period_end
        ? new Date(sub.current_period_end).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "soon";

      const isNonRenewing = sub.status === "non-renewing";

      await resend.emails.send({
        from: "noreply@campuswhop.com",
        to: subscriber.email,
        subject: isNonRenewing
          ? `Your subscription to "${plan?.title}" is ending soon`
          : `Your subscription to "${plan?.title}" renews on ${expiryDate}`,
        html: `
          <h2>${isNonRenewing ? "Subscription Ending" : "Subscription Renewal"}</h2>
          <p>Hi ${subscriber.full_name ?? "there"},</p>
          ${
            isNonRenewing
              ? `<p>Your subscription to <strong>${plan?.title ?? "the plan"}</strong> by <strong>${creator?.full_name ?? "your creator"}</strong> will end on <strong>${expiryDate}</strong> and will not renew.</p>
                 <p>If you'd like to continue, you can resubscribe from their <a href="https://campuswhop.com/creators">creator page</a>.</p>`
              : `<p>Your subscription to <strong>${plan?.title ?? "the plan"}</strong> by <strong>${creator?.full_name ?? "your creator"}</strong> will automatically renew on <strong>${expiryDate}</strong> for <strong>₦${plan?.price?.toLocaleString()}</strong>.</p>
                 <p>To cancel before renewal, visit <a href="https://campuswhop.com/subscriptions">your subscriptions</a>.</p>`
          }
          <p>Thanks for supporting student creators on CampusWhop.</p>
        `,
      });

      nudged++;
    }

    console.log(`Sent nudges for ${nudged} subscriptions`);
    return { nudged };
  },
});