import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  deliverMemberNotifications,
  getAllMemberIds,
} from "@/lib/member-notifications";
import { prisma } from "@/lib/prisma";
import { NotificationKind } from "@prisma/client";
import { z } from "zod";

const sendSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(2000),
  kind: z.enum(["INFO", "CAMPAIGN", "REMINDER", "SYSTEM"]).optional(),
  target: z.enum(["ALL", "MEMBER"]),
  userId: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: { id: true, name: true, phone: true, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = sendSchema.parse(await req.json());

    let userIds: string[] = [];
    if (data.target === "ALL") {
      userIds = await getAllMemberIds();
    } else {
      if (!data.userId) {
        return NextResponse.json({ error: "Üye seçin." }, { status: 400 });
      }
      const member = await prisma.user.findFirst({
        where: { id: data.userId, role: "MEMBER" },
      });
      if (!member) {
        return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 });
      }
      userIds = [member.id];
    }

    const result = await deliverMemberNotifications({
      userIds,
      title: data.title,
      body: data.body,
      kind: (data.kind ?? "INFO") as NotificationKind,
    });

    return NextResponse.json({
      ok: true,
      count: result.count,
      message: `${result.count} üyeye bildirim gönderildi.`,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gönderilemedi." }, { status: 500 });
  }
}
