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

export function whatsappUrl(phone: string): string {
  const d = normalizePhone(phone);
  const intl = d.length === 10 ? `90${d}` : d;
  return `https://wa.me/${intl}`;
}
