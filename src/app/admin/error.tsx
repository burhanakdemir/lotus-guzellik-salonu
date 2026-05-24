"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-md space-y-3 p-4 text-center">
      <h1 className="text-base font-semibold text-red-800">Admin hatası</h1>
      <p className="text-[11px] text-gray-600">
        Sayfa yüklenemedi. Dev sunucusu uzun süredir açıksa veya stil bozuksa{" "}
        <code className="rounded bg-gray-100 px-1">npm run dev:clean</code>{" "}
        çalıştırın.
      </p>
      {error.message && (
        <p className="break-all text-[10px] text-gray-500">{error.message}</p>
      )}
      <button type="button" className="btn-primary" onClick={() => reset()}>
        Tekrar dene
      </button>
    </div>
  );
}
