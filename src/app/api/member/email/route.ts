import { NextResponse } from "next/server";
import { createToken, getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
});

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MEMBER") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { email } = schema.parse(await req.json());
    const normalized = email.trim().toLowerCase();

    const conflict = await prisma.user.findFirst({
      where: {
        email: normalized,
        id: { not: session.id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Bu e-posta başka bir hesapta kayıtlı." },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { email: normalized },
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: "MEMBER" as const,
    };
    const token = await createToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: sessionUser });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.errors[0]?.message;
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Geçersiz e-posta." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Kaydedilemedi." }, { status: 400 });
  }
}
