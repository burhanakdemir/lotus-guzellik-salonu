const DEV_FALLBACK = "fallback-secret-change-in-production-32chars";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET ortam değişkeni canlı ortamda tanımlı olmalıdır."
    );
  }
  return DEV_FALLBACK;
}

/** Üretimde JWT_SECRET zorunlu; geliştirmede yalnızca fallback. */
export function getJwtSecretBytes(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}

export function getJwtSecretKey(): string {
  return resolveJwtSecret();
}
