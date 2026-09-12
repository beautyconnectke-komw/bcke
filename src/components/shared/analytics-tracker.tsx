"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const visitorStorageKey = "beauty-connect-visitor-id";
const sessionStorageKey = "beauty-connect-session-id";

function getStoredId(storage: Storage, key: string) {
  const current = storage.getItem(key);
  if (current) return current;

  const next = crypto.randomUUID();
  storage.setItem(key, next);
  return next;
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/worker") ||
      pathname.startsWith("/employer")
    ) {
      return;
    }

    try {
      const visitorId = getStoredId(window.localStorage, visitorStorageKey);
      const sessionId = getStoredId(window.sessionStorage, sessionStorageKey);
      const supabase = createClient();

      void supabase.from("website_visits").insert({
        visitor_id: visitorId,
        session_id: sessionId,
        path: pathname,
      });
    } catch {
      // Analytics must never block public pages or surface configuration details.
    }
  }, [pathname]);

  return null;
}
