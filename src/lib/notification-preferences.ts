import { prisma } from "@/lib/prisma";

export async function ensureMemberNotificationPreference(userId: string) {
  return prisma.memberNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      inAppEnabled: true,
      pushEnabled: false,
      pushPromptDismissed: false,
    },
    update: {},
  });
}
