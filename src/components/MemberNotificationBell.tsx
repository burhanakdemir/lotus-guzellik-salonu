"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MemberNotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/member/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      if (active) setCount(data.count ?? 0);
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Link
      href="/hesabim#bildirimler"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-lotus-700 ring-1 ring-lotus-200 transition hover:bg-lotus-50 hover:text-lotus-900"
      aria-label={`Bildirimler${count > 0 ? `, ${count} okunmamış` : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M15 17H9l-1 2h8l-1-2z" />
        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lotus-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
