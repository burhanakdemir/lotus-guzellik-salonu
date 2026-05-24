"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";



const superLinks = [

  { href: "/admin", label: "Özet" },

  { href: "/admin/randevular", label: "Randevu" },

  { href: "/admin/hizmetler", label: "Hizmet" },

  { href: "/admin/kampanyalar", label: "Kampanya" },

  { href: "/admin/galeri", label: "Galeri" },

  { href: "/admin/yorumlar", label: "Yorum" },

  { href: "/admin/bildirimler", label: "Bildirim" },

  { href: "/admin/uyeler", label: "Üye" },

  { href: "/admin/ayarlar", label: "Ayar" },

];



const staffLinks = [{ href: "/admin/randevular", label: "Randevu" }];



type AdminNavProps = {

  session: {

    role: "ADMIN" | "STAFF_ADMIN";

    isMultiAdmin: boolean;

  } | null;

};



export function AdminNav({ session }: AdminNavProps) {

  const pathname = usePathname();

  if (pathname === "/admin/giris") return null;



  const isStaff =

    session?.isMultiAdmin && session.role === "STAFF_ADMIN";



  const links = isStaff ? staffLinks : superLinks;



  return (

    <nav className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-2 py-1">

      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-lotus-700">

        {isStaff ? "Usta" : "Admin"}

      </span>

      {links.map((l) => (

        <Link

          key={l.href}

          href={l.href}

          className={`rounded px-2 py-0.5 text-[11px] font-medium ${

            pathname === l.href || pathname.startsWith(`${l.href}/`)

              ? "bg-lotus-700 text-white"

              : "text-gray-600 hover:bg-lotus-50"

          }`}

        >

          {l.label}

        </Link>

      ))}

      <Link

        href="/"

        className="ml-auto text-[10px] text-gray-500 hover:text-lotus-700"

      >

        ← Site

      </Link>

    </nav>

  );

}


