"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSubscriptionPlan } from "@/lib/actions/subscriptions";
import { X } from "lucide-react";

export function NewPlanForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [perkInput, setPerkInput] = useState("");
  const [perks, setPerks] = useState<string[]>([]);

  const addPerk = () => {
    const trimmed = perkInput.trim();
    if (!trimmed || perks.includes(trimmed) || perks.length >= 10) return;
    setPerks([...perks, trimmed]);
    setPerkInput("");
  };

  const removePerk = (p: string) => setPerks(perks.filter((x) => x !== p));

  const handlePerkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addPerk(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum < 500) {
      setError("Minimum price is ₦500");
      setIsLoading(false);
      return;
    }

    const result = await createSubscriptionPlan({
      title,
      description,
      price: priceNum,
      perks,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/subscriptions");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Plan Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Monthly Mentorship"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What do subscribers get?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Monthly Price (₦)</Label>
        <Input
          id="price"
          type="number"
          min={500}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 5000"
          required
        />
        {price && !isNaN(parseInt(price)) && (
          <p className="text-xs text-zinc-500">
            You receive ₦{Math.floor(parseInt(price) * 0.9).toLocaleString()} per month after platform fee.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Perks</Label>
        <div className="flex gap-2">
          <Input
            value={perkInput}
            onChange={(e) => setPerkInput(e.target.value)}
            onKeyDown={handlePerkKeyDown}
            placeholder="e.g. Weekly 1-on-1 call"
            className="flex-1"
            disabled={perks.length >= 10}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addPerk}
            disabled={perks.length >= 10 || !perkInput.trim()}
          >
            Add
          </Button>
        </div>
        {perks.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {perks.map((p) => (
              <li
                key={p}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
              >
                <span>✓ {p}</span>
                <button type="button" onClick={() => removePerk(p)} className="text-zinc-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-500">{perks.length}/10 perks</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Plan"}
      </Button>
    </form>
  );
}