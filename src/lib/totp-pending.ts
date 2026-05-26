import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwt-secret";

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
    .sign(getJwtSecretBytes());
}

export async function verifyTotpPendingToken(
  token: string
): Promise<TotpPendingPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const userId = payload.userId as string;
    const purpose = payload.purpose as TotpPendingPayload["purpose"];
    if (!userId || !purpose) return null;
    return { userId, purpose };
  } catch {
    return null;
  }
}
