"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingService, createBookingSlot } from "@/lib/actions/bookings";

export function NewBookingServiceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [bookingType, setBookingType] = useState<"slot" | "request">("slot");

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotError, setSlotError] = useState<string>();
  const [slotSuccess, setSlotSuccess] = useState<string>();
  const [addingSlot, setAddingSlot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    const priceNum = parseInt(price, 10);
    const durationNum = parseInt(duration, 10);

    if (isNaN(priceNum) || priceNum < 500) {
      setError("Minimum price is ₦500");
      setIsLoading(false);
      return;
    }

    const result = await createBookingService({
      title,
      description,
      duration_minutes: durationNum,
      price: priceNum,
      booking_type: bookingType,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);

    if (bookingType === "request") {
      router.push("/bookings");
      router.refresh();
    }
  };

  const handleAddSlot = async () => {
    if (!createdServiceId && !success) return;
    setSlotError(undefined);
    setSlotSuccess(undefined);
    setAddingSlot(true);

    if (!slotDate || !slotTime) {
      setSlotError("Please pick a date and time");
      setAddingSlot(false);
      return;
    }

    const startsAt = new Date(`${slotDate}T${slotTime}`);
    const endsAt = new Date(
      startsAt.getTime() + parseInt(duration, 10) * 60 * 1000
    );

    const result = await createBookingSlot({
      service_id: createdServiceId!,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    if (result.error) {
      setSlotError(result.error);
    } else {
      setSlotSuccess("Slot added.");
      setSlotDate("");
      setSlotTime("");
    }

    setAddingSlot(false);
  };

  return (
    <div className="mt-6 space-y-6">
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 1-Hour Tutoring Session"
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
              placeholder="What will you do in this session?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₦)</Label>
            <Input
              id="price"
              type="number"
              min={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 3000"
              required
            />
            {price && !isNaN(parseInt(price)) && (
              <p className="text-xs text-zinc-500">
                You receive ₦
                {Math.floor(parseInt(price) * 0.9).toLocaleString()} after
                platform fee.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Booking Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBookingType("slot")}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  bookingType === "slot"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <p className="font-semibold">Fixed Slots</p>
                <p className="mt-0.5 text-xs opacity-70">
                  You set available times
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBookingType("request")}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  bookingType === "request"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <p className="font-semibold">Request-Based</p>
                <p className="mt-0.5 text-xs opacity-70">
                  Buyer proposes a time
                </p>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Service"}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-sm text-emerald-400">
              ✓ Service created. Add your available time slots below.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Add a Time Slot</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="flex-1"
              />
              <Input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="flex-1"
              />
            </div>
            {slotError && <p className="text-xs text-red-400">{slotError}</p>}
            {slotSuccess && (
              <p className="text-xs text-emerald-400">{slotSuccess}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSlot}
              disabled={addingSlot}
              className="w-full"
            >
              {addingSlot ? "Adding..." : "+ Add Slot"}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => {
              router.push("/bookings");
              router.refresh();
            }}
            className="w-full"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}