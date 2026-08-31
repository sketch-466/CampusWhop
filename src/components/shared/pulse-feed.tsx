import { getPulseEvents } from "@/lib/actions/pulse";
import { Activity } from "lucide-react";

export default async function PulseFeed() {
  const events = await getPulseEvents();

  if (events.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <h3 className="text-sm font-semibold text-zinc-300">
          Live Activity
        </h3>
        <span className="ml-auto text-[10px] text-zinc-600">
          Real transactions on CampusWhop
        </span>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3"
          >
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-base">
              {event.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-300 leading-relaxed">
                {event.message}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {event.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}