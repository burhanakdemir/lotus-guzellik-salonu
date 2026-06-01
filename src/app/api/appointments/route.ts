import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingBlockMinutes } from "@/lib/appointment-booking-duration";
import { getAvailableSlots } from "@/lib/slots";
import { staffCanPerformService } from "@/lib/staff-services";
import { isMultiAdminEnabled } from "@/lib/staff-admin";
import { normalizePhone, timeToMinutes, minutesToTime } from "@/lib/utils";
import { notifyStaffOfNewAppointment } from "@/lib/staff-notifications";
import { Prisma } from "@prisma/client";
import { z } from "zod";

/** Randevuyu yalnızca aktif üye hesabına bağlar; admin oturumu veya eşleşmeyen id kullanılmaz. */
async function resolveMemberUserId(phone: string): Promise<string | null> {
  const session: SessionUser | null = await getSession();

  if (session?.role === "MEMBER") {
    const member = await prisma.user.findFirst({
      where: { id: session.id, role: "MEMBER", isActive: true },
    });
    return member?.id ?? null;
  }

  const member = await prisma.user.findFirst({
    where: {
      role: "MEMBER",
      isActive: true,
      OR: [
        { phone },
        { phone: `0${phone}` },
        { phone: `90${phone}` },
      ],
    },
  });
  return member?.id ?? null;
}

const schema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .transform((p) => normalizePhone(p))
    .refine((p) => p.length === 10, "Geçerli telefon girin."),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().optional(),
  assignedStaffId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const phone = data.phone;

    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, isActive: true, deletedAt: null },
    });
    if (!service) {
      return NextResponse.json({ error: "Hizmet bulunamadı." }, { status: 404 });
    }

    let assignedStaffId: string | null = null;
    if (isMultiAdminEnabled()) {
      if (!data.assignedStaffId) {
        return NextResponse.json(
          { error: "Lütfen bir usta seçin." },
          { status: 400 }
        );
      }
      const staff = await prisma.staffAdminProfile.findFirst({
        where: { id: data.assignedStaffId, isActive: true },
      });
      if (!staff) {
        return NextResponse.json({ error: "Seçilen usta bulunamadı." }, { status: 400 });
      }
      assignedStaffId = staff.id;
      const canDo = await staffCanPerformService(staff.id, data.serviceId);
      if (!canDo) {
        return NextResponse.json(
          { error: "Seçilen usta bu hizmeti yapmamaktadır." },
          { status: 400 }
        );
      }
    }

    const { slots, error } = await getAvailableSlots(
      data.date,
      data.serviceId,
      phone,
      assignedStaffId ?? undefined
    );
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    if (!slots.includes(data.startTime)) {
      return NextResponse.json(
        { error: "Seçilen saat müsait değil." },
        { status: 400 }
      );
    }

    const salonSettings = await prisma.salonSettings.findUnique({
      where: { id: "default" },
    });
    if (!salonSettings) {
      return NextResponse.json(
        { error: "Salon ayarları bulunamadı." },
        { status: 500 }
      );
    }

    const startMin = timeToMinutes(data.startTime);
    const endTime = minutesToTime(
      startMin + bookingBlockMinutes(salonSettings, service)
    );

    const userId = await resolveMemberUserId(phone);

    const appointment = await prisma.appointment.create({
      data: {
        name: data.name,
        phone,
        userId,
        serviceId: data.serviceId,
        assignedStaffId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        note: data.note || null,
        status: "PENDING",
      },
      include: {
        service: true,
        assignedStaff: {
          select: { id: true, label: true, userId: true },
        },
      },
    });

    await notifyStaffOfNewAppointment({
      id: appointment.id,
      name: appointment.name,
      phone: appointment.phone,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      assignedStaffId: appointment.assignedStaffId,
      service: { name: appointment.service.name },
      assignedStaff: appointment.assignedStaff,
    }).catch((e) => console.error("[notifyStaffOfNewAppointment]", e));

    return NextResponse.json({ appointment, awaitingApproval: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.errors[0]?.message;
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Geçersiz bilgi." },
        { status: 400 }
      );
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Hesap bilgisi geçersiz. Çıkış yapıp tekrar deneyin veya üye olmadan devam edin." },
        { status: 400 }
      );
    }
    console.error("POST /api/appointments", e);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı." },
      { status: 400 }
    );
  }
}
