import { DEFAULT_MEMBER_PASSWORD } from "@/lib/member-constants";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export { DEFAULT_MEMBER_PASSWORD } from "@/lib/member-constants";

export function memberPhoneOrConditions(phone: string) {
  return [
    { phone },
    { phone: `0${phone}` },
    { phone: `90${phone}` },
  ];
}

export async function findMemberByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return null;
  return prisma.user.findFirst({
    where: {
      role: "MEMBER",
      isActive: true,
      OR: memberPhoneOrConditions(normalized),
    },
  });
}

/** Randevu sırasında üye yoksa otomatik üyelik (şifre: 123456). */
export async function ensureMemberAccount(params: {
  name: string;
  phone: string;
  existingUserId?: string | null;
}): Promise<{ userId: string | null; created: boolean }> {
  const normalized = normalizePhone(params.phone);
  if (normalized.length !== 10) {
    throw new Error("Geçerli telefon gerekli.");
  }

  if (params.existingUserId) {
    const linked = await prisma.user.findFirst({
      where: { id: params.existingUserId, role: "MEMBER", isActive: true },
    });
    if (linked) return { userId: linked.id, created: false };
  }

  const existingMember = await findMemberByPhone(normalized);
  if (existingMember) {
    return { userId: existingMember.id, created: false };
  }

  const anyUser = await prisma.user.findFirst({
    where: { OR: memberPhoneOrConditions(normalized) },
  });
  if (anyUser) {
    if (anyUser.role === "MEMBER") {
      return { userId: anyUser.id, created: false };
    }
    return { userId: null, created: false };
  }

  const user = await prisma.user.create({
    data: {
      name: params.name.trim(),
      phone: normalized,
      passwordHash: await hashPassword(DEFAULT_MEMBER_PASSWORD),
      role: "MEMBER",
      isActive: true,
    },
  });

  return { userId: user.id, created: true };
}
