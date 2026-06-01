import { DEFAULT_SALON_SETTINGS } from "@/lib/db-safe";

/** Salon adresini harita / yol tarifi URL’leri için birleştirir */
export function formatSalonMapAddress(
  address?: string | null,
  city?: string | null
): string {
  const a = (address ?? DEFAULT_SALON_SETTINGS.address).trim();
  const c = city?.trim();
  if (!c) return a;
  if (a.toUpperCase().includes(c.toUpperCase())) return a;
  return `${a}, ${c}`;
}

/** Gömülü harita (iframe) */
export function buildGoogleMapsEmbedUrl(fullAddress: string): string {
  const q = encodeURIComponent(fullAddress);
  return `https://maps.google.com/maps?q=${q}&hl=tr&z=16&output=embed`;
}

/**
 * Yol tarifi — resmi Maps URL formatı (mobil + masaüstü).
 * Gömülü haritanın kendi «Yol tarifi» düğmesi hatalı hedef verebiliyor.
 */
export function buildGoogleMapsDirectionsUrl(fullAddress: string): string {
  const destination = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}
