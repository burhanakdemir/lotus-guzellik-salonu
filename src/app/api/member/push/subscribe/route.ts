import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const data = schema.parse(await req.json());

  await ensureMemberNotificationPreference(session.id);

  await prisma.memberPushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      userId: session.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
    update: {
      userId: session.id,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    },
  });

  await prisma.memberNotificationPreference.update({
    where: { userId: session.id },
    data: { pushEnabled: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;

  if (endpoint) {
    await prisma.memberPushSubscription.deleteMany({
      where: { userId: session.id, endpoint },
    });
  } else {
    await prisma.memberPushSubscription.deleteMany({
      where: { userId: session.id },
    });
  }

  await prisma.memberNotificationPreference.update({
    where: { userId: session.id },
    data: { pushEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
