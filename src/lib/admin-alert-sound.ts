/** Admin panel — onay bekleyen randevu uyarı sesi (Web Audio) */

export const PENDING_ALERT_DURATION_MS = 15_000;
export const PENDING_ALERT_REPEAT_MS = 5 * 60 * 1000;

let ctx: AudioContext | null = null;
let alertGeneration = 0;
let alertTimers: ReturnType<typeof setTimeout>[] = [];
let alertCompleteCallback: (() => void) | null = null;

export function unlockAdminAlertAudio(): void {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* tarayıcı engeli */
  }
}

function playTone(
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "triangle"
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playAttentionBurst() {
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.03;
  const melody = [
    { f: 988, t: 0, d: 0.14 },
    { f: 1319, t: 0.1, d: 0.16 },
    { f: 1568, t: 0.22, d: 0.2 },
    { f: 1760, t: 0.38, d: 0.24 },
  ];
  for (const n of melody) {
    playTone(n.f, t0 + n.t, n.d, 0.68, "triangle");
    playTone(n.f * 0.5, t0 + n.t, n.d, 0.32, "square");
  }
}

function finishAlertSession(generation: number) {
  if (generation !== alertGeneration) return;
  alertTimers.forEach(clearTimeout);
  alertTimers = [];
  const cb = alertCompleteCallback;
  alertCompleteCallback = null;
  cb?.();
}

/** Çalan uyarıyı hemen durdur (onay verildiğinde) */
export function stopPendingApprovalAlert(): void {
  alertGeneration++;
  alertTimers.forEach(clearTimeout);
  alertTimers = [];
  const cb = alertCompleteCallback;
  alertCompleteCallback = null;
  cb?.();
}

/**
 * Canlı uyarı — varsayılan 15 sn, ~0.85 sn aralıklarla tekrarlayan dizi.
 * onComplete: süre bitince veya stopPendingApprovalAlert ile kesilince bir kez çağrılır.
 */
export function playPendingApprovalAlert(
  durationMs = PENDING_ALERT_DURATION_MS,
  onComplete?: () => void
): void {
  if (typeof window === "undefined") return;

  stopPendingApprovalAlert();
  const generation = alertGeneration;

  try {
    unlockAdminAlertAudio();
    if (!ctx) {
      onComplete?.();
      return;
    }

    alertCompleteCallback = onComplete ?? null;
    const endAt = Date.now() + durationMs;
    const gapMs = 820;

    const tick = () => {
      if (generation !== alertGeneration) return;
      if (Date.now() >= endAt) {
        finishAlertSession(generation);
        return;
      }
      playAttentionBurst();
      const timer = setTimeout(tick, gapMs);
      alertTimers.push(timer);
    };

    tick();
  } catch {
    onComplete?.();
  }
}

/** @deprecated playPendingApprovalAlert kullanın */
export function playNewAppointmentAlert(): void {
  playPendingApprovalAlert(PENDING_ALERT_DURATION_MS);
}
