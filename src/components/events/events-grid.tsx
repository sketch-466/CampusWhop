"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Ticket, Clock, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface EventsGridProps {
  events: any[];
  isUpcoming: boolean;
}

export function EventsGrid({ events, isUpcoming }: EventsGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-xl">
        <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No events to show</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isUpcoming={isUpcoming} />
      ))}
    </div>
  );
}

function EventCard({ event, isUpcoming }: { event: any; isUpcoming: boolean }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isUpcoming) return;
    const interval = setInterval(() => {
      const diff = new Date(event.event_date).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("Starting now!");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h`);
    }, 1000);
    return () => clearInterval(interval);
  }, [event.event_date, isUpcoming]);

  const isFree = !event.ticket_price || event.ticket_price === 0;

  return (
    <Card
      className={cn(
        "group overflow-hidden border transition-all duration-300",
        isUpcoming
          ? "border-border bg-card hover:border-emerald-500/30"
          : "border-border/50 bg-muted/30 opacity-75"
      )}
    >
      {/* Banner */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {event.banner_image_url ? (
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-950/20 to-blue-950/20">
            <span className="text-4xl">🎓</span>
          </div>
        )}

        {isUpcoming && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
            <Clock className="h-3 w-3" />
            {timeLeft}
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold",
              isFree
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            )}
          >
            {isFree ? "FREE" : `₦${event.ticket_price.toLocaleString()}`}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
          {event.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {event.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {new Date(event.event_date).toLocaleDateString("en-NG", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {event.max_attendees
                ? `${event.max_attendees} max capacity`
                : "Unlimited capacity"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-[10px] text-emerald-400">
                {event.organizer.full_name?.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {event.organizer.full_name}
            </span>
            <VerificationBadge
              status={event.organizer.is_verified ? "verified" : "unverified"}
              size="sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-400"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            {isUpcoming && (
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 px-3"
              >
                <Ticket className="h-3 w-3 mr-1" />
                {isFree ? "RSVP" : "Get Ticket"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
