import type { PrismaClient } from "@prisma/client";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

/** Süper admin — randevu panelinde ve online randevuda ilk sırada (Neşe Akdemir) */
export async function seedSuperAdminStaffProfile(prisma: PrismaClient) {
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "5323943686");
  const label =
    process.env.SUPER_ADMIN_PANEL_NAME?.trim() ||
    process.env.ADMIN_NAME?.trim() ||
    "Neşe Akdemir";

  const admin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      OR: [
        { phone: adminPhone },
        { phone: `0${adminPhone}` },
        { phone: `90${adminPhone}` },
      ],
    },
  });
  if (!admin) return;

  await prisma.staffAdminProfile.upsert({
    where: { userId: admin.id },
    update: {
      label,
      slug: "nese-akdemir",
      sortOrder: 0,
      isActive: true,
      color: "#8b3a62",
    },
    create: {
      userId: admin.id,
      slug: "nese-akdemir",
      label,
      sortOrder: 0,
      color: "#8b3a62",
      isActive: true,
    },
  });

  console.log(`Süper admin randevu profili: ${label} (ilk sırada).`);
}
