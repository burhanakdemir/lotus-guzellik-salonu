"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Step = "credentials" | "totp" | "totp-setup";

export default function AdminGirisPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [setupSeal, setSetupSeal] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const initSetup = useCallback(async (token: string) => {
    setQrLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/totp/setup-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authenticator kurulumu başlatılamadı.");
        setQrDataUrl(null);
        setSetupSeal("");
        return false;
      }
      if (!data.qrDataUrl || typeof data.qrDataUrl !== "string") {
        setError("QR kodu oluşturulamadı. Tekrar deneyin.");
        setQrDataUrl(null);
        setSetupSeal("");
        return false;
      }
      setQrDataUrl(data.qrDataUrl);
      setSetupSeal(data.setupSeal ?? "");
      return true;
    } catch {
      setError("QR kodu yüklenemedi. İnternet bağlantınızı kontrol edin.");
      setQrDataUrl(null);
      setSetupSeal("");
      return false;
    } finally {
      setQrLoading(false);
    }
  }, []);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok && !data.requiresTotp && !data.requiresTotpSetup) {
        setError(
          (data as { error?: string }).error ||
            (res.status === 503
              ? "Sunucu geçici olarak hazır değil. Birkaç dakika sonra tekrar deneyin."
              : "Giriş başarısız.")
        );
        return;
      }

      if (data.requiresTotp) {
        setPendingToken(data.pendingToken);
        setStep("totp");
        return;
      }
      if (data.requiresTotpSetup) {
        const token = data.pendingToken as string;
        setPendingToken(token);
        setStep("totp-setup");
        setTotpCode("");
        await initSetup(token);
        return;
      }

      const role = data.user?.role;
      if (!res.ok || (role !== "ADMIN" && role !== "STAFF_ADMIN")) {
        setError(data.error || "Giriş başarısız.");
        return;
      }
      router.push(role === "STAFF_ADMIN" ? "/admin/randevular" : "/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kod hatalı.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupComplete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/setup-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          setupSeal,
          code: totpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kurulum tamamlanamadı.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-sm space-y-3">
      <div className="flex justify-center">
        <Link href="/" className="admin-nav__btn">
          Ana Sayfa
        </Link>
      </div>
      <h1 className="!mb-0 font-display text-xl text-lotus-900">Ustalar Girişi</h1>
      <p className="text-[11px] text-gray-500">
        Süper admin: Google Authenticator ile doğrulama
      </p>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {step === "credentials" && (
        <form onSubmit={handleCredentials} className="space-y-2">
          <input
            className="input"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Kontrol…" : "Devam"}
          </button>
        </form>
      )}

      {step === "totp" && (
        <form onSubmit={handleTotpVerify} className="space-y-2">
          <p className="text-xs text-gray-600">
            Google Authenticator uygulamasındaki 6 haneli kodu girin.
          </p>
          <input
            className="input text-center text-lg tracking-[0.3em]"
            placeholder="000000"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            autoComplete="one-time-code"
            inputMode="numeric"
            required
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || totpCode.length !== 6}
          >
            Giriş yap
          </button>
          <button
            type="button"
            className="btn-secondary w-full text-xs"
            onClick={() => {
              setStep("credentials");
              setTotpCode("");
              setPendingToken("");
            }}
          >
            Geri
          </button>
        </form>
      )}

      {step === "totp-setup" && (
        <form onSubmit={handleSetupComplete} className="space-y-2">
          <p className="text-xs text-gray-600">
            İlk kurulum: Google Authenticator ile QR kodu okutun.
          </p>
          <div className="flex min-h-[12rem] flex-col items-center justify-center">
            {qrLoading ? (
              <p className="text-center text-xs text-gray-400">QR kodu hazırlanıyor…</p>
            ) : qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URL; next/image desteklemez
              <img
                src={qrDataUrl}
                alt="Google Authenticator QR kodu"
                width={200}
                height={200}
                className="mx-auto max-w-full rounded-lg border border-rose-100 bg-white p-2"
              />
            ) : (
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={!pendingToken || qrLoading}
                onClick={() => pendingToken && void initSetup(pendingToken)}
              >
                QR kodunu yükle
              </button>
            )}
          </div>
          <input
            className="input text-center text-lg tracking-[0.3em]"
            placeholder="000000"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            required
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || totpCode.length !== 6 || !setupSeal}
          >
            Kurulumu tamamla
          </button>
          <button
            type="button"
            className="btn-secondary w-full text-xs"
            onClick={() => {
              setStep("credentials");
              setTotpCode("");
              setPendingToken("");
              setQrDataUrl(null);
            }}
          >
            Geri
          </button>
        </form>
      )}
    </div>
  );
}
