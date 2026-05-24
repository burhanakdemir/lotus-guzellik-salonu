"use client";

import { useCallback, useState } from "react";
import { TimeSelect24 } from "@/components/admin/TimeSelect24";
import {
  setDaySchedule,
  saveSalonSettings,
  type DayKey,
} from "@/app/admin/ayarlar/actions";

type DayHours = {
  open: string | null;
  close: string | null;
};

export type WorkScheduleState = Record<DayKey, DayHours>;

const days: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Pzt" },
  { key: "tuesday", label: "Sal" },
  { key: "wednesday", label: "Çar" },
  { key: "thursday", label: "Per" },
  { key: "friday", label: "Cum" },
  { key: "saturday", label: "Cmt" },
  { key: "sunday", label: "Paz" },
];

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "19:00";
const DEFAULT_SATURDAY_CLOSE = "18:00";

function isDayOpen(day: DayHours): boolean {
  return Boolean(day.open?.trim() && day.close?.trim());
}

function defaultCloseFor(key: DayKey): string {
  return key === "saturday" ? DEFAULT_SATURDAY_CLOSE : DEFAULT_CLOSE;
}

export function buildScheduleFromSettings(settings: Record<string, unknown>): WorkScheduleState {
  const schedule = {} as WorkScheduleState;
  for (const d of days) {
    schedule[d.key] = {
      open: (settings[`${d.key}Open`] as string | null) ?? null,
      close: (settings[`${d.key}Close`] as string | null) ?? null,
    };
  }
  return schedule;
}

export function scheduleToSettingsFields(
  schedule: WorkScheduleState
): Record<string, string | null> {
  const fields: Record<string, string | null> = {};
  for (const d of days) {
    const day = schedule[d.key];
    if (isDayOpen(day)) {
      fields[`${d.key}Open`] = day.open;
      fields[`${d.key}Close`] = day.close;
    } else {
      fields[`${d.key}Open`] = null;
      fields[`${d.key}Close`] = null;
    }
  }
  return fields;
}

type WorkScheduleEditorProps = {
  initialSchedule: WorkScheduleState;
  slotInterval: number;
  onSlotIntervalChange: (n: number) => void;
  closedDays: { date: string; reason: string | null }[];
  onClosedDaysChange: (days: { date: string; reason: string | null }[]) => void;
};

export function WorkScheduleEditor({
  initialSchedule,
  slotInterval,
  onSlotIntervalChange,
  closedDays,
  onClosedDaysChange,
}: WorkScheduleEditorProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [newClosed, setNewClosed] = useState("");

  const showOk = useCallback(() => {
    setStatus("ok");
    setMessage("Kaydedildi");
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 2000);
  }, []);

  const showError = useCallback((text: string) => {
    setStatus("error");
    setMessage(text);
  }, []);

  const handleOpenToggle = (key: DayKey, open: boolean) => {
    const previous = schedule[key];
    const nextDay: DayHours = open
      ? {
          open: previous.open?.trim() || DEFAULT_OPEN,
          close: previous.close?.trim() || defaultCloseFor(key),
        }
      : { open: null, close: null };

    setSchedule((s) => ({ ...s, [key]: nextDay }));

    void (async () => {
      try {
        await setDaySchedule(key, open);
        showOk();
      } catch (err) {
        console.error(err);
        setSchedule((s) => ({ ...s, [key]: previous }));
        showError("Gün durumu kaydedilemedi.");
      }
    })();
  };

  const handleTimeChange = (key: DayKey, field: "open" | "close", value: string) => {
    setSchedule((s) => {
      const previous = s[key];
      const nextDay = { ...previous, [field]: value };
      const nextSchedule = { ...s, [key]: nextDay };

      void (async () => {
        try {
          const fields = scheduleToSettingsFields(nextSchedule);
          await saveSalonSettings({
            settings: { slotInterval, ...fields },
            closedDays,
          });
          showOk();
        } catch (err) {
          console.error(err);
          setSchedule((cur) => ({ ...cur, [key]: previous }));
          showError("Saat kaydedilemedi.");
        }
      })();

      return nextSchedule;
    });
  };

  const persistClosedDays = (next: { date: string; reason: string | null }[]) => {
    void (async () => {
      try {
        const fields = scheduleToSettingsFields(schedule);
        await saveSalonSettings({
          settings: { slotInterval, ...fields },
          closedDays: next,
        });
        onClosedDaysChange(next);
        showOk();
      } catch (err) {
        console.error(err);
        showError("Kapalı günler kaydedilemedi.");
      }
    })();
  };

  return (
    <div className="space-y-2">
      {message && (
        <p
          className={`rounded px-2 py-0.5 text-[11px] ${
            status === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="!normal-case !tracking-normal">Randevu saatleri</h2>
        <select
          className="input !w-auto !py-0.5"
          value={slotInterval}
          onChange={(e) => {
            const n = Number(e.target.value);
            onSlotIntervalChange(n);
            void (async () => {
              try {
                const fields = scheduleToSettingsFields(schedule);
                await saveSalonSettings({
                  settings: { slotInterval: n, ...fields },
                  closedDays,
                });
                showOk();
              } catch (err) {
                console.error(err);
                showError("Aralık kaydedilemedi.");
              }
            })();
          }}
        >
          <option value={15}>15 dk</option>
          <option value={30}>30 dk</option>
        </select>
        <span className="text-[10px] text-gray-500">24 saat formatı (HH:mm)</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((d) => {
          const day = schedule[d.key];
          const dayOpen = isDayOpen(day);
          return (
            <div
              key={d.key}
              className={`rounded border px-3 py-1.5 ${
                dayOpen ? "border-lotus-200 bg-white" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-700">{d.label}</span>
                <div
                  className="inline-flex shrink-0 rounded border border-lotus-200 text-[11px]"
                  role="group"
                  aria-label={`${d.label} çalışma durumu`}
                >
                  <button
                    type="button"
                    aria-pressed={dayOpen}
                    onClick={() => handleOpenToggle(d.key, true)}
                    className={`min-w-[2.5rem] cursor-pointer px-2 py-1 ${
                      dayOpen
                        ? "bg-lotus-700 font-semibold text-white"
                        : "bg-white text-gray-600 hover:bg-lotus-50"
                    }`}
                  >
                    Açık
                  </button>
                  <button
                    type="button"
                    aria-pressed={!dayOpen}
                    onClick={() => handleOpenToggle(d.key, false)}
                    className={`min-w-[2.75rem] cursor-pointer border-l border-lotus-200 px-2 py-1 ${
                      !dayOpen
                        ? "bg-gray-600 font-semibold text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Kapalı
                  </button>
                </div>
              </div>
              {dayOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <TimeSelect24
                    value={day.open || DEFAULT_OPEN}
                    stepMinutes={slotInterval}
                    onChange={(v) => handleTimeChange(d.key, "open", v)}
                  />
                  <span className="shrink-0 text-gray-400">–</span>
                  <TimeSelect24
                    value={day.close || defaultCloseFor(d.key)}
                    stepMinutes={slotInterval}
                    onChange={(v) => handleTimeChange(d.key, "close", v)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <details className="card">
        <summary>▸ Özel kapalı günler ({closedDays.length})</summary>
        <div className="flex gap-1">
          <input
            type="date"
            className="input max-w-[9rem]"
            value={newClosed}
            onChange={(e) => setNewClosed(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            disabled={!newClosed}
            onClick={() => {
              if (!newClosed || closedDays.some((c) => c.date === newClosed)) return;
              const next = [...closedDays, { date: newClosed, reason: "Tatil" }];
              setNewClosed("");
              persistClosedDays(next);
            }}
          >
            +
          </button>
        </div>
        {closedDays.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {closedDays.map((c) => (
              <li
                key={c.date}
                className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px]"
              >
                {c.date}
                <button
                  type="button"
                  className="cursor-pointer text-red-600 hover:text-red-800"
                  aria-label={`${c.date} kaldır`}
                  onClick={() =>
                    persistClosedDays(closedDays.filter((x) => x.date !== c.date))
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
