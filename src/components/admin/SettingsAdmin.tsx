"use client";

import { useState } from "react";
import { saveSalonSettings } from "@/app/admin/ayarlar/actions";
import { StaffAdminPanel } from "@/components/admin/StaffAdminPanel";
import {
  WorkScheduleEditor,
  buildScheduleFromSettings,
  scheduleToSettingsFields,
} from "@/components/admin/WorkScheduleEditor";

interface Settings {
  salonName: string;
  city: string;
  address: string;
  phone: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutContent: string;
  slotInterval: number;
  instagram?: string | null;
  facebook?: string | null;
  [key: string]: unknown;
}

interface ClosedDay {
  date: string;
  reason: string | null;
}

const fieldLabels: Record<string, string> = {
  salonName: "Salon adı",
  heroTitle: "Hero başlık",
  heroSubtitle: "Hero alt",
  address: "Adres",
  phone: "Telefon",
  aboutContent: "Hakkımızda",
};

export function SettingsAdmin({
  settings: initial,
  closedDays: initialClosed,
  multiAdminEnabled = false,
}: {
  settings: Settings;
  closedDays: ClosedDay[];
  multiAdminEnabled?: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const [closedDays, setClosedDays] = useState(initialClosed);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveSiteContent() {
    setSaveError("");
    setSaving(true);
    try {
      const scheduleFields = scheduleToSettingsFields(
        buildScheduleFromSettings(settings)
      );
      await saveSalonSettings({
        settings: {
          salonName: settings.salonName,
          city: settings.city,
          address: settings.address,
          phone: settings.phone,
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          aboutContent: settings.aboutContent,
          instagram: settings.instagram ?? null,
          facebook: settings.facebook ?? null,
          slotInterval: settings.slotInterval,
          ...scheduleFields,
        },
        closedDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setSaveError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {saved && (
        <p className="rounded bg-green-50 px-2 py-0.5 text-[11px] text-green-700">Kaydedildi</p>
      )}
      {saveError && (
        <p className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-700">{saveError}</p>
      )}

      <details className="card">
        <summary>▸ Site içeriği</summary>
        <div className="grid gap-1 sm:grid-cols-2">
          {(["salonName", "heroTitle", "heroSubtitle", "address", "phone"] as const).map(
            (field) => (
              <div key={field}>
                <label className="label">{fieldLabels[field]}</label>
                <input
                  className="input"
                  value={(settings[field] as string) ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, [field]: e.target.value })
                  }
                />
              </div>
            )
          )}
          <div className="sm:col-span-2">
            <label className="label">{fieldLabels.aboutContent}</label>
            <textarea
              className="input"
              rows={3}
              value={settings.aboutContent}
              onChange={(e) =>
                setSettings({ ...settings, aboutContent: e.target.value })
              }
            />
          </div>
        </div>
      </details>

      <div className="card">
        <WorkScheduleEditor
          initialSchedule={buildScheduleFromSettings(settings)}
          slotInterval={settings.slotInterval}
          onSlotIntervalChange={(n) => setSettings({ ...settings, slotInterval: n })}
          closedDays={closedDays}
          onClosedDaysChange={setClosedDays}
        />
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={saving}
        onClick={() => saveSiteContent()}
      >
        Site içeriğini kaydet
      </button>

      <details className="card" id="ustalar">
        <summary>▸ Ustalar</summary>
        {multiAdminEnabled ? (
          <StaffAdminPanel />
        ) : (
          <p className="mt-1 text-[11px] text-gray-600">
            Usta eklemek için <code className="text-[10px]">.env</code>{" "}
            dosyasında{" "}
            <code className="text-[10px]">MULTI_ADMIN_ENABLED=&quot;true&quot;</code>{" "}
            ayarlayıp sunucuyu yeniden başlatın.
          </p>
        )}
      </details>
    </div>
  );
}
