import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TransactionsList } from "@/components/trust/transactions-list";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export default async function TransactionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all transactions where user is buyer or seller
  const { data: transactions } = await supabase
    .from("escrow_transactions")
    .select(`
      *,
      order:orders(
        *,
        product:products(title, image_url, price)
      ),
      buyer:profiles!escrow_transactions_buyer_id_fkey(full_name, avatar_url),
      seller:profiles!escrow_transactions_seller_id_fkey(full_name, avatar_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  // Calculate stats
  const totalSpent = transactions
    ?.filter((t) => t.buyer_id === user.id && t.status === "released")
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const totalEarned = transactions
    ?.filter((t) => t.seller_id === user.id && t.status === "released")
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  const inEscrow = transactions
    ?.filter((t) => t.status === "held")
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-emerald-400" />
          My Transactions
        </h1>
        <p className="text-sm text-muted-foreground">
          Track all your escrow-protected purchases and sales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Spent"
          value={`₦${totalSpent.toLocaleString()}`}
          icon={ArrowDownRight}
          color="text-rose-400"
          bg="bg-rose-500/10"
        />
        <StatCard
          label="Total Earned"
          value={`₦${totalEarned.toLocaleString()}`}
          icon={ArrowUpRight}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="In Escrow"
          value={`₦${inEscrow.toLocaleString()}`}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      <TransactionsList transactions={transactions || []} userId={user.id} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-4 rounded-xl glass border-border">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
