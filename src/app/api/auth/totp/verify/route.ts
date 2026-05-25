import { NextResponse } from "next/server";
import { issueSessionForUserId, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotpCode } from "@/lib/totp";
import { verifyTotpPendingToken } from "@/lib/totp-pending";
import { z } from "zod";

const schema = z.object({
  pendingToken: z.string().min(10),
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  try {
    const { pendingToken, code } = schema.parse(await req.json());
    const pending = await verifyTotpPendingToken(pendingToken);
    if (!pending || pending.purpose !== "totp_login") {
      return NextResponse.json({ error: "Oturum süresi doldu." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: pending.userId } });
    if (!user?.totpSecret || !user.totpEnabledAt) {
      return NextResponse.json({ error: "Authenticator kurulu değil." }, { status: 400 });
    }

    if (!(await verifyTotpCode(user.totpSecret, code))) {
      return NextResponse.json({ error: "Doğrulama kodu hatalı." }, { status: 401 });
    }

    const session = await issueSessionForUserId(user.id);
    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: 500 });
    }
    await setSessionCookie(session.token);
    return NextResponse.json({ user: session.user });
  } catch {
    return NextResponse.json({ error: "Doğrulama başarısız." }, { status: 400 });
  }
}
