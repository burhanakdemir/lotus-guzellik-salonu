"use client";

import { useState } from "react";

export function AdminTotpSettings({
  initialEnabled,
  enabledAt,
}: {
  initialEnabled: boolean;
  enabledAt: string | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [enabledAtState, setEnabledAtState] = useState(enabledAt);
  const [step, setStep] = useState<"idle" | "setup" | "reset">("idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [setupSeal, setSetupSeal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setStep("idle");
    setPassword("");
    setCode("");
    setResetCode("");
    setQrDataUrl(null);
    setSetupSeal("");
    setError("");
  }

  async function startSetup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kurulum başlatılamadı.");
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setSetupSeal(data.setupSeal);
      setStep("setup");
    } finally {
      setLoading(false);
    }
  }

  async function completeSetup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, setupSeal, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Etkinleştirilemedi.");
        return;
      }
      setEnabled(true);
      setEnabledAtState(new Date().toISOString());
      resetForm();
    } finally {
      setLoading(false);
    }
  }

  async function removeTotp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/totp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: resetCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaldırılamadı.");
        return;
      }
      setEnabled(false);
      setEnabledAtState(null);
      setResetCode("");
      setCode("");
      const res2 = await fetch("/api/admin/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data2 = await res2.json();
      if (!res2.ok) {
        setError(data2.error || "Yeni QR oluşturulamadı.");
        setStep("idle");
        return;
      }
      setQrDataUrl(data2.qrDataUrl);
      setSetupSeal(data2.setupSeal);
      setStep("setup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="!mb-0 text-base">Google Authenticator</h2>
      <p className="text-xs text-gray-500">
        Süper admin girişinde 6 haneli doğrulama kodu istenir.
        {enabledAtState && (
          <span className="block mt-1">
            Aktif: {new Date(enabledAtState).toLocaleString("tr-TR")}
          </span>
        )}
      </p>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {step === "idle" && (
        <div className="flex flex-wrap gap-2">
          {!enabled ? (
            <button
              type="button"
              className="btn-primary text-xs"
              onClick={() => setStep("setup")}
            >
              Authenticator kur
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  setStep("reset");
                  setPassword("");
                  setResetCode("");
                }}
              >
                Sil ve yeniden kur
              </button>
            </>
          )}
        </div>
      )}

      {step === "setup" && (
        <div className="space-y-2 max-w-sm">
          {!qrDataUrl ? (
            <>
              <label className="text-xs text-gray-600">Admin şifreniz</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={loading || password.length < 6}
                  onClick={startSetup}
                >
                  QR oluştur
                </button>
                <button type="button" className="btn-secondary text-xs" onClick={resetForm}>
                  İptal
                </button>
              </div>
            </>
          ) : (
            <>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Authenticator QR"
                  className="mx-auto h-40 w-40 rounded-lg border border-rose-100"
                />
              )}
              <p className="text-[11px] text-gray-500">
                Google Authenticator ile QR kodu okutun, ardından 6 haneli kodu girin.
              </p>
              <input
                className="input text-center tracking-widest"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={loading || code.length !== 6}
                  onClick={completeSetup}
                >
                  Etkinleştir
                </button>
                <button type="button" className="btn-secondary text-xs" onClick={resetForm}>
                  İptal
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "reset" && (
        <div className="space-y-2 max-w-sm">
          <p className="text-[11px] text-amber-800 bg-amber-50 rounded p-2">
            Mevcut authenticator kaldırılacak ve yeni QR kodu oluşturulacak.
          </p>
          <input
            className="input"
            type="password"
            placeholder="Admin şifresi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="input text-center tracking-widest"
            placeholder="Mevcut 6 haneli kod"
            maxLength={6}
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary text-xs !bg-red-700"
              disabled={loading || password.length < 6 || resetCode.length !== 6}
              onClick={removeTotp}
            >
              Kaldır ve yeniden kur
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={resetForm}>
              İptal
            </button>
          </div>
          {qrDataUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Yeni Authenticator QR"
                className="mx-auto h-40 w-40 rounded-lg border"
              />
              <input
                className="input text-center tracking-widest"
                placeholder="Yeni kod"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <button
                type="button"
                className="btn-primary text-xs w-full"
                disabled={loading || code.length !== 6}
                onClick={completeSetup}
              >
                Yeni authenticator&apos;ı etkinleştir
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
