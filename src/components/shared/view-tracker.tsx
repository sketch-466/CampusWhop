"use client";

import { useEffect, useRef } from "react";
import { trackView } from "@/lib/actions/analytics";

interface ViewTrackerProps {
  entityType: string;
  entityId: string;
  userId: string | null;
}

export default function ViewTracker({
  entityType,
  entityId,
  userId,
}: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    const key = `cw_view_${entityType}_${entityId}`;
    if (sessionStorage.getItem(key)) return;

    tracked.current = true;
    sessionStorage.setItem(key, "1");
    trackView(entityType, entityId, userId);
  }, [entityType, entityId, userId]);

  return null;
}