"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  PENDING_ALERT_DURATION_MS,
  PENDING_ALERT_REPEAT_MS,
  playPendingApprovalAlert,
  stopPendingApprovalAlert,
  unlockAdminAlertAudio,
} from "@/lib/admin-alert-sound";

type WatchState = {
  pendingCount: number;
  latestId: string | null;
  latestCreatedAt: string | null;
};

/** Onay anında yakalamak için sık poll; 5 dk tekrar client tarafında */
const POLL_MS = 8_000;

/**
 * Onay bekleyen randevu varken 15 sn uyarı; onaylanmazsa 5 dk'da bir tekrar.
 * Onay verilince veya bekleyen kalmayınca ses durur.
 */
export function AdminPendingAppointmentAlert() {
  const baseline = useRef<WatchState | null>(null);
  const polling = useRef(false);
  const audioReady = useRef(false);
  const isPlaying = useRef(false);
  const lastCycleStart = useRef(0);

  const beginAlertCycle = useCallback((reason: "initial" | "new" | "repeat") => {
    if (!audioReady.current) return;

    const now = Date.now();
    if (
      reason === "repeat" &&
      (isPlaying.current || now - lastCycleStart.current < PENDING_ALERT_REPEAT_MS)
    ) {
      return;
    }

    if (reason === "new") {
      stopPendingApprovalAlert();
      isPlaying.current = false;
    } else if (isPlaying.current) {
      return;
    }

    lastCycleStart.current = now;
    isPlaying.current = true;

    playPendingApprovalAlert(PENDING_ALERT_DURATION_MS, () => {
      isPlaying.current = false;
    });
  }, []);

  const handleWatchState = useCallback(
    (data: WatchState, prev: WatchState | null) => {
      if (data.pendingCount === 0) {
        stopPendingApprovalAlert();
        isPlaying.current = false;
        lastCycleStart.current = 0;
        baseline.current = data;
        return;
      }

      if (prev === null) {
        baseline.current = data;
        if (data.pendingCount > 0) {
          beginAlertCycle("initial");
        }
        return;
      }

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
        beginAlertCycle("new");
        baseline.current = data;
        return;
      }

      baseline.current = data;

      const now = Date.now();
      if (
        !isPlaying.current &&
        (lastCycleStart.current === 0 ||
          now - lastCycleStart.current >= PENDING_ALERT_REPEAT_MS)
      ) {
        beginAlertCycle("repeat");
      }
    },
    [beginAlertCycle]
  );

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true;
    try {
      const res = await fetch("/api/admin/appointments/pending-watch", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as WatchState;
      handleWatchState(data, baseline.current);
    } catch {
      /* ağ */
    } finally {
      polling.current = false;
    }
  }, [handleWatchState]);

  useEffect(() => {
    const unlock = () => {
      unlockAdminAlertAudio();
      audioReady.current = true;
      void poll();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    void poll();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);

    return () => {
      clearInterval(id);
      stopPendingApprovalAlert();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [poll]);

  return null;
}
