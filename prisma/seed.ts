import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { catalogSlugs, servicesCatalog } from "./services-catalog";
import { seedStaffAdmins } from "./seed-staff-admins";
import { seedSuperAdminStaffProfile } from "./seed-super-admin-profile";

const prisma = new PrismaClient();

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

async function main() {
  const adminPhone = normalizePhone(process.env.ADMIN_PHONE || "5323943686");
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "Admin123!",
    10
  );

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: "ADMIN" },
    create: {
      name: process.env.ADMIN_NAME || "Lotus Admin",
      phone: adminPhone,
      email: process.env.ADMIN_EMAIL || "admin@lotusguzellik.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.salonSettings.upsert({
    where: { id: "default" },
    update: { slotInterval: 30, showServicePrice: true, showServiceDuration: true },
    create: {
      id: "default",
      salonName: "LOTUS BAYANKUAFÖRÜ & GÜZELLİK SALONU",
      city: "ANTALYA",
      address:
        "Fevziçakmak Mahallesi Akşemsettin Caddesi No:12/A Kepez / ANTALYA",
      phone: "0532 394 36 86",
      heroTitle: "Güzelliğinize Değer Katıyoruz",
      heroSubtitle:
        "Antalya Kepez'de profesyonel kuaför ve güzellik hizmetleri. Online randevu alın, haftanın kampanyalarından yararlanın.",
      aboutContent: `LOTUS BAYANKUAFÖRÜ & GÜZELLİK SALONU olarak Antalya Kepez'de kadınların güzellik ve bakım ihtiyaçlarını tek çatı altında karşılıyoruz.

Deneyimli ekibimizle fön ve bakımdan renklendirmeye, gelin başından lazer epilasyona, protez tırnaktan kalıcı makyaja kadar geniş hizmet yelpazemizle yanınızdayız.

Salonumuz hijyenik, modern ve konforlu bir ortamda sizleri ağırlamaktan mutluluk duyar.`,
      instagram: "",
      facebook: "",
      slotInterval: 30,
      showServicePrice: true,
      showServiceDuration: true,
      mondayOpen: "09:00",
      mondayClose: "19:00",
      tuesdayOpen: "09:00",
      tuesdayClose: "19:00",
      wednesdayOpen: "09:00",
      wednesdayClose: "19:00",
      thursdayOpen: "09:00",
      thursdayClose: "19:00",
      fridayOpen: "09:00",
      fridayClose: "19:00",
      saturdayOpen: "09:00",
      saturdayClose: "18:00",
      sundayOpen: null,
      sundayClose: null,
    },
  });

  for (const s of servicesCatalog) {
    const description = `${s.name} hizmetimiz profesyonel ekip ve kaliteli ürünlerle sunulmaktadır. Fiyatlar KDV dahildir.`;
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        category: s.category,
        durationMinutes: s.duration,
        price: s.price,
        isFeatured: s.featured ?? false,
        isActive: true,
        deletedAt: null,
        description,
      },
      create: {
        name: s.name,
        slug: s.slug,
        category: s.category,
        durationMinutes: s.duration,
        price: s.price,
        isFeatured: s.featured ?? false,
        isActive: true,
        description,
        imageUrl: null,
      },
    });
  }

  await prisma.service.updateMany({
    where: {
      slug: { notIn: catalogSlugs },
      deletedAt: null,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const existingPromo = await prisma.promotion.findFirst();
  if (!existingPromo) {
    const sacKesim = await prisma.service.findUnique({
      where: { slug: "sac-kesimi" },
    });
    const ombre = await prisma.service.findUnique({ where: { slug: "ombre" } });
    const hydra = await prisma.service.findUnique({
      where: { slug: "hydrafacial" },
    });
    const promoServices = [sacKesim, ombre, hydra].filter(Boolean);
    if (promoServices.length > 0) {
      await prisma.promotion.create({
        data: {
          title: "Haftanın Kampanyası",
          description:
            "Seçili hizmetlerde %15 indirim! Bu hafta randevunuzu hemen alın.",
          discountType: "PERCENT",
          discountValue: 15,
          startDate: weekStart,
          endDate: weekEnd,
          allServices: false,
          isActive: true,
          services: {
            create: promoServices.map((svc) => ({ serviceId: svc!.id })),
          },
        },
      });
    }
  }

  const categoryCount = new Set(servicesCatalog.map((s) => s.category)).size;
  console.log(
    `Seed tamamlandı. ${servicesCatalog.length} hizmet yüklendi (${categoryCount} ana kategori).`
  );

  if (process.env.MULTI_ADMIN_ENABLED === "true") {
    await seedSuperAdminStaffProfile(prisma);
  }

  if (process.env.MULTI_ADMIN_SEED_STAFF === "true") {
    await seedStaffAdmins(prisma);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
