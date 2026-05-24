"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NOTIFICATION_KIND_LABELS, NotificationKindKey } from "@/lib/notification-labels";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKindKey;
  readAt: string | null;
  createdAt: string;
};

export function MemberNotificationsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/member/notifications");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/member/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/member/notifications/read-all", { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    router.refresh();
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <section id="bildirimler" className="card mt-8 scroll-mt-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-rose-900">Bildirimler</h2>
          <p className="text-xs text-gray-500">
            Salon duyuruları ve bilgilendirmeler
            {unread > 0 ? ` · ${unread} okunmamış` : ""}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-medium text-lotus-600 hover:text-lotus-800"
          >
            Tümünü okundu işaretle
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Henüz bildiriminiz yok.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 text-sm ${
                n.readAt
                  ? "border-lotus-100 bg-white"
                  : "border-lotus-200 bg-lotus-50/80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-lotus-600">
                    {NOTIFICATION_KIND_LABELS[n.kind]}
                  </span>
                  <p className="font-semibold text-lotus-900">{n.title}</p>
                  <time className="text-xs text-gray-400">
                    {format(new Date(n.createdAt), "d MMM yyyy HH:mm", { locale: tr })}
                  </time>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="text-xs text-lotus-600 hover:underline"
                  >
                    Okundu
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-gray-700">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
