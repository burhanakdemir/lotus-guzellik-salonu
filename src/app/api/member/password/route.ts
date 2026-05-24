import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı."),
});

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MEMBER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { newPassword } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.errors[0]?.message;
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Geçersiz veri." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Şifre güncellenemedi." }, { status: 400 });
  }
}
