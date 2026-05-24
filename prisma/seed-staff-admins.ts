import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const STAFF_ADMIN_SEED = [
  { slug: "personel-1", label: "Personel 1", phone: "5320000001" },
  { slug: "personel-2", label: "Personel 2", phone: "5320000002" },
  { slug: "personel-3", label: "Personel 3", phone: "5320000003" },
  { slug: "personel-4", label: "Personel 4", phone: "5320000004" },
  { slug: "personel-5", label: "Personel 5", phone: "5320000005" },
] as const;

const STAFF_COLORS = ["#d97b9a", "#c25b7d", "#9bb89e", "#e8c547", "#a84868"];

export async function seedStaffAdmins(prisma: PrismaClient) {
  const password = process.env.STAFF_ADMIN_PASSWORD || "Staff123!";
  const passwordHash = await bcrypt.hash(password, 10);

  for (let i = 0; i < STAFF_ADMIN_SEED.length; i++) {
    const s = STAFF_ADMIN_SEED[i];
    const user = await prisma.user.upsert({
      where: { phone: s.phone },
      update: { role: "STAFF_ADMIN", isActive: true, name: s.label },
      create: {
        name: s.label,
        phone: s.phone,
        email: `${s.slug}@lotusguzellik.local`,
        passwordHash,
        role: "STAFF_ADMIN",
      },
    });

    await prisma.staffAdminProfile.upsert({
      where: { userId: user.id },
      update: {
        slug: s.slug,
        label: s.label,
        color: STAFF_COLORS[i],
        sortOrder: i,
        isActive: true,
      },
      create: {
        userId: user.id,
        slug: s.slug,
        label: s.label,
        color: STAFF_COLORS[i],
        sortOrder: i,
      },
    });
  }

  console.log(
    `5 yardımcı admin seed edildi (şifre: ${password}). MULTI_ADMIN_ENABLED=true ile kullanın.`
  );
}
