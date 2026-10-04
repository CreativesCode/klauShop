"use client";

import { useEffect } from "react";

/** Registers public/sw.js (offline page, static/image cache) in production only. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}

export default ServiceWorkerRegister;
