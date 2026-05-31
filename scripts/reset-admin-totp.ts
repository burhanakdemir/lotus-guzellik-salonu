/**
 * Süper admin (Neşe Akdemir) Google Authenticator kaydını sıfırlar.
 * Sonraki girişte ilk kurulum gibi QR kodu gösterilir.
 *
 * Canlı (Render Shell):
 *   npx tsx scripts/reset-admin-totp.ts --confirm
 *
 * Veya deploy sırasında (tek seferlik):
 *   RESET_ADMIN_TOTP=true
 */
import { PrismaClient, Role } from "@prisma/client";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

export async function resetSuperAdminTotp(prisma: PrismaClient): Promise<boolean> {
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "5323943686");
  const adminName =
    process.env.ADMIN_NAME?.trim() ||
    process.env.SUPER_ADMIN_PANEL_NAME?.trim() ||
    "Neşe AKDEMİR";

  let user = await prisma.user.findFirst({
    where: { role: Role.ADMIN, phone: adminPhone },
    select: {
      id: true,
      name: true,
      phone: true,
      totpSecret: true,
      totpEnabledAt: true,
    },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
        name: { equals: adminName, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        totpSecret: true,
        totpEnabledAt: true,
      },
    });
  }

  if (!user) {
    console.error("→ Süper admin (ADMIN) hesabı bulunamadı.");
    return false;
  }

  if (!user.totpSecret && !user.totpEnabledAt) {
    console.log(
      `→ ${user.name} (${user.phone}): Authenticator zaten kapalı — girişte QR kurulumu gösterilir.`
    );
    return true;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabledAt: null },
  });

  console.log(
    `→ Authenticator sıfırlandı: ${user.name} (${user.phone}). /admin/giris ile yeni QR kodu taratın.`
  );
  return true;
}

async function main() {
  const confirmed =
    process.argv.includes("--confirm") ||
    process.env.RESET_ADMIN_TOTP === "true" ||
    process.env.RESET_ADMIN_TOTP === "1";

  if (!confirmed) {
    console.error(
      "Güvenlik: --confirm veya RESET_ADMIN_TOTP=true gerekli.\n" +
        "Örnek: npx tsx scripts/reset-admin-totp.ts --confirm"
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const ok = await resetSuperAdminTotp(prisma);
    process.exit(ok ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("reset-admin-totp")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
