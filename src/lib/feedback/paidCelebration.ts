/** Som curto e fofo ao marcar lançamento como pago (Web Audio API, sem arquivo externo). */
export function playPaidCelebrationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const notes = [
      { freq: 523.25, at: 0, dur: 0.12 },
      { freq: 659.25, at: 0.09, dur: 0.14 },
      { freq: 783.99, at: 0.18, dur: 0.22 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + note.at;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);

      osc.start(t);
      osc.stop(t + note.dur + 0.05);
    }

    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* autoplay bloqueado ou sem suporte */
  }
}
