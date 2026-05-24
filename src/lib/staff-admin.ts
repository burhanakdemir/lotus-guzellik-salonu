import type { Role } from "@prisma/client";

/** Protokol: en fazla 5 aktif usta */
export const MAX_STAFF_ADMINS = 5;

/** Faz 2+ özellik bayrağı — false iken mevcut tek-admin davranışı korunur */
export function isMultiAdminEnabled(): boolean {
  return process.env.MULTI_ADMIN_ENABLED === "true";
}

export type AdminRole = Extract<Role, "ADMIN" | "STAFF_ADMIN">;

export function isSuperAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function isStaffAdmin(role: Role): boolean {
  return role === "STAFF_ADMIN";
}

export function isAnyAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "STAFF_ADMIN";
}

export function normalizeStaffSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const STAFF_PROFILE_COLORS = [
  "#d97b9a",
  "#c25b7d",
  "#9bb89e",
  "#e8c547",
  "#a84868",
];

export const STAFF_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defaultStaffPassword(): string {
  return process.env.STAFF_ADMIN_PASSWORD || "Staff123!";
}
