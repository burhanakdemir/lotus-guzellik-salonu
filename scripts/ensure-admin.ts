/**
 * Canlıda admin hesabını oluşturur veya Render/.env şifresiyle günceller.
 * Telefon 0/90 önekli kayıtlarla da eşleşir (çift admin oluşmasını önler).
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

function phoneOrConditions(normalized: string) {
  return [
    { phone: normalized },
    { phone: `0${normalized}` },
    { phone: `90${normalized}` },
  ];
}

async function findAdminUser(prisma: PrismaClient, normalizedPhone: string) {
  const adminName =
    process.env.ADMIN_NAME?.trim() ||
    process.env.SUPER_ADMIN_PANEL_NAME?.trim() ||
    "Neşe AKDEMİR";

  let user = await prisma.user.findFirst({
    where: {
      role: Role.ADMIN,
      OR: phoneOrConditions(normalizedPhone),
    },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
        name: { equals: adminName, mode: "insensitive" },
      },
    });
  }

  return user;
}

export async function ensureAdminUser(prisma: PrismaClient): Promise<void> {
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "5323943686");
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || password.length < 6) {
    console.warn(
      "→ Admin atlandı: ADMIN_PASSWORD tanımlı değil veya çok kısa (Render Environment)."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await findAdminUser(prisma, adminPhone);

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: Role.ADMIN,
        passwordHash,
        phone: adminPhone,
        name: process.env.ADMIN_NAME || existing.name || "Neşe AKDEMİR",
        email: process.env.ADMIN_EMAIL || existing.email || "admin@lotusguzellik.com",
        isActive: true,
      },
    });
    console.log(`→ Admin güncellendi: ${user.phone} (${user.name})`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "Neşe AKDEMİR",
      phone: adminPhone,
      email: process.env.ADMIN_EMAIL || "admin@lotusguzellik.com",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`→ Admin oluşturuldu: ${user.phone} (${user.name})`);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await ensureAdminUser(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("ensure-admin")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
