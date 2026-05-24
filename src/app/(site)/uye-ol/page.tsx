"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UyeOlPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Kayıt başarısız.");
      return;
    }
    router.push("/hesabim");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xs px-3 py-8 sm:max-w-sm">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-lotus-900">
          Üye Ol
        </h1>
        <div className="gold-line gold-line--wide !mt-2" />
        <p className="mt-2 text-sm font-semibold text-lotus-800/80">
          Özel indirim ve kampanyalardan yararlanın
        </p>
      </div>
      <form onSubmit={handleSubmit} className="card mt-5 space-y-3 !p-4 shadow-lg">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label className="label">Ad Soyad *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Telefon *</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">E-posta (opsiyonel)</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Şifre * (min. 6 karakter)</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Üye Ol"}
        </button>
        <p className="pt-1 text-center text-xs text-gray-500">
          Zaten üye misiniz?{" "}
          <Link href="/giris" className="font-medium text-rose-700 hover:underline">
            Giriş yapın
          </Link>
        </p>
      </form>
    </div>
  );
}
