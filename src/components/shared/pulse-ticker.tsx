"use client";

interface PulseEvent {
  id: string;
  message: string;
  emoji: string;
  time: string;
}

export default function PulseTicker({ events }: { events: PulseEvent[] }) {
  const items = [...events, ...events];

  return (
    <div className="w-full overflow-hidden border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm py-2">
      <div className="flex animate-ticker gap-8 whitespace-nowrap">
        {items.map((event, i) => (
          <div
            key={`${event.id}-${i}`}
            className="flex flex-shrink-0 items-center gap-2"
          >
            <span className="text-sm">{event.emoji}</span>
            <span className="text-xs text-zinc-300">{event.message}</span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-600">{event.time}</span>
            <span className="ml-4 text-zinc-700">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}