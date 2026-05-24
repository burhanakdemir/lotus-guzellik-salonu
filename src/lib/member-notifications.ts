import { NotificationKind } from "@prisma/client";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { NOTIFICATION_KIND_LABELS } from "@/lib/notification-labels";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export { NOTIFICATION_KIND_LABELS };

export async function deliverMemberNotifications(input: {
  userIds: string[];
  title: string;
  body: string;
  kind?: NotificationKind;
}) {
  const kind = input.kind ?? "INFO";
  const uniqueIds = [...new Set(input.userIds)];
  if (uniqueIds.length === 0) return { count: 0 };

  await Promise.all(uniqueIds.map((id) => ensureMemberNotificationPreference(id)));

  const prefs = await prisma.memberNotificationPreference.findMany({
    where: { userId: { in: uniqueIds }, inAppEnabled: true },
    select: { userId: true, pushEnabled: true },
  });
  const allowedIds = new Set(prefs.map((p) => p.userId));
  const pushEnabledIds = new Set(
    prefs.filter((p) => p.pushEnabled).map((p) => p.userId)
  );

  const targetIds = uniqueIds.filter((id) => allowedIds.has(id));
  if (targetIds.length === 0) return { count: 0 };

  await prisma.memberNotification.createMany({
    data: targetIds.map((userId) => ({
      userId,
      title: input.title.trim(),
      body: input.body.trim(),
      kind,
    })),
  });

  const pushTargets = targetIds.filter((id) => pushEnabledIds.has(id));
  await Promise.all(
    pushTargets.map((userId) =>
      sendPushToUser(userId, {
        title: input.title.trim(),
        body: input.body.trim(),
        url: "/hesabim#bildirimler",
      }).catch(() => {})
    )
  );

  return { count: targetIds.length };
}

export async function getAllMemberIds() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true },
  });
  return members.map((m) => m.id);
}
