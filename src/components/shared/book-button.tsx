"use client";

import { useState, useTransition } from "react";
import { initiateBooking } from "@/lib/actions/bookings";

interface BookButtonProps {
  serviceId: string;
  bookingType: "slot" | "request";
  slots?: {
    id: string;
    starts_at: string;
    ends_at: string;
    is_booked: boolean;
  }[];
}

export function BookButton({ serviceId, bookingType, slots }: BookButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [proposedTime, setProposedTime] = useState<string>("");
  const [buyerNote, setBuyerNote] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const availableSlots = slots?.filter((s) => !s.is_booked) ?? [];

  const handleBook = () => {
    setError(undefined);

    if (bookingType === "slot" && !selectedSlot) {
      setError("Please select a time slot");
      return;
    }
    if (bookingType === "request" && !proposedTime) {
      setError("Please propose a time");
      return;
    }

    startTransition(async () => {
      const result = await initiateBooking({
        service_id: serviceId,
        slot_id: bookingType === "slot" ? selectedSlot : undefined,
        proposed_time:
          bookingType === "request" ? proposedTime : undefined,
        buyer_note: buyerNote || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
      >
        Book Now
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
      {bookingType === "slot" ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Select a slot</p>
          {availableSlots.length === 0 ? (
            <p className="text-xs text-zinc-500">No available slots.</p>
          ) : (
            <div className="space-y-1.5">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    selectedSlot === slot.id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {new Date(slot.starts_at).toLocaleString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" → "}
                  {new Date(slot.ends_at).toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Propose a time</p>
          <input
            type="datetime-local"
            value={proposedTime}
            onChange={(e) => setProposedTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-400">
          Note for creator (optional)
        </p>
        <textarea
          value={buyerNote}
          onChange={(e) => setBuyerNote(e.target.value)}
          rows={2}
          placeholder="Describe what you need..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleBook}
          disabled={isPending}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Loading..." : "Confirm & Pay"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}