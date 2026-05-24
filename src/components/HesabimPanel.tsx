"use client";

import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HesabimPanel({
  initialEmail,
  children,
}: {
  initialEmail: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(!initialEmail);
  const [modalEmail, setModalEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialEmail) {
      setShowModal(true);
    }
  }, [initialEmail]);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/member/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: modalEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi.");
        return;
      }
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {children}

      {showModal && (
        <div
          className="hesabim-email-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hesabim-email-modal-title"
        >
          <form
            className="card hesabim-email-modal shadow-xl"
            onSubmit={saveEmail}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="hesabim-email-modal-title"
              className="font-display text-2xl text-rose-900"
            >
              E-posta adresinizi girin
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Kampanya ve randevu bilgilendirmeleri için e-posta adresinizi
              ekleyin.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-4">
              <label className="label" htmlFor="member-email">
                E-posta
              </label>
              <input
                id="member-email"
                className="input"
                type="email"
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn-primary mt-4 w-full"
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </form>
        </div>
      )}

      <NotificationPermissionModal blocked={showModal} />
    </>
  );
}
