"use client";

import { useState } from "react";

const btnGold = "btn-gold !py-2.5 !px-6 !text-xs";

export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function closeModal() {
    setOpen(false);
    setError("");
    setSuccess("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/member/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Şifre güncellenemedi.");
        return;
      }
      setSuccess("Şifreniz güncellendi.");
      setTimeout(closeModal, 1200);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={btnGold}
      >
        Şifre Değiştir
      </button>

      {open && (
        <div
          className="hesabim-email-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-modal-title"
        >
          <form
            className="card hesabim-email-modal shadow-xl"
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="change-password-modal-title"
              className="font-display text-3xl font-bold tracking-tight text-lotus-900"
            >
              Şifre Değiştir
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Güvenliğiniz için güçlü bir şifre seçin (en az 6 karakter).
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {success}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="modal-new-password">
                  Yeni şifre
                </label>
                <input
                  id="modal-new-password"
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label" htmlFor="modal-confirm-password">
                  Yeni şifre (tekrar)
                </label>
                <input
                  id="modal-confirm-password"
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className={`${btnGold} flex-1`}
                disabled={loading}
              >
                {loading ? "Kaydediliyor…" : "Şifreyi Güncelle"}
              </button>
              <button
                type="button"
                className={btnGold}
                onClick={closeModal}
                disabled={loading}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
