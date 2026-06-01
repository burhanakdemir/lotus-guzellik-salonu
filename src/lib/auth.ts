import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@prisma/client";
import {
  AdminForbiddenError,
  AdminUnauthorizedError,
  assertAppointmentAccess,
  assertSuperAdmin,
} from "./admin-permissions";
import { verifyPassword } from "./password";
import { prisma } from "./prisma";
import { isMultiAdminEnabled, isStaffAdmin, isSuperAdmin } from "./staff-admin";
import { normalizePhone } from "./utils";
import { createTotpPendingToken } from "./totp-pending";
import { assertStaffContentAccess } from "./staff-content-scope";

export { hashPassword, verifyPassword } from "./password";

import { getJwtSecretBytes } from "@/lib/jwt-secret";

const COOKIE_NAME = "lotus_session";

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "MEMBER" | "ADMIN" | "STAFF_ADMIN";
  staffProfileId?: string | null;
  staffSlug?: string | null;
}

async function loadStaffClaims(userId: string, role: Role) {
  if (role !== "STAFF_ADMIN") {
    return { staffProfileId: null as string | null, staffSlug: null as string | null };
  }
  const profile = await prisma.staffAdminProfile.findUnique({
    where: { userId },
    select: { id: true, slug: true, isActive: true },
  });
  if (!profile?.isActive) {
    return null;
  }
  return { staffProfileId: profile.id, staffSlug: profile.slug };
}

export async function buildSessionUser(user: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
}): Promise<SessionUser | null> {
  const staff = await loadStaffClaims(user.id, user.role);
  if (user.role === "STAFF_ADMIN" && !staff) return null;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role as SessionUser["role"],
    staffProfileId: staff?.staffProfileId ?? null,
    staffSlug: staff?.staffSlug ?? null,
  };
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    staffProfileId: user.staffProfileId ?? null,
    staffSlug: user.staffSlug ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecretBytes());
}

export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return {
      id: payload.id as string,
      name: payload.name as string,
      phone: payload.phone as string,
      email: (payload.email as string) || null,
      role: payload.role as SessionUser["role"],
      staffProfileId: (payload.staffProfileId as string) || null,
      staffSlug: (payload.staffSlug as string) || null,
    };
  } catch {
    return null;
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
});

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export type LoginResult =
  | { user: SessionUser; token: string }
  | { requiresTotp: true; pendingToken: string }
  | { requiresTotpSetup: true; pendingToken: string }
  | { error: string };

export async function issueSessionForUserId(
  userId: string
): Promise<{ user: SessionUser; token: string } | { error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isActive) return { error: "Hesap bulunamadı." };
  const sessionUser = await buildSessionUser(user);
  if (!sessionUser) return { error: "Oturum oluşturulamadı." };
  const token = await createToken(sessionUser);
  return { user: sessionUser, token };
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<LoginResult> {
  const trimmed = identifier.trim();
  if (trimmed.length < 2) {
    return { error: "Telefon veya ad girin." };
  }

  let user = null;
  const normalized = normalizePhone(trimmed);

  if (normalized.length === 10) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalized },
          { phone: `0${normalized}` },
          { phone: `90${normalized}` },
        ],
      },
    });
  }

  if (!user) {
    const byName = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        isActive: true,
        name: { equals: trimmed, mode: "insensitive" },
      },
    });
    if (byName.length > 1) {
      return {
        error:
          "Bu isimde birden fazla üye var. Lütfen telefon numaranız ile giriş yapın.",
      };
    }
    user = byName[0] ?? null;
  }

  if (!user) return { error: "Telefon/ad veya şifre hatalı." };
  if (!user.isActive) return { error: "Hesabınız pasif durumda." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Telefon veya şifre hatalı." };

  const sessionUser = await buildSessionUser(user);
  if (!sessionUser) {
    return { error: "Usta profili bulunamadı veya pasif." };
  }

  if (sessionUser.role === "ADMIN") {
    if (user.totpSecret && user.totpEnabledAt) {
      return {
        requiresTotp: true,
        pendingToken: await createTotpPendingToken(user.id, "totp_login"),
      };
    }
    return {
      requiresTotpSetup: true,
      pendingToken: await createTotpPendingToken(user.id, "totp_setup"),
    };
  }

  const token = await createToken(sessionUser);
  return { user: sessionUser, token };
}

/** Süper admin — mevcut tüm admin API'leri (geriye uyumlu) */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  assertSuperAdmin(session);
  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  return requireAdmin();
}

/** Randevu modülü API'leri */
export async function requireAppointmentAccess(): Promise<SessionUser> {
  const session = await getSession();
  assertAppointmentAccess(session);
  return session;
}

/** Galeri / yorum modülü API'leri */
export async function requireStaffContentAccess(): Promise<SessionUser> {
  const session = await getSession();
  assertStaffContentAccess(session);
  return session;
}

export {
  AdminForbiddenError,
  AdminUnauthorizedError,
  assertAppointmentAccess,
  assertSuperAdmin,
};

export { COOKIE_NAME };

export function isAdminSession(session: SessionUser | null): boolean {
  if (!session) return false;
  if (isSuperAdmin(session.role)) return true;
  return isMultiAdminEnabled() && isStaffAdmin(session.role);
}

export function adminLoginRedirect(session: SessionUser): string {
  if (
    isMultiAdminEnabled() &&
    isStaffAdmin(session.role) &&
    session.staffSlug
  ) {
    return `/admin/randevular/personel/${session.staffSlug}`;
  }
  return "/admin";
}
