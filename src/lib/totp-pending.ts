import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production-32chars"
);

export type TotpPendingPayload = {
  userId: string;
  purpose: "totp_login" | "totp_setup";
};

export async function createTotpPendingToken(
  userId: string,
  purpose: TotpPendingPayload["purpose"]
): Promise<string> {
  return new SignJWT({ userId, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyTotpPendingToken(
  token: string
): Promise<TotpPendingPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const purpose = payload.purpose as TotpPendingPayload["purpose"];
    if (!userId || !purpose) return null;
    return { userId, purpose };
  } catch {
    return null;
  }
}
