import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await prisma.memberNotification.updateMany({
    where: { userId: session.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
