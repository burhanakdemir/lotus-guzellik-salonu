import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(2).optional(),
  identifier: z.string().min(2).optional(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const loginId = (parsed.identifier ?? parsed.phone ?? "").trim();
    if (!loginId) {
      return NextResponse.json(
        { error: "Telefon veya ad girin." },
        { status: 400 }
      );
    }
    const result = await loginUser(loginId, parsed.password);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    await setSessionCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
}
