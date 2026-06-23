"use client";

import { useState } from "react";
import { Flame, Plus, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function CreateDropButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [quantity, setQuantity] = useState(5);
  const [discount, setDiscount] = useState(20);

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("campus_drops").insert({
      seller_id: user.id,
      product_id: productId,
      drop_time: new Date(dropTime).toISOString(),
      quantity,
      discount_percent: discount,
      status: "scheduled",
    });

    if (!error) {
      setOpen(false);
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-rose-600 hover:bg-rose-500">
          <Flame className="h-4 w-4 mr-2" />
          Schedule Drop
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-400" />
            Create Campus Drop
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm">Product ID</Label>
            <Input
              placeholder="Enter product ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Drop Time
            </Label>
            <Input
              type="datetime-local"
              value={dropTime}
              onChange={(e) => setDropTime(e.target.value)}
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                Discount %
              </Label>
              <Input
                type="number"
                min={5}
                max={90}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Quantity
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 p-3">
            <p className="text-xs text-rose-400 font-medium mb-1">Drop Rules</p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>• Drops last exactly 48 hours</li>
              <li>• Limited quantity creates urgency</li>
              <li>• Minimum 5% discount required</li>
              <li>• Verified sellers only</li>
            </ul>
          </div>

          <Button
            className="w-full bg-rose-600 hover:bg-rose-500"
            disabled={!productId || !dropTime || loading}
            onClick={handleSubmit}
          >
            {loading ? "Scheduling..." : "Schedule Drop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
