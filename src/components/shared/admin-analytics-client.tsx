"use client";

import { AdminStats } from "@/lib/actions/analytics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const EMERALD = "#10b981";
const ZINC700 = "#3f3f46";
const COLORS = [EMERALD, "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function fmt(n: number) {
  return `₦${n.toLocaleString()}`;
}

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

export default function AdminAnalyticsClient({ stats }: { stats: AdminStats }) {
  const totalPending =
    stats.pendingApprovals.listings +
    stats.pendingApprovals.jobs +
    stats.pendingApprovals.housing +
    stats.pendingApprovals.stores +
    stats.pendingApprovals.opportunities;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-1">Platform Analytics</h1>
      <p className="text-zinc-400 text-sm mb-6">Live data from CampusWhop</p>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Platform Revenue"
          value={fmt(stats.totalRevenue)}
          sub={`${fmt(stats.revenueThisMonth)} this month`}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          sub={`+${stats.newUsersThisMonth} this month`}
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          sub={`${stats.ordersThisMonth} this month`}
        />
        <StatCard
          label="Pending Approvals"
          value={totalPending}
          sub="across all modules"
        />
      </div>

      {/* ── Pending Breakdown ── */}
      <SectionTitle>Pending Approvals Breakdown</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(stats.pendingApprovals).map(([key, val]) => (
          <div
            key={key}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
          >
            <p className="text-zinc-400 text-xs capitalize">{key}</p>
            <p className="text-emerald-400 text-xl font-bold mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <SectionTitle>Revenue Trend (12 months)</SectionTitle>
      {stats.revenueByMonth.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={ZINC700} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: number) => [fmt(v), "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={EMERALD}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No revenue data yet
        </div>
      )}

      {/* ── New Users Chart ── */}
      <SectionTitle>New Users (12 months)</SectionTitle>
      {stats.newUsersByMonth.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.newUsersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={ZINC700} />
              <XAxis
                dataKey="month"
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
                formatter={(v: number) => [v, "New Users"]}
              />
              <Bar dataKey="count" fill={EMERALD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No user data yet
        </div>
      )}

      {/* ── Orders by Status ── */}
      <SectionTitle>Orders by Status</SectionTitle>
      {stats.ordersByStatus.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={stats.ordersByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
              >
                {stats.ordersByStatus.map((_, i) => (
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
            {stats.ordersByStatus.map((s, i) => (
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
          No orders yet
        </div>
      )}

      {/* ── Module Activity ── */}
      <SectionTitle>Active Content by Module</SectionTitle>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.moduleActivity} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={ZINC700} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="module"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
              }}
              formatter={(v: number) => [v, "Active"]}
            />
            <Bar dataKey="count" fill={EMERALD} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top Sellers ── */}
      <SectionTitle>Top Sellers by Revenue</SectionTitle>
      {stats.topSellers.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 border-b border-zinc-800">
            <span className="text-zinc-400 text-xs">Seller</span>
            <span className="text-zinc-400 text-xs text-center">Orders</span>
            <span className="text-zinc-400 text-xs text-right">Revenue</span>
          </div>
          {stats.topSellers.map((s, i) => (
            <div
              key={s.id}
              className="grid grid-cols-3 px-4 py-3 border-b border-zinc-800 last:border-0 items-center"
            >
              <div>
                <p className="text-white text-sm font-medium truncate">{s.full_name}</p>
                <p className="text-zinc-500 text-xs truncate">{s.email}</p>
              </div>
              <p className="text-zinc-300 text-sm text-center">{s.orders}</p>
              <p className="text-emerald-400 text-sm font-medium text-right">
                {fmt(s.revenue)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No seller data yet
        </div>
      )}

      <div className="h-12" />
    </div>
  );
}