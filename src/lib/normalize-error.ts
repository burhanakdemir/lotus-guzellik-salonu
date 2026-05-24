/** İstemci/API hatalarını güvenli metne çevirir (Event → [object Event] önlenir). */
export function messageFromUnknown(error: unknown, fallback = "Bir hata oluştu."): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
