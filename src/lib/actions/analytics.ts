"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalRevenue: number;
  revenueThisMonth: number;
  totalUsers: number;
  newUsersThisMonth: number;
  totalOrders: number;
  ordersThisMonth: number;
  pendingApprovals: {
    listings: number;
    jobs: number;
    housing: number;
    stores: number;
    opportunities: number;
  };
  ordersByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  newUsersByMonth: { month: string; count: number }[];
  topSellers: {
    id: string;
    full_name: string;
    email: string;
    revenue: number;
    orders: number;
  }[];
  moduleActivity: { module: string; count: number }[];
};

export type SellerStats = {
  totalRevenue: number;
  revenueThisMonth: number;
  totalOrders: number;
  ordersThisMonth: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: {
    id: string;
    title: string;
    views_count: number;
    units_sold: number;
    revenue: number;
  }[];
  revenueByMonth: { month: string; revenue: number }[];
};

export type StudentStats = {
  listingsPosted: number;
  totalListingViews: number;
  jobsApplied: number;
  jobApplicationsByStatus: { status: string; count: number }[];
  opportunitiesSaved: number;
  ordersPlaced: number;
  ordersCompleted: number;
  reputationScore: number;
  totalReviews: number;
};

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

  const { data: allOrders } = await adminClient
    .from("orders")
    .select("amount, platform_fee, status, created_at, seller_id")
    .in("status", ["completed", "delivered"]);

  const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.platform_fee ?? 0), 0) ?? 0;
  const revenueThisMonth = allOrders
    ?.filter((o) => o.created_at >= startOfMonth)
    .reduce((sum, o) => sum + (o.platform_fee ?? 0), 0) ?? 0;

  const { count: totalUsers } = await adminClient
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: newUsersThisMonth } = await adminClient
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth)
    .is("deleted_at", null);

  const { count: totalOrders } = await adminClient
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: ordersThisMonth } = await adminClient
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  const [
    { count: pendingListings },
    { count: pendingJobs },
    { count: pendingStores },
    { count: pendingOpportunities },
  ] = await Promise.all([
    adminClient.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("job_posts").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("stores").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const { data: orderStatusData } = await adminClient
    .from("orders")
    .select("status");

  const statusMap: Record<string, number> = {};
  orderStatusData?.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  const { data: monthlyOrders } = await adminClient
    .from("orders")
    .select("platform_fee, created_at")
    .in("status", ["completed", "delivered"])
    .gte("created_at", twelveMonthsAgo);

  const revenueByMonth = buildMonthlyRevenue(monthlyOrders ?? []);

  const { data: monthlyUsers } = await adminClient
    .from("profiles")
    .select("created_at")
    .gte("created_at", twelveMonthsAgo)
    .is("deleted_at", null);

  const newUsersByMonth = buildMonthlyCount(monthlyUsers ?? []);

  const { data: sellerOrders } = await adminClient
    .from("orders")
    .select("seller_id, platform_fee, amount")
    .in("status", ["completed", "delivered"]);

  const sellerMap: Record<string, { revenue: number; orders: number }> = {};
  sellerOrders?.forEach((o) => {
    if (!o.seller_id) return;
    if (!sellerMap[o.seller_id]) sellerMap[o.seller_id] = { revenue: 0, orders: 0 };
    sellerMap[o.seller_id].revenue += o.platform_fee ?? 0;
    sellerMap[o.seller_id].orders += 1;
  });

  const topSellerIds = Object.entries(sellerMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  let topSellers: AdminStats["topSellers"] = [];
  if (topSellerIds.length > 0) {
    const { data: sellerProfiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", topSellerIds);

    topSellers = (sellerProfiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name ?? "Unknown",
      email: p.email ?? "",
      revenue: sellerMap[p.id]?.revenue ?? 0,
      orders: sellerMap[p.id]?.orders ?? 0,
    }));
  }

  const [
    { count: activeListings },
    { count: activeJobs },
    { count: activeStores },
    { count: activeOpportunities },
  ] = await Promise.all([
    adminClient.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("job_posts").select("*", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const moduleActivity = [
    { module: "Marketplace", count: activeListings ?? 0 },
    { module: "Jobs", count: activeJobs ?? 0 },
    { module: "Stores", count: activeStores ?? 0 },
    { module: "Opportunities", count: activeOpportunities ?? 0 },
  ];

  return {
    totalRevenue,
    revenueThisMonth,
    totalUsers: totalUsers ?? 0,
    newUsersThisMonth: newUsersThisMonth ?? 0,
    totalOrders: totalOrders ?? 0,
    ordersThisMonth: ordersThisMonth ?? 0,
    pendingApprovals: {
      listings: pendingListings ?? 0,
      jobs: pendingJobs ?? 0,
      housing: 0,
      stores: pendingStores ?? 0,
      opportunities: pendingOpportunities ?? 0,
    },
    ordersByStatus,
    revenueByMonth,
    newUsersByMonth,
    topSellers,
    moduleActivity,
  };
}

// ─── SELLER ANALYTICS ────────────────────────────────────────────────────────

export async function getSellerStats(storeId: string): Promise<SellerStats> {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("amount, platform_fee, seller_amount, status, created_at, store_product_id")
    .eq("store_id", storeId);

  const completedOrders = orders?.filter((o) =>
    ["completed", "delivered"].includes(o.status)
  ) ?? [];

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.seller_amount ?? 0), 0);
  const revenueThisMonth = completedOrders
    .filter((o) => o.created_at >= startOfMonth)
    .reduce((sum, o) => sum + (o.seller_amount ?? 0), 0);

  const totalOrders = orders?.length ?? 0;
  const ordersThisMonth = orders?.filter((o) => o.created_at >= startOfMonth).length ?? 0;

  const statusMap: Record<string, number> = {};
  orders?.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  });
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Top products
  const { data: products } = await supabase
    .from("store_products")
    .select("id, title, views_count, units_sold")
    .eq("store_id", storeId)
    .eq("is_deleted", false)
    .order("units_sold", { ascending: false })
    .limit(5);

  const productRevenueMap: Record<string, number> = {};
  completedOrders.forEach((o) => {
    if (!o.store_product_id) return;
    productRevenueMap[o.store_product_id] =
      (productRevenueMap[o.store_product_id] ?? 0) + (o.seller_amount ?? 0);
  });

  const topProducts = (products ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    views_count: p.views_count ?? 0,
    units_sold: p.units_sold ?? 0,
    revenue: productRevenueMap[p.id] ?? 0,
  }));

  // Revenue by month
  const monthlyCompleted = completedOrders.filter((o) => o.created_at >= twelveMonthsAgo);
  const revenueByMonth = buildMonthlyRevenue(
    monthlyCompleted.map((o) => ({ platform_fee: o.seller_amount, created_at: o.created_at }))
  );

  return {
    totalRevenue,
    revenueThisMonth,
    totalOrders,
    ordersThisMonth,
    ordersByStatus,
    topProducts,
    revenueByMonth,
  };
}

// ─── STUDENT ANALYTICS ───────────────────────────────────────────────────────

export async function getStudentStats(userId: string): Promise<StudentStats> {
  const supabase = await createClient();

  const [
    { data: listings },
    { data: applications },
    { count: opportunitiesSaved },
    { data: orders },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("views_count")
      .eq("seller_id", userId)
      .is("deleted_at", null),
    supabase
      .from("job_applications")
      .select("status")
      .eq("applicant_id", userId),
    supabase
      .from("saved_opportunities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("orders")
      .select("status")
      .eq("buyer_id", userId),
    supabase
      .from("profiles")
      .select("reputation_score, total_reviews")
      .eq("id", userId)
      .single(),
  ]);

  const listingsPosted = listings?.length ?? 0;
  const totalListingViews = listings?.reduce((sum, l) => sum + (l.views_count ?? 0), 0) ?? 0;

  const jobsApplied = applications?.length ?? 0;
  const appStatusMap: Record<string, number> = {};
  applications?.forEach((a) => {
    appStatusMap[a.status] = (appStatusMap[a.status] ?? 0) + 1;
  });
  const jobApplicationsByStatus = Object.entries(appStatusMap).map(([status, count]) => ({
    status,
    count,
  }));

  const ordersPlaced = orders?.length ?? 0;
  const ordersCompleted = orders?.filter((o) => o.status === "completed").length ?? 0;

  return {
    listingsPosted,
    totalListingViews,
    jobsApplied,
    jobApplicationsByStatus,
    opportunitiesSaved: opportunitiesSaved ?? 0,
    ordersPlaced,
    ordersCompleted,
    reputationScore: profile?.reputation_score ?? 0,
    totalReviews: profile?.total_reviews ?? 0,
  };
}

// ─── VIEW TRACKING ───────────────────────────────────────────────────────────

export async function trackView(
  entityType: string,
  entityId: string,
  userId: string | null
) {
  const supabase = await createClient();

  await supabase.from("analytics_events").insert({
    event_type: "view",
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
  });

  // Bump views_count on the entity table
  const tableMap: Record<string, string> = {
    listing: "listings",
    job: "job_posts",
    housing: "housing_listings",
    opportunity: "opportunities",
    store_product: "store_products",
  };

  const table = tableMap[entityType];
  if (table) {
    await supabase.rpc("increment_views", { table_name: table, row_id: entityId });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildMonthlyRevenue(
  rows: { platform_fee: number | null; created_at: string }[]
): { month: string; revenue: number }[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const key = r.created_at.slice(0, 7); // "YYYY-MM"
    map[key] = (map[key] ?? 0) + (r.platform_fee ?? 0);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month: formatMonth(month), revenue }));
}

function buildMonthlyCount(
  rows: { created_at: string }[]
): { month: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const key = r.created_at.slice(0, 7);
    map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: formatMonth(month), count }));
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("en", { month: "short", year: "2-digit" });
}