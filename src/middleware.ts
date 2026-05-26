import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffAdminPath } from "@/lib/admin-permissions";
import { getJwtSecretBytes } from "@/lib/jwt-secret";

const MULTI_ADMIN = process.env.MULTI_ADMIN_ENABLED === "true";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/giris") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/randevular/personel/")) {
    const slug = pathname
      .replace(/^\/admin\/randevular\/personel\//, "")
      .split("/")[0];
    if (slug) {
      return NextResponse.redirect(
        new URL(
          `/admin/randevular?personel=${encodeURIComponent(slug)}`,
          request.url
        )
      );
    }
  }

  const token = request.cookies.get("lotus_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/giris", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const role = payload.role as string;

    if (role !== "ADMIN" && role !== "STAFF_ADMIN") {
      return NextResponse.redirect(new URL("/giris", request.url));
    }

    if (MULTI_ADMIN && role === "STAFF_ADMIN") {
      if (pathname === "/admin" || pathname === "/admin/") {
        return NextResponse.redirect(new URL("/admin/randevular", request.url));
      }

      if (!isStaffAdminPath(pathname)) {
        return NextResponse.redirect(new URL("/admin/randevular", request.url));
      }
    } else if (role === "STAFF_ADMIN" && !MULTI_ADMIN) {
      return NextResponse.redirect(new URL("/giris", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/admin/giris", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
