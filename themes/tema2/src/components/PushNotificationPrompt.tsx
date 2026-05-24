"use client";

import { useEffect, useState } from "react";
import {
  isPushSupported,
  requestAndRegisterPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type Prefs = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  vapidPublicKey: string;
};

export function PushNotificationPrompt() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    setPushSupported(isPushSupported());

    fetch("/api/member/notification-preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPrefs(data))
      .catch(() => {});
  }, []);

  async function enablePush() {
    if (!prefs?.vapidPublicKey) {
      setError("Tarayıcı bildirimi sunucuda yapılandırılmamış.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestAndRegisterPush(prefs.vapidPublicKey);
      setPrefs((p) => (p ? { ...p, pushEnabled: true } : p));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirim açılamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function disablePush() {
    setLoading(true);
    setError("");
    try {
      const endpoint = await unsubscribeFromPush();
      await fetch("/api/member/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      setPrefs((p) => (p ? { ...p, pushEnabled: false } : p));
    } catch {
      setError("Bildirim kapatılamadı.");
    } finally {
      setLoading(false);
    }
  }

  if (!prefs) return null;

  return (
    <section className="card mt-8 border-lotus-200/80 bg-lotus-50/40">
      <h2 className="font-semibold text-rose-900">Bildirim Ayarları</h2>
      <p className="mt-1 text-sm text-gray-600">
        Uygulama içi bildirimler otomatik açıktır. Tarayıcı bildirimlerini buradan
        açıp kapatabilirsiniz.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800">
          Uygulama içi: Açık
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-medium ${
            prefs.pushEnabled
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Tarayıcı: {prefs.pushEnabled ? "Açık" : "Kapalı"}
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {pushSupported && prefs.vapidPublicKey && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!prefs.pushEnabled ? (
            <button
              type="button"
              onClick={enablePush}
              disabled={loading}
              className="btn-primary !py-2 !px-4 !text-xs"
            >
              {loading ? "Açılıyor…" : "Tarayıcı Bildirimlerini Aç"}
            </button>
          ) : (
            <button
              type="button"
              onClick={disablePush}
              disabled={loading}
              className="btn-secondary !py-2 !px-4 !text-xs"
            >
              Tarayıcı Bildirimlerini Kapat
            </button>
          )}
        </div>
      )}

      {pushSupported && !prefs.vapidPublicKey && (
        <p className="mt-3 text-xs text-gray-500">
          Tarayıcı bildirimleri henüz yapılandırılmadı; uygulama içi bildirimler
          kullanılabilir.
        </p>
      )}

      {!pushSupported && (
        <p className="mt-3 text-xs text-gray-500">
          Bu tarayıcı push bildirimini desteklemiyor. Uygulama içi bildirimler
          kullanılabilir.
        </p>
      )}
    </section>
  );
}
