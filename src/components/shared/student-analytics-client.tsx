"use client";

import { StudentStats } from "@/lib/actions/analytics";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const EMERALD = "#10b981";
const ZINC700 = "#3f3f46";
const COLORS = [EMERALD, "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-semibold text-lg mt-8 mb-4">{children}</h2>
  );
}

export default function StudentAnalyticsClient({
  stats,
}: {
  stats: StudentStats;
}) {
  const completionRate =
    stats.ordersPlaced > 0
      ? ((stats.ordersCompleted / stats.ordersPlaced) * 100).toFixed(1)
      : "0.0";

  const applicationData = stats.jobApplicationsByStatus.length > 0
    ? stats.jobApplicationsByStatus
    : [{ status: "No applications yet", count: 1 }];

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-1">My Activity</h1>
      <p className="text-zinc-400 text-sm mb-6">Your CampusWhop footprint</p>

      {/* ── Reputation ── */}
      <div className="bg-zinc-900 border border-emerald-800 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">Reputation Score</p>
          <p className="text-emerald-400 text-4xl font-bold mt-1">
            {stats.reputationScore.toFixed(1)}
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            from {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-6xl">⭐</div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Listings Posted"
          value={stats.listingsPosted}
          sub={`${stats.totalListingViews.toLocaleString()} total views`}
        />
        <StatCard
          label="Jobs Applied"
          value={stats.jobsApplied}
          sub="across all positions"
        />
        <StatCard
          label="Opportunities Saved"
          value={stats.opportunitiesSaved}
          sub="in your saved list"
        />
        <StatCard
          label="Orders Placed"
          value={stats.ordersPlaced}
          sub={`${completionRate}% completion rate`}
        />
      </div>

      {/* ── Listing Views Bar ── */}
      <SectionTitle>Marketplace Activity</SectionTitle>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center py-4">
            <p className="text-zinc-400 text-sm">Listings Posted</p>
            <p className="text-white text-3xl font-bold mt-2">{stats.listingsPosted}</p>
          </div>
          <div className="text-center py-4">
            <p className="text-zinc-400 text-sm">Total Views Earned</p>
            <p className="text-emerald-400 text-3xl font-bold mt-2">
              {stats.totalListingViews.toLocaleString()}
            </p>
          </div>
        </div>
        {stats.listingsPosted > 0 && (
          <div className="mt-2 pt-4 border-t border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              Avg views per listing:{" "}
              <span className="text-white font-medium">
                {(stats.totalListingViews / stats.listingsPosted).toFixed(1)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── Job Applications Pie ── */}
      <SectionTitle>Job Applications by Status</SectionTitle>
      {stats.jobsApplied > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={applicationData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
              >
                {applicationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
                formatter={(v: number, name: string) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {stats.jobApplicationsByStatus.map((s, i) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-zinc-300 text-sm capitalize">{s.status}</span>
                </div>
                <span className="text-white font-medium text-sm">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No job applications yet
        </div>
      )}

      {/* ── Orders Summary ── */}
      <SectionTitle>Orders Summary</SectionTitle>
      {stats.ordersPlaced > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={[
                { label: "Placed", value: stats.ordersPlaced },
                { label: "Completed", value: stats.ordersCompleted },
                {
                  label: "Pending",
                  value: stats.ordersPlaced - stats.ordersCompleted,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={ZINC700} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: number) => [v, "Orders"]}
              />
              <Bar dataKey="value" fill={EMERALD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No orders placed yet
        </div>
      )}

      {/* ── Opportunities ── */}
      <SectionTitle>Opportunities</SectionTitle>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Saved Opportunities</p>
            <p className="text-white text-3xl font-bold mt-1">
              {stats.opportunitiesSaved}
            </p>
          </div>
          <div className="text-5xl">🎯</div>
        </div>
        <a
          href="/opportunities/saved"
          className="mt-4 block text-center text-emerald-400 text-sm border border-emerald-800 rounded-lg py-2 hover:bg-emerald-950 transition-colors"
        >
          View Saved Opportunities →
        </a>
      </div>

      <div className="h-12" />
    </div>
  );
}