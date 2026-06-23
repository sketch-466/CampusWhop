"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Clock,
  MapPin,
  Calendar,
  Wrench,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

interface ServicesDirectoryProps {
  services: any[];
}

const categoryIcons: Record<string, string> = {
  Tutoring: "📚",
  Design: "🎨",
  Coding: "💻",
  Photography: "📸",
  Writing: "✍️",
  "Event Planning": "🎉",
  Fitness: "💪",
  Music: "🎵",
  Other: "🔧",
};

export function ServicesDirectory({ services }: ServicesDirectoryProps) {
  const [selectedService, setSelectedService] = useState<any>(null);

  if (services.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-xl">
        <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No services yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Be the first to offer your skills! Tutoring, design, coding, photography — whatever you're good at.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onSelect={() => setSelectedService(service)}
        />
      ))}

      {/* Booking Modal would go here - simplified for now */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <ServiceDetail service={selectedService} onClose={() => setSelectedService(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, onSelect }: { service: any; onSelect: () => void }) {
  const icon = categoryIcons[service.category] || "🔧";

  return (
    <Card
      className="group border-border bg-card hover:border-emerald-500/30 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onSelect}
    >
      <CardContent className="p-0">
        {/* Portfolio Preview */}
        <div className="relative h-40 bg-muted overflow-hidden">
          {service.portfolio_images?.[0] ? (
            <img
              src={service.portfolio_images[0]}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-950/30 to-muted">
              {icon}
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
              {service.category}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
              {service.title}
            </h3>
            <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
              ₦{service.hourly_rate?.toLocaleString()}/hr
            </span>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-[10px] text-emerald-400">
                {service.provider.full_name?.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {service.provider.full_name}
            </span>
            <VerificationBadge
              status={service.provider.is_verified ? "verified" : "unverified"}
              size="sm"
            />
            {service.provider.reputation_score > 100 && (
              <span className="text-[10px] font-medium text-amber-400 flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400" />
                {Math.round(service.provider.reputation_score / 20)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.availability?.days?.length || 5} days/wk
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Book now
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceDetail({ service, onClose }: { service: any; onClose: () => void }) {
  const icon = categoryIcons[service.category] || "🔧";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{service.title}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>

      {/* Portfolio Gallery */}
      <div className="grid grid-cols-3 gap-2">
        {service.portfolio_images?.map((img: string, i: number) => (
          <img
            key={i}
            src={img}
            alt={`Portfolio ${i + 1}`}
            className="aspect-square rounded-lg object-cover bg-muted"
          />
        )) || (
          <div className="col-span-3 aspect-video rounded-lg bg-muted flex items-center justify-center text-4xl">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="h-10 w-10 rounded-full bg-emerald-950 border border-emerald-500/20 flex items-center justify-center">
          <span className="text-sm text-emerald-400">
            {service.provider.full_name?.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {service.provider.full_name}
            </span>
            <VerificationBadge
              status={service.provider.is_verified ? "verified" : "unverified"}
              size="sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Rep: {service.provider.reputation_score} · Campus Seller
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">About</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Hourly Rate</p>
          <p className="text-lg font-bold text-emerald-400">
            ₦{service.hourly_rate?.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Availability</p>
          <p className="text-sm font-medium text-foreground">
            {service.availability?.days?.join(", ") || "Mon - Fri"}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 border-border" onClick={onClose}>
          Close
        </Button>
        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500">
          <Calendar className="h-4 w-4 mr-2" />
          Book Service
        </Button>
      </div>
    </div>
  );
}
