"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminGirisPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("05323943686");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    const role = data.user?.role;
    const allowed = role === "ADMIN" || role === "STAFF_ADMIN";
    if (!res.ok || !allowed) {
      setError(data.error || "Giriş başarısız.");
      return;
    }
    const redirect =
      role === "STAFF_ADMIN" ? "/admin/randevular" : "/admin";
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-xs space-y-2">
        <h1 className="!mb-1">Admin</h1>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full">
          Giriş
        </button>
    </form>
  );
}
