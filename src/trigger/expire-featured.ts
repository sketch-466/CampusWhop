import { schedules } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

export const expireFeatured = schedules.task({
  id: "expire-featured",
  cron: "0 0 * * *",
  run: async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    const [listings, products] = await Promise.all([
      supabase
        .from("listings")
        .update({ is_featured: false, featured_until: null })
        .eq("is_featured", true)
        .lt("featured_until", now),
      supabase
        .from("store_products")
        .update({ is_featured: false, featured_until: null })
        .eq("is_featured", true)
        .lt("featured_until", now),
    ]);

    console.log(`Expired listings: ${listings.count ?? 0}`);
    console.log(`Expired products: ${products.count ?? 0}`);

    return {
      expiredListings: listings.count ?? 0,
      expiredProducts: products.count ?? 0,
    };
  },
});