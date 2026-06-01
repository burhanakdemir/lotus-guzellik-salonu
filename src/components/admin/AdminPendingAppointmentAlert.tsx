"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  playNewAppointmentAlert,
  unlockAdminAlertAudio,
} from "@/lib/admin-alert-sound";

type WatchState = {
  pendingCount: number;
  latestId: string | null;
  latestCreatedAt: string | null;
};

const POLL_MS = 12_000;

/**
 * Onay bekleyen randevu sayısı / son kayıt değişince uyarı sesi.
 * İlk yüklemede ses çalmaz; tarayıcı için bir kez tıklama ile ses açılır.
 */
export function AdminPendingAppointmentAlert() {
  const baseline = useRef<WatchState | null>(null);
  const polling = useRef(false);

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await fetch("/api/admin/appointments/pending-watch", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as WatchState;
      const prev = baseline.current;

      if (prev !== null) {
        const countUp = data.pendingCount > prev.pendingCount;
        const newLatest =
          data.latestId != null &&
          data.latestId !== prev.latestId &&
          data.pendingCount > 0;
        const newerCreated =
          data.latestCreatedAt != null &&
          prev.latestCreatedAt != null &&
          data.latestCreatedAt > prev.latestCreatedAt;

        if (countUp || newLatest || newerCreated) {
          playNewAppointmentAlert();
        }
      }

      baseline.current = data;
    } catch {
      /* ağ */
    } finally {
      polling.current = false;
    }
  }, []);

  useEffect(() => {
    const unlock = () => unlockAdminAlertAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    void poll();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);

    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [poll]);

  return null;
}
