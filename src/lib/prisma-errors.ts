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
