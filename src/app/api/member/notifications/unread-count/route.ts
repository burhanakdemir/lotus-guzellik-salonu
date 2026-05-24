import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MEMBER") {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.memberNotification.count({
    where: { userId: session.id, readAt: null },
  });

  return NextResponse.json({ count });
}
