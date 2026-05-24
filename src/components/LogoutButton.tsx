"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({
  className = "text-sm text-gray-500 hover:text-rose-600",
  children = "Çıkış",
}: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className={className}>
      {children}
    </button>
  );
}
