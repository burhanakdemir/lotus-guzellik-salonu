/** Admin panel — yeni onay bekleyen randevu uyarı sesi (Web Audio) */

let ctx: AudioContext | null = null;
let lastPlayedAt = 0;

export function unlockAdminAlertAudio(): void {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* tarayıcı engeli */
  }
}

function tone(
  frequency: number,
  start: number,
  duration: number,
  volume = 0.38
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Dikkat çekici çift dizi bip (yaklaşık 2 sn) */
export function playNewAppointmentAlert(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPlayedAt < 4000) return;
  lastPlayedAt = now;
  try {
    unlockAdminAlertAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.05;
    const seq = [
      { f: 784, t: 0, d: 0.14 },
      { f: 988, t: 0.18, d: 0.14 },
      { f: 1175, t: 0.36, d: 0.18 },
      { f: 988, t: 0.58, d: 0.14 },
      { f: 1175, t: 0.76, d: 0.22 },
      { f: 1319, t: 1.02, d: 0.28 },
    ];
    for (const n of seq) {
      tone(n.f, t0 + n.t, n.d);
    }
    // İkinci tekrar — kaçırılmasın diye
    for (const n of seq) {
      tone(n.f, t0 + 1.35 + n.t, n.d, 0.32);
    }
  } catch {
    /* sessiz */
  }
}
