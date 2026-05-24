"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "19:00";
const DEFAULT_SATURDAY_CLOSE = "18:00";

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
  "showServicePrice",
  "showServiceDuration",
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
    } else if (key === "showServicePrice" || key === "showServiceDuration") {
      value = Boolean(value);
    }
    data[key] = value;
  }
  return data;
}

export type SaveSalonSettingsInput = {
  settings: Record<string, unknown>;
  closedDays: { date: string; reason: string | null }[];
};

/** Tek gün açık/kapalı — hızlı ve güvenilir */
export async function setDaySchedule(dayKey: DayKey, open: boolean) {
  await requireAdmin();

  const openField = `${dayKey}Open`;
  const closeField = `${dayKey}Close`;

  const data = open
    ? {
        [openField]: DEFAULT_OPEN,
        [closeField]: dayKey === "saturday" ? DEFAULT_SATURDAY_CLOSE : DEFAULT_CLOSE,
      }
    : {
        [openField]: null,
        [closeField]: null,
      };

  await prisma.salonSettings.update({
    where: { id: "default" },
    data,
  });

  return { ok: true as const, open };
}

export async function saveSalonSettings(input: SaveSalonSettingsInput) {
  await requireAdmin();

  await prisma.salonSettings.update({
    where: { id: "default" },
    data: pickSettingsData(input.settings),
  });

  await prisma.closedDay.deleteMany();
  if (input.closedDays.length > 0) {
    await prisma.closedDay.createMany({
      data: input.closedDays.map((d) => ({
        date: d.date,
        reason: d.reason || null,
      })),
    });
  }

  const closedDays = await prisma.closedDay.findMany({ orderBy: { date: "asc" } });
  return { ok: true as const, closedDays };
}

export async function updateServiceDisplaySettings(input: {
  showServicePrice?: boolean;
  showServiceDuration?: boolean;
}) {
  await requireAdmin();
  await prisma.salonSettings.update({
    where: { id: "default" },
    data: {
      ...(input.showServicePrice !== undefined && {
        showServicePrice: input.showServicePrice,
      }),
      ...(input.showServiceDuration !== undefined && {
        showServiceDuration: input.showServiceDuration,
      }),
    },
  });
  return { ok: true as const };
}
