import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { generateSecret, generateURI, verify } from "otplib";

const ISSUER = process.env.TOTP_ISSUER || "LOTUS Admin";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUrl(secret: string, account: string): string {
  return generateURI({
    issuer: ISSUER,
    label: account,
    secret,
  });
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const result = await verify({ secret, token, epochTolerance: 1 });
    return result.valid === true;
  } catch {
    return false;
  }
}

/** Kurulum sırasında geçici secret (henüz DB'ye yazılmadı) */
export function sealPendingSetupSecret(secret: string, userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, secret, exp: Date.now() + 10 * 60 * 1000 })
  ).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function openPendingSetupSecret(
  sealed: string,
  userId: string
): string | null {
  const [payload, sig] = sealed.split(".");
  if (!payload || !sig || !verifySig(payload, sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
      secret: string;
      exp: number;
    };
    if (data.userId !== userId || data.exp < Date.now()) return null;
    return data.secret;
  } catch {
    return null;
  }
}

function sign(data: string): string {
  const key = process.env.JWT_SECRET || "fallback-secret-change-in-production-32chars";
  return createHmac("sha256", key).update(data).digest("base64url");
}

function verifySig(data: string, sig: string): boolean {
  const expected = sign(data);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
