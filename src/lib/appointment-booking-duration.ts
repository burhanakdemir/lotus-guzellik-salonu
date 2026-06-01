/** Salon «Tümü — süre» ayarı: randevu blok süresi hizmet süresi mi, slot aralığı mı? */
export function bookingBlockMinutes(
  settings: { showServiceDuration: boolean; slotInterval: number },
  service: { durationMinutes: number }
): number {
  return settings.showServiceDuration
    ? service.durationMinutes
    : settings.slotInterval;
}
