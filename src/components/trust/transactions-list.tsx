"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Package,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface TransactionsListProps {
  transactions: any[];
  userId: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  held: {
    label: "In Escrow",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: Clock,
  },
  released: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  disputed: {
    label: "Disputed",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    icon: AlertTriangle,
  },
  refunded: {
    label: "Refunded",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: RotateCcw,
  },
};

export function TransactionsList({ transactions, userId }: TransactionsListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  const handleConfirmDelivery = async (transactionId: string) => {
    setConfirmingDelivery(transactionId);
    const supabase = createClient();

    await supabase
      .from("escrow_transactions")
      .update({ status: "released", released_at: new Date().toISOString() })
      .eq("id", transactionId);

    setConfirmingDelivery(null);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "held", label: "In Escrow" },
          { key: "released", label: "Completed" },
          { key: "disputed", label: "Disputed" },
          { key: "refunded", label: "Refunded" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              filter === f.key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-muted border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 glass rounded-xl">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isBuyer = tx.buyer_id === userId;
            const config = statusConfig[tx.status] || statusConfig.held;
            const Icon = config.icon;

            return (
              <Card
                key={tx.id}
                className={cn(
                  "border-border bg-card hover:border-emerald-500/20 transition-all group",
                  tx.status === "disputed" && "border-rose-500/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                      {tx.order.product.image_url ? (
                        <img
                          src={tx.order.product.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          📦
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-foreground line-clamp-1">
                            {tx.order.product.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isBuyer ? "You bought from" : "You sold to"}{" "}
                            <span className="text-foreground">
                              {isBuyer ? tx.seller.full_name : tx.buyer.full_name}
                            </span>
                          </p>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full border shrink-0",
                            config.bg,
                            config.color,
                            "border-current/20"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="text-[10px] font-bold">{config.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm font-bold text-emerald-400">
                          ₦{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                        {tx.status === "held" && (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Auto-release in 48h
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {tx.status === "held" && isBuyer && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 h-8"
                            onClick={() => handleConfirmDelivery(tx.id)}
                            disabled={confirmingDelivery === tx.id}
                          >
                            {confirmingDelivery === tx.id ? (
                              <span className="animate-pulse">Confirming...</span>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Confirm Delivery
                              </>
                            )}
                          </Button>
                          <Link href={`/trust/disputes?tx=${tx.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                              Raise Dispute
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
