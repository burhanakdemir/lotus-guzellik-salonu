"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type StaffNotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  appointmentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function StaffNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff-notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: StaffNotificationItem[];
        unread: number;
      };
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function markRead(ids: string[]) {
    const res = await fetch("/api/admin/staff-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      const data = (await res.json()) as { unread: number };
      setUnread(data.unread ?? 0);
      setItems((prev) =>
        prev.map((n) =>
          ids.includes(n.id)
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
    }
  }

  async function markAllRead() {
    const res = await fetch("/api/admin/staff-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      setUnread(0);
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    }
  }

  return (
    <div className="staff-notif-bell" ref={panelRef}>
      <button
        type="button"
        className="staff-notif-bell__btn admin-nav__btn"
        aria-label="Bildirimler"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        🔔
        {unread > 0 && (
          <span className="staff-notif-bell__badge absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[8px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="staff-notif-bell__panel absolute right-0 top-full z-50 mt-1 w-72 rounded border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-2 py-1.5">
            <span className="text-[11px] font-semibold text-lotus-800">
              Bildirimler
            </span>
            {unread > 0 && (
              <button
                type="button"
                className="text-[10px] text-lotus-600 hover:underline"
                onClick={() => markAllRead()}
              >
                Tümünü okundu say
              </button>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {loading && items.length === 0 ? (
              <li className="px-2 py-3 text-[10px] text-gray-500">
                Yükleniyor…
              </li>
            ) : items.length === 0 ? (
              <li className="px-2 py-3 text-[10px] text-gray-500">
                Bildirim yok.
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={
                    n.readAt
                      ? "border-b border-gray-50 opacity-70"
                      : "border-b border-gray-100 bg-amber-50/40"
                  }
                >
                  <Link
                    href={n.link ?? "/admin/randevular"}
                    className="block px-2 py-1.5 hover:bg-lotus-50"
                    onClick={() => {
                      if (!n.readAt) markRead([n.id]);
                      setOpen(false);
                    }}
                  >
                    <p className="text-[10px] font-semibold text-gray-900">
                      {n.title}
                    </p>
                    <p className="text-[9px] text-gray-600 line-clamp-2">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-gray-100 px-2 py-1 text-center">
            <Link
              href="/admin/randevular"
              className="text-[10px] text-lotus-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              Randevulara git →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
