"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginMode = "member" | "staff";

export default function GirisPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("member");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: loginId, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Giriş başarısız.");
      return;
    }
    if (data.user.role === "ADMIN") router.push("/admin");
    else router.push("/hesabim");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl text-rose-900">Giriş</h1>
        <div className="gold-line" />
      </div>

      <div
        className="site-mobile-only mt-6 grid grid-cols-2 gap-2"
        role="tablist"
        aria-label="Giriş türü"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "member"}
          className={`btn-gold w-full !py-2.5 ${
            mode === "member" ? "ring-2 ring-lotus-800 ring-offset-2" : "opacity-80"
          }`}
          onClick={() => {
            setMode("member");
            setError("");
          }}
        >
          Üye Girişi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "staff"}
          className={`btn-gold w-full !py-2.5 ${
            mode === "staff" ? "ring-2 ring-lotus-800 ring-offset-2" : "opacity-80"
          }`}
          onClick={() => {
            setMode("staff");
            setError("");
          }}
        >
          Usta Girişi
        </button>
      </div>

      {mode === "staff" ? (
        <div className="site-mobile-only card mt-6 space-y-4 text-center shadow-lg">
          <p className="text-sm leading-relaxed text-lotus-800/80">
            Salon yönetimi ve usta paneli için ayrı giriş ekranına yönlendirilirsiniz.
          </p>
          <Link href="/admin/giris" className="btn-gold inline-flex w-full justify-center">
            Usta Girişine Devam
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className={`card mt-8 space-y-5 shadow-lg ${mode === "staff" ? "site-desktop-only" : ""}`}
      >
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label className="label">Telefon veya ad soyad</label>
          <input
            className="input"
            type="text"
            placeholder="05XX XXX XX XX veya adınız"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            autoComplete="username"
          />
          <p className="text-[11px] text-gray-500">
            Salon tarafından eklenen üyeler varsayılan şifre:{" "}
            <strong>123456</strong> (ilk girişten sonra değiştirebilirsiniz).
          </p>
        </div>
        <div>
          <label className="label">Şifre</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Hesabınız yok mu?{" "}
          <Link href="/uye-ol" className="font-medium text-rose-700 hover:underline">
            Üye olun
          </Link>
        </p>
      </form>
    </div>
  );
}
