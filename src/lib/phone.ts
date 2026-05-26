export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone);
  if (d.length === 10) {
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return phone;
}

/** WhatsApp wa.me için uluslararası rakamlar (ör. 905323943686) */
export function whatsappIntlDigits(phone: string): string | null {
  const d = normalizePhone(phone);
  if (d.length === 10) return `90${d}`;
  if (d.length === 12 && d.startsWith("90")) return d;
  return null;
}

/** Masaüstünde WhatsApp Web, mobilde uygulama açılır */
export function whatsappUrl(phone: string): string | null {
  const intl = whatsappIntlDigits(phone);
  return intl ? `https://wa.me/${intl}` : null;
}
