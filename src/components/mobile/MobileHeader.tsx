import Image from "next/image";
import Link from "next/link";
import { MemberNotificationBell } from "@/components/MemberNotificationBell";
import type { SessionUser } from "@/lib/auth";

type Props = {
  session: SessionUser | null;
};

export function MobileHeader({ session }: Props) {
  const firstName = session?.name.split(" ")[0];

  return (
    <header className="site-mobile-only mobile-header sticky top-0 z-50 border-b border-lotus-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/logo/lotus-sade.png"
            alt="LOTUS Kuaför"
            width={40}
            height={40}
            className="h-10 w-auto shrink-0 object-contain"
            priority
          />
          <span className="font-display text-lg font-bold tracking-wide text-lotus-900">
            LOTUS
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {session?.role === "MEMBER" && <MemberNotificationBell />}
          {session ? (
            <Link
              href="/hesabim"
              className="rounded-full bg-lotus-100 px-3 py-2 text-sm font-semibold text-lotus-800"
            >
              {firstName}
            </Link>
          ) : (
            <Link
              href="/giris"
              className="rounded-full border border-lotus-300 px-3 py-2 text-sm font-semibold text-lotus-800"
            >
              Giriş
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
