"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/push-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

function isIosChrome(): boolean {
  if (!isIosDevice()) return false;
  return /CriOS/i.test(navigator.userAgent);
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandaloneMode()) {
      setInstalled(true);
      setHidden(true);
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setHidden(true);
      return;
    }

    setHidden(false);
    void registerServiceWorker();

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => {
      if (isStandaloneMode()) {
        setInstalled(true);
        setHidden(true);
      }
    };
    mq.addEventListener("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      mq.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (installed) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setHidden(true);
      }
      setDeferredPrompt(null);
      return;
    }

    setShowGuide(true);
  }, [deferredPrompt, installed]);

  if (installed || hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="btn-gold mt-3 inline-flex w-full justify-center"
      >
        Uygulamayı İndir
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo/lotus-sade.png"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <div>
                <h2
                  id="install-guide-title"
                  className="font-display text-lg font-semibold text-lotus-900"
                >
                  Ana ekrana ekleyin
                </h2>
                <p className="text-xs text-lotus-800/70">LOTUS uygulama gibi açılır</p>
              </div>
            </div>

            {isIosChrome() ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                iPhone&apos;da en iyi deneyim için bu sayfayı{" "}
                <strong>Safari</strong> ile açın, ardından aşağıdaki adımları izleyin.
              </p>
            ) : isIosDevice() ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-lotus-900">
                <li>Safari&apos;de alttaki <strong>Paylaş</strong> simgesine dokunun</li>
                <li>
                  <strong>Ana Ekrana Ekle</strong> seçeneğini bulun
                </li>
                <li>Sağ üstte <strong>Ekle</strong> deyin</li>
              </ol>
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-lotus-900">
                <li>Tarayıcı menüsünü (⋮) açın</li>
                <li>
                  <strong>Ana ekrana ekle</strong> veya <strong>Uygulamayı yükle</strong>{" "}
                  seçin
                </li>
                <li>Onaylayın — LOTUS ikonu ana ekranınızda görünür</li>
              </ol>
            )}

            <button
              type="button"
              className="btn-primary mt-5 w-full"
              onClick={() => setShowGuide(false)}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
