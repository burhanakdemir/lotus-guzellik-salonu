/**
 * Canlıda admin hesabını oluşturur veya Render/.env şifresiyle günceller.
 * Tam seed atlanmış olsa bile her deploy'da çalıştırılır.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

export async function ensureAdminUser(prisma: PrismaClient): Promise<void> {
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "5323943686");
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 6) {
    console.warn(
      "→ Admin atlandı: ADMIN_PASSWORD tanımlı değil veya çok kısa (Render Environment)."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      role: "ADMIN",
      passwordHash,
      name: process.env.ADMIN_NAME || "Lotus Admin",
      email: process.env.ADMIN_EMAIL || "admin@lotusguzellik.com",
      isActive: true,
    },
    create: {
      name: process.env.ADMIN_NAME || "Lotus Admin",
      phone: adminPhone,
      email: process.env.ADMIN_EMAIL || "admin@lotusguzellik.com",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`→ Admin hazır: ${user.phone} (${user.name})`);
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
