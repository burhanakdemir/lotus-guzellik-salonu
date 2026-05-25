import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildOtpAuthUrl,
  generateTotpSecret,
  openPendingSetupSecret,
  sealPendingSetupSecret,
  verifyTotpCode,
} from "@/lib/totp";
import { isPrismaSchemaMismatchError, SCHEMA_MISMATCH_MESSAGE } from "@/lib/prisma-errors";
import { z } from "zod";

export const runtime = "nodejs";

const resetSchema = z.object({
  password: z.string().min(6),
  code: z.string().min(6).max(8).optional(),
});

const enableSchema = z.object({
  password: z.string().min(6),
  setupSeal: z.string().min(10),
  code: z.string().min(6).max(8),
});

/** Mevcut TOTP'yi kaldır (şifre + isteğe bağlı mevcut kod) */
export async function DELETE(req: Request) {
  try {
    const session = await requireAdmin();
    const body = resetSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const validPw = await verifyPassword(body.password, user.passwordHash);
    if (!validPw) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    if (user.totpSecret && user.totpEnabledAt) {
      if (!body.code) {
        return NextResponse.json(
          { error: "Mevcut authenticator kodunu girin." },
          { status: 400 }
        );
      }
      if (!(await verifyTotpCode(user.totpSecret, body.code))) {
        return NextResponse.json({ error: "Authenticator kodu hatalı." }, { status: 401 });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: null, totpEnabledAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/totp DELETE]", e);
    if (e instanceof Error && e.name === "AdminUnauthorizedError") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: SCHEMA_MISMATCH_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Silinemedi." }, { status: 500 });
  }
}

/** Panelden yeni kurulum başlat (şifre doğrulama) */
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();

    if ("setupSeal" in body && "code" in body) {
      const { password, setupSeal, code } = enableSchema.parse(body);
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      }
      const validPw = await verifyPassword(password, user.passwordHash);
      if (!validPw) {
        return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
      }

      const secret = openPendingSetupSecret(setupSeal, user.id);
      if (!secret) {
        return NextResponse.json({ error: "Kurulum süresi doldu." }, { status: 400 });
      }
      if (!(await verifyTotpCode(secret, code))) {
        return NextResponse.json({ error: "Kod hatalı." }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret, totpEnabledAt: new Date() },
      });
      return NextResponse.json({ ok: true, enabled: true });
    }

    const { password } = resetSchema.parse(body);
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }
    const validPw = await verifyPassword(password, user.passwordHash);
    if (!validPw) {
      return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    }

    const secret = generateTotpSecret();
    const account = user.email || user.phone;
    const otpauthUrl = buildOtpAuthUrl(secret, account);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    const setupSeal = sealPendingSetupSecret(secret, user.id);

    return NextResponse.json({ qrDataUrl, otpauthUrl, setupSeal, account });
  } catch (e) {
    console.error("[admin/totp POST]", e);
    if (e instanceof Error && e.name === "AdminUnauthorizedError") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: SCHEMA_MISMATCH_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }
}

/** Durum */
export async function GET() {
  try {
    const session = await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { totpEnabledAt: true },
    });
    return NextResponse.json({
      enabled: Boolean(user?.totpEnabledAt),
      enabledAt: user?.totpEnabledAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("[admin/totp GET]", e);
    if (e instanceof Error && e.name === "AdminUnauthorizedError") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: SCHEMA_MISMATCH_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
