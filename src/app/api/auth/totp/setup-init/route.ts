import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import {
  buildOtpAuthUrl,
  generateTotpSecret,
  sealPendingSetupSecret,
} from "@/lib/totp";
import { verifyTotpPendingToken } from "@/lib/totp-pending";
import { isPrismaSchemaMismatchError, SCHEMA_MISMATCH_MESSAGE } from "@/lib/prisma-errors";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  pendingToken: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const { pendingToken } = schema.parse(await req.json());
    const pending = await verifyTotpPendingToken(pendingToken);
    if (!pending || pending.purpose !== "totp_setup") {
      return NextResponse.json({ error: "Oturum süresi doldu." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: pending.userId } });
    if (!user || user.role !== "ADMIN" || !user.isActive) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const secret = generateTotpSecret();
    const account = user.email || user.phone;
    const otpauthUrl = buildOtpAuthUrl(secret, account);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    const setupSeal = sealPendingSetupSecret(secret, user.id);

    return NextResponse.json({
      qrDataUrl,
      otpauthUrl,
      setupSeal,
      account,
    });
  } catch (e) {
    console.error("[totp/setup-init]", e);
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: SCHEMA_MISMATCH_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Kurulum başlatılamadı." }, { status: 500 });
  }
}
