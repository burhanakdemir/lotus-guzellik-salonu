import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureMemberNotificationPreference } from "@/lib/notification-preferences";
import { prisma } from "@/lib/prisma";

async function requireMember() {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") return null;
  return session;
}

export async function GET() {
  const session = await requireMember();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await ensureMemberNotificationPreference(session.id);

  const notifications = await prisma.memberNotification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      kind: n.kind,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}
