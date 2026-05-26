"use client";

import { useCallback, useEffect, useState } from "react";

const PAGES = [
  { path: "/", label: "Ana sayfa" },
  { path: "/hizmetler", label: "Hizmetler" },
  { path: "/randevu", label: "Randevu" },
  { path: "/galeri", label: "Galeri" },
  { path: "/yorumlar", label: "Yorumlar" },
  { path: "/hakkimizda", label: "Hakkımızda" },
  { path: "/giris", label: "Giriş" },
  { path: "/hesabim", label: "Hesabım" },
] as const;

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export default function MobilOnizlemePage() {
  const [path, setPath] = useState("/");
  const [origin, setOrigin] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const iframeSrc = origin ? `${origin}${path}` : "";

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#1a1218] text-white">
      {/* Sol: telefon çerçevesi */}
      <aside className="flex w-[min(100%,28rem)] shrink-0 flex-col items-center justify-center border-r border-white/10 bg-[#241820] px-4 py-6">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#f4b8c8]">
          Mobil görünüm · {PHONE_WIDTH}px
        </p>
        <div
          className="relative rounded-[2.25rem] bg-[#0d0a0c] p-2.5 shadow-2xl ring-1 ring-white/15"
          style={{ width: PHONE_WIDTH + 20 }}
        >
          <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />
          <div
            className="overflow-hidden rounded-[1.75rem] bg-white"
            style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
          >
            {iframeSrc ? (
              <iframe
                key={`${path}-${reloadKey}`}
                title="LOTUS mobil önizleme"
                src={iframeSrc}
                className="h-full w-full border-0"
                style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Yükleniyor…
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 max-w-[18rem] text-center text-[11px] leading-relaxed text-white/50">
          Alt menü ve mobil düzen bu çerçevede görünür. Canlı site (lotuskuafor.com) deploy
          edilene kadar yalnızca bu sunucuda günceldir.
        </p>
      </aside>

      {/* Sağ: sayfa seçimi */}
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-6 md:p-10">
        <div>
          <h1 className="font-display text-3xl font-light text-[#ffd6e4]">
            Mobil önizleme
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/65">
            Geliştirme sırasında cep telefonu tasarımını bilgisayarınızda, soldaki
            çerçevede izleyin. Gerçek telefonda test için aynı ağda{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              /mobil-onizleme
            </code>{" "}
            yerine doğrudan site adresini kullanın.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#e8c547]">
            Sayfa seç
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PAGES.map((p) => (
              <li key={p.path}>
                <button
                  type="button"
                  onClick={() => setPath(p.path)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    path === p.path
                      ? "bg-[#c25b7d] text-white"
                      : "bg-white/10 text-white/90 hover:bg-white/15"
                  }`}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reload}
            className="rounded-full bg-[#e8c547] px-5 py-2.5 text-sm font-bold text-[#3d2832]"
          >
            Yenile
          </button>
          <a
            href={iframeSrc || "/"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Tam sekmede aç
          </a>
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          <strong className="text-white/90">İpucu:</strong> Chrome F12 → cihaz modu da
          kullanılabilir; bu sayfa her zaman{" "}
          <span className="text-[#f4b8c8]">768px altı</span> mobil CSS’i gösterir.
        </div>
      </main>
    </div>
  );
}
