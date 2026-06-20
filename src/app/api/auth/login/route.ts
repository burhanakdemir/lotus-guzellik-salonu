import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";
import { getJwtSecretKey } from "@/lib/jwt-secret";
import { apiErrorFromUnknown } from "@/lib/prisma-errors";
import { z } from "zod";

const schema = z.object({
  phone: z.string().trim().min(2).optional(),
  identifier: z.string().trim().min(2).optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

function loginErrorMessage(e: unknown): { status: number; error: string } {
  if (e instanceof z.ZodError) {
    const first = e.issues[0];
    return {
      status: 400,
      error: first?.message || "Telefon ve şifre kontrol edin.",
    };
  }
  return apiErrorFromUnknown(e);
}

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

    const parsed = schema.parse(body);
    const loginId = (parsed.identifier ?? parsed.phone ?? "").trim();
    if (!loginId) {
      return NextResponse.json(
        { error: "Telefon veya ad girin." },
        { status: 400 }
      );
    }

    // Canlıda JWT yoksa anlamlı hata (TOTP / oturum için gerekli)
    if (process.env.NODE_ENV === "production") {
      getJwtSecretKey();
    }

    const result = await loginUser(loginId, parsed.password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    if ("requiresTotp" in result) {
      return NextResponse.json({
        requiresTotp: true,
        pendingToken: result.pendingToken,
      });
    }
    if ("requiresTotpSetup" in result) {
      return NextResponse.json({
        requiresTotpSetup: true,
        pendingToken: result.pendingToken,
      });
    }
    await setSessionCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (e) {
    console.error("[auth/login]", e);
    const { status, error } = loginErrorMessage(e);
    return NextResponse.json({ error }, { status });
  }
}
