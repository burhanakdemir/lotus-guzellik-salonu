export const NOTIFICATION_KIND_LABELS = {
  INFO: "Bilgi",
  CAMPAIGN: "Kampanya",
  REMINDER: "Hatırlatma",
  SYSTEM: "Sistem",
} as const;

export type NotificationKindKey = keyof typeof NOTIFICATION_KIND_LABELS;
