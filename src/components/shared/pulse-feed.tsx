import { getPulseEvents } from "@/lib/actions/pulse";
import PulseTicker from "@/components/shared/pulse-ticker";

export default async function PulseFeed() {
  const events = await getPulseEvents();
  if (events.length === 0) return null;
  return <PulseTicker events={events} />;
}