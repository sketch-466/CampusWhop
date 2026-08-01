"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmBooking,
  declineBooking,
  completeBooking,
  cancelBooking,
} from "@/lib/actions/bookings";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  role: "buying" | "selling";
}

export function BookingActions({
  bookingId,
  status,
  role,
}: BookingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [error, setError] = useState<string>();

  const handle = (action: string, fn: () => Promise<{ error?: string }>) => {
    setLoadingAction(action);
    setError(undefined);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else router.refresh();
      setLoadingAction(null);
    });
  };

  if (role === "selling") {
    if (status === "pending") {
      return (
        <div className="space-y-2 border-t border-zinc-800 px-3 py-2">
          {error && <p className="text-xs text-red-400">{error}</p>}

          {!showConfirmForm && !showDeclineForm && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmForm(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                ✓ Confirm
              </button>
              <button
                onClick={() => setShowDeclineForm(true)}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
              >
                Decline
              </button>
            </div>
          )}

          {showConfirmForm && (
            <div className="space-y-2">
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Meeting link (optional)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handle("confirm", () =>
                      confirmBooking(bookingId, meetingLink)
                    )
                  }
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loadingAction === "confirm" ? "Confirming..." : "Confirm"}
                </button>
                <button
                  onClick={() => setShowConfirmForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showDeclineForm && (
            <div className="space-y-2">
              <input
                type="text"
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handle("decline", () =>
                      declineBooking(bookingId, declineNote)
                    )
                  }
                  disabled={isPending}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {loadingAction === "decline" ? "Declining..." : "Decline"}
                </button>
                <button
                  onClick={() => setShowDeclineForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (status === "confirmed") {
      return (
        <div className="border-t border-zinc-800 px-3 py-2">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={() =>
              handle("complete", () => completeBooking(bookingId))
            }
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === "complete" ? "Completing..." : "Mark Completed"}
          </button>
        </div>
      );
    }
  }

  if (role === "buying" && status === "pending") {
    return (
      <div className="border-t border-zinc-800 px-3 py-2">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={() =>
            handle("cancel", () => cancelBooking(bookingId))
          }
          disabled={isPending}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          {loadingAction === "cancel" ? "Cancelling..." : "Cancel Booking"}
        </button>
      </div>
    );
  }

  return null;
}