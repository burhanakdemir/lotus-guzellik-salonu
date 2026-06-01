"use client";

import { useState } from "react";

type Props = {
  date: string;
  startTime: string;
  onClose: () => void;
  onBook: () => void;
  onBlock: () => Promise<void>;
};

export function SlotActionModal({
  date,
  startTime,
  onClose,
  onBook,
  onBlock,
}: Props) {
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState("");

  async function handleBlock() {
    setError("");
    setBlocking(true);
    try {
      await onBlock();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saat kapatılamadı.");
    } finally {
      setBlocking(false);
    }
  }

  return (
    <div
      className="apt-calendar__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-action-title"
      onClick={onClose}
    >
      <div
        className="apt-calendar__modal card max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="slot-action-title" className="text-sm font-semibold text-lotus-800">
          {date} · {startTime}
        </h3>
        <p className="mt-1 text-[11px] text-gray-600">
          Bu saat için randevu ekleyebilir veya müşteri randevusuna kapatabilirsiniz.
        </p>
        {error && (
          <p className="mt-2 rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={onBook}
            disabled={blocking}
          >
            Randevu ekle
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => void handleBlock()}
            disabled={blocking}
          >
            {blocking ? "Kapatılıyor…" : "Saati kapat"}
          </button>
          <button
            type="button"
            className="text-[11px] text-gray-500 underline"
            onClick={onClose}
            disabled={blocking}
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
