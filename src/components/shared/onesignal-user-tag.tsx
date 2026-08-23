"use client";

import { useEffect } from "react";

export default function OneSignalUserTag({ userId }: { userId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    // @ts-ignore
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.login(userId);
      await OneSignal.User.addTag("user_id", userId);
    });
  }, [userId]);
  
  return null;
}