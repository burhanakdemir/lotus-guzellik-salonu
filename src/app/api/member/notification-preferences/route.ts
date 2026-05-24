import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { getVapidPublicKey } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  pushEnabled: z.boolean().optional(),
  pushPromptDismissed: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const pref = await ensureMemberNotificationPreference(session.id);

  return NextResponse.json({
    inAppEnabled: pref.inAppEnabled,
    pushEnabled: pref.pushEnabled,
    pushPromptDismissed: pref.pushPromptDismissed,
    vapidPublicKey: getVapidPublicKey(),
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const data = patchSchema.parse(await req.json());
  await ensureMemberNotificationPreference(session.id);

  const updated = await prisma.memberNotificationPreference.update({
    where: { userId: session.id },
    data: {
      ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
      ...(data.pushPromptDismissed !== undefined && {
        pushPromptDismissed: data.pushPromptDismissed,
      }),
    },
  });

  return NextResponse.json({
    inAppEnabled: updated.inAppEnabled,
    pushEnabled: updated.pushEnabled,
    pushPromptDismissed: updated.pushPromptDismissed,
    vapidPublicKey: getVapidPublicKey(),
  });
}
