import { NextResponse } from "next/server";
import { createToken, setSessionCookie, type SessionUser } from "@/lib/auth";
import { deliverMemberNotifications } from "@/lib/member-notifications";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { apiErrorFromUnknown } from "@/lib/prisma-errors";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır."),
  phone: z.string().trim().min(10, "Geçerli telefon girin."),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "İstek okunamadı. Sayfayı yenileyip tekrar deneyin." },
        { status: 400 }
      );
    }

    const data = schema.parse(body);
    const phone = normalizePhone(data.phone);
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "Geçerli bir telefon numarası girin (10 hane)." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu telefon numarası zaten kayıtlı." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone,
        email: data.email || null,
        passwordHash: await hashPassword(data.password),
        role: "MEMBER",
      },
    });

    await ensureMemberNotificationPreference(user.id);
    await deliverMemberNotifications({
      userIds: [user.id],
      title: "LOTUS'a hoş geldiniz",
      body: "Üyeliğiniz oluşturuldu. Kampanya ve randevu bilgilendirmeleri burada görünecek.",
      kind: "SYSTEM",
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role as SessionUser["role"],
    };
    const token = await createToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: sessionUser });
  } catch (e) {
    console.error("[auth/register]", e);
    if (e instanceof z.ZodError) {
      const msg = e.issues[0]?.message || "Bilgileri kontrol edin.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { status, error } = apiErrorFromUnknown(e);
    return NextResponse.json({ error }, { status });
  }
}
