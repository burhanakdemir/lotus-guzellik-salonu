import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";

import { prisma } from "@/lib/prisma";



const DAY_TIME_FIELDS = [

  "mondayOpen",

  "mondayClose",

  "tuesdayOpen",

  "tuesdayClose",

  "wednesdayOpen",

  "wednesdayClose",

  "thursdayOpen",

  "thursdayClose",

  "fridayOpen",

  "fridayClose",

  "saturdayOpen",

  "saturdayClose",

  "sundayOpen",

  "sundayClose",

] as const;



const SETTINGS_FIELDS = [

  "salonName",

  "city",

  "address",

  "phone",

  "heroTitle",

  "heroSubtitle",

  "aboutContent",

  "instagram",

  "facebook",

  "slotInterval",

  ...DAY_TIME_FIELDS,

] as const;



function pickSettingsData(body: Record<string, unknown>) {

  const data: Record<string, unknown> = {};

  for (const key of SETTINGS_FIELDS) {

    if (!(key in body)) continue;

    let value = body[key];

    if (DAY_TIME_FIELDS.includes(key as (typeof DAY_TIME_FIELDS)[number])) {

      value =

        value === "" || value === null || value === undefined ? null : String(value);

    } else if (key === "slotInterval") {

      value = Number(value);

    }

    data[key] = value;

  }

  return data;

}



export async function GET() {

  try {

    await requireAdmin();

    const settings = await prisma.salonSettings.findUnique({

      where: { id: "default" },

    });

    const closedDays = await prisma.closedDay.findMany({ orderBy: { date: "asc" } });

    return NextResponse.json({ settings, closedDays });

  } catch {

    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  }

}



export async function PATCH(req: Request) {

  try {

    await requireAdmin();

    const body = await req.json();

    const { closedDays, ...rawSettings } = body;

    const settingsData = pickSettingsData(rawSettings);



    const settings = await prisma.salonSettings.update({

      where: { id: "default" },

      data: settingsData,

    });



    if (Array.isArray(closedDays)) {

      await prisma.closedDay.deleteMany();

      if (closedDays.length > 0) {

        await prisma.closedDay.createMany({

          data: closedDays.map((d: { date: string; reason?: string }) => ({

            date: d.date,

            reason: d.reason || null,

          })),

        });

      }

    }



    const updatedClosed = await prisma.closedDay.findMany({ orderBy: { date: "asc" } });

    return NextResponse.json({ settings, closedDays: updatedClosed });

  } catch (err) {

    console.error("Settings PATCH failed:", err);

    return NextResponse.json({ error: "Güncellenemedi" }, { status: 400 });

  }

}

