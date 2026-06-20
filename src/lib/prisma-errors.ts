/** Prisma: DB şeması deploy edilmemiş (ör. totpSecret sütunu yok) */
export function isPrismaSchemaMismatchError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg = String((e as { message?: string }).message ?? e);
  return (
    msg.includes("totpSecret") ||
    msg.includes("totpEnabledAt") ||
    msg.includes("staffApprovedAt") ||
    msg.includes("staffApprovedByUserId") ||
    msg.includes("StaffNotification") ||
    msg.includes("does not exist") ||
    msg.includes("P2021") ||
    msg.includes("P2022")
  );
}

export const SCHEMA_MISMATCH_MESSAGE =
  "Veritabanı şeması güncelleniyor. 1–2 dakika bekleyip tekrar deneyin veya deploy loglarını kontrol edin.";

/** Neon / Postgres bağlantı hatası (canlı log: Can't reach database server) */
export function isDbConnectionError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg = String((e as { message?: string }).message ?? e);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection refused") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("Connection timed out") ||
    msg.includes("P1001") ||
    msg.includes("P1017")
  );
}

export const DB_CONNECTION_MESSAGE =
  "Veritabanına şu an ulaşılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.";

export function apiErrorFromUnknown(e: unknown): { status: number; error: string } {
  if (isPrismaSchemaMismatchError(e)) {
    return { status: 503, error: SCHEMA_MISMATCH_MESSAGE };
  }
  if (isDbConnectionError(e)) {
    return { status: 503, error: DB_CONNECTION_MESSAGE };
  }
  if (e instanceof Error && e.message.includes("JWT_SECRET")) {
    return {
      status: 503,
      error:
        "Sunucu yapılandırması eksik. Yönetici ile iletişime geçin.",
    };
  }
  return { status: 400, error: "İşlem tamamlanamadı." };
}
