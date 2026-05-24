import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@lotusguzellik.com";

export function isPushConfigured(): boolean {
  return Boolean(vapidPublic && vapidPrivate);
}

function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  return true;
}

export function getVapidPublicKey(): string {
  return vapidPublic;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!configureWebPush()) return;

  const subs = await prisma.memberPushSubscription.findMany({
    where: { userId },
  });
  if (subs.length === 0) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/hesabim#bildirimler",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.memberPushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
