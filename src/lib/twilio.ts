/**
 * Twilio SMS hatırlatma altyapısı (ileride aktifleştirilecek).
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER .env'de tanımlanmalı.
 */

export interface SmsPayload {
  to: string;
  body: string;
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

export async function sendSms(_payload: SmsPayload): Promise<{ ok: boolean; message: string }> {
  if (!isTwilioConfigured()) {
    return {
      ok: false,
      message: "Twilio yapılandırılmamış. SMS gönderilmedi.",
    };
  }

  // İleride: Twilio REST API entegrasyonu
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({ from, to, body });

  return { ok: false, message: "SMS entegrasyonu henüz aktif değil." };
}

export async function sendAppointmentReminder(
  phone: string,
  date: string,
  time: string,
  serviceName: string
): Promise<void> {
  const body = `LOTUS Güzellik: ${date} tarihinde saat ${time} için "${serviceName}" randevunuz var.`;
  await sendSms({ to: phone, body });
}
