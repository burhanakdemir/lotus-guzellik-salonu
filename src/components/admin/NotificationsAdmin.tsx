"use client";

import { useEffect, useState } from "react";
import { NOTIFICATION_KIND_LABELS, NotificationKindKey } from "@/lib/notification-labels";

type Member = { id: string; name: string; phone: string; isActive: boolean };

export function NotificationsAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<NotificationKindKey>("INFO");
  const [target, setTarget] = useState<"ALL" | "MEMBER">("ALL");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          kind,
          target,
          userId: target === "MEMBER" ? userId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gönderilemedi.");
        return;
      }
      setMessage(data.message || "Gönderildi.");
      setTitle("");
      setBody("");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="notif-title">
            Başlık
          </label>
          <input
            id="notif-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="notif-body">
            Mesaj
          </label>
          <textarea
            id="notif-body"
            className="input min-h-[120px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="notif-kind">
            Tür
          </label>
          <select
            id="notif-kind"
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as NotificationKindKey)}
          >
            {(Object.keys(NOTIFICATION_KIND_LABELS) as NotificationKindKey[]).map(
              (k) => (
                <option key={k} value={k}>
                  {NOTIFICATION_KIND_LABELS[k]}
                </option>
              )
            )}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="label">Alıcı</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              checked={target === "ALL"}
              onChange={() => setTarget("ALL")}
            />
            Tüm üyeler (aktif + pasif)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              checked={target === "MEMBER"}
              onChange={() => setTarget("MEMBER")}
            />
            Tek üye
          </label>
        </fieldset>

        {target === "MEMBER" && (
          <div>
            <label className="label" htmlFor="notif-member">
              Üye
            </label>
            <select
              id="notif-member"
              className="input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Seçin…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.phone}
                  {!m.isActive ? " (Pasif)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Gönderiliyor…" : "Bildirim Gönder"}
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-500">
        Uygulama içi bildirimler varsayılan olarak açıktır. Tarayıcı bildirimi yalnızca
        izin vermiş üyelere gider.
      </p>
    </div>
  );
}
