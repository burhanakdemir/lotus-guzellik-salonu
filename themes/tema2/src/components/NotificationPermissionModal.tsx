"use client";

import { useEffect, useState } from "react";
import {
  isPushSupported,
  requestAndRegisterPush,
} from "@/lib/push-client";

type Prefs = {
  pushEnabled: boolean;
  vapidPublicKey: string;
};

export function NotificationPermissionModal({ blocked = false }: { blocked?: boolean }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/member/notification-preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (!data) return;
        setPrefs(data);

        if (
          data.pushEnabled ||
          !data.vapidPublicKey ||
          !isPushSupported() ||
          Notification.permission !== "granted"
        ) {
          return;
        }

        try {
          await requestAndRegisterPush(data.vapidPublicKey);
          setPrefs({ ...data, pushEnabled: true });
        } catch {
          /* kullanıcı modal üzerinden tekrar denesin */
        }
      })
      .finally(() => setReady(true));
  }, []);

  async function enableNotifications() {
    setLoading(true);
    setError("");

    try {
      if (prefs?.vapidPublicKey && isPushSupported()) {
        await requestAndRegisterPush(prefs.vapidPublicKey);
        setPrefs((p) => (p ? { ...p, pushEnabled: true } : p));
        return;
      }

      if (isPushSupported()) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Bildirim izni verilmedi.");
        }
        if (prefs?.vapidPublicKey) {
          await requestAndRegisterPush(prefs.vapidPublicKey);
        }
        setPrefs((p) => (p ? { ...p, pushEnabled: true } : p));
        return;
      }

      throw new Error("Bu tarayıcı bildirim desteklemiyor.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Bildirim açılamadı.";
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setError(
          "Bildirim izni tarayıcıda engellenmiş. Adres çubuğundaki site ayarlarından bildirimlere izin verin."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  const canPrompt =
    ready && prefs && !prefs.pushEnabled && !blocked && !sessionDismissed;

  if (!canPrompt) return null;

  const pushReady = isPushSupported() && Boolean(prefs.vapidPublicKey);

  return (
    <div
      className="hesabim-email-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-permission-title"
    >
      <div
        className="card hesabim-email-modal shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lotus-100 text-lotus-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M15 17H9l-1 2h8l-1-2z" />
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          </svg>
        </div>

        <h2
          id="notification-permission-title"
          className="font-display text-2xl text-rose-900"
        >
          Bildirimlere izin verin
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Kampanya, randevu hatırlatmaları ve salon duyurularından anında haberdar
          olmak için bildirimlere izin verin.
        </p>

        {!pushReady && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Uygulama içi bildirimler hesabınızda görünür. Tarayıcı bildirimi için
            sunucu yapılandırması tamamlandığında bu ekrandan izin verebilirsiniz.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={enableNotifications}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? "Açılıyor…" : "Bildirimlere İzin Ver"}
          </button>
          <button
            type="button"
            onClick={() => setSessionDismissed(true)}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Şimdi değil
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Uygulama içi bildirimler zaten açıktır.
        </p>
      </div>
    </div>
  );
}
