import { NextResponse } from "next/server";
import { issueSessionForUserId, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openPendingSetupSecret, verifyTotpCode } from "@/lib/totp";
import { verifyTotpPendingToken } from "@/lib/totp-pending";
import { isPrismaSchemaMismatchError, SCHEMA_MISMATCH_MESSAGE } from "@/lib/prisma-errors";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  pendingToken: z.string().min(10),
  setupSeal: z.string().min(10),
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  try {
    const { pendingToken, setupSeal, code } = schema.parse(await req.json());
    const pending = await verifyTotpPendingToken(pendingToken);
    if (!pending || pending.purpose !== "totp_setup") {
      return NextResponse.json({ error: "Oturum süresi doldu." }, { status: 401 });
    }

    const secret = openPendingSetupSecret(setupSeal, pending.userId);
    if (!secret) {
      return NextResponse.json({ error: "Kurulum süresi doldu, yeniden başlayın." }, { status: 400 });
    }

    if (!(await verifyTotpCode(secret, code))) {
      return NextResponse.json({ error: "Doğrulama kodu hatalı." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: pending.userId },
      data: { totpSecret: secret, totpEnabledAt: new Date() },
    });

    const session = await issueSessionForUserId(pending.userId);
    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: 500 });
    }
    await setSessionCookie(session.token);
    return NextResponse.json({ user: session.user });
  } catch (e) {
    console.error("[totp/setup-complete]", e);
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: SCHEMA_MISMATCH_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Kurulum tamamlanamadı." }, { status: 500 });
  }
}
