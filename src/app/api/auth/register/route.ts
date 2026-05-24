import { NextResponse } from "next/server";
import { createToken, setSessionCookie, type SessionUser } from "@/lib/auth";
import { deliverMemberNotifications } from "@/lib/member-notifications";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const phone = normalizePhone(data.phone);

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
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız." }, { status: 400 });
  }
}
