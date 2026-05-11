import type { Keystroke } from "../types/index.ts";

const WINDOW_MS = 10_000;

function effectiveKeystrokes(keystrokes: Keystroke[]): Keystroke[] {
  return keystrokes.filter((k) => k.action === "type" && !k.corrected);
}

export function calcWPM(keystrokes: Keystroke[], now: number): number {
  const recent = effectiveKeystrokes(keystrokes).filter(
    (k) => k.correct && now - k.timestamp <= WINDOW_MS,
  );
  // 5 chars = 1 word, window is 10s → multiply by 6 to get per-minute
  return Math.round((recent.length / 5) * 6);
}

export function calcFinalWPM(keystrokes: Keystroke[], startTime: number, endTime: number): number {
  const elapsedMinutes = Math.max((endTime - startTime) / 60_000, 1 / 60);
  const correct = effectiveKeystrokes(keystrokes).filter((k) => k.correct).length;
  return Math.round(correct / 5 / elapsedMinutes);
}

export function calcAccuracy(keystrokes: Keystroke[]): number {
  const effective = effectiveKeystrokes(keystrokes);
  if (effective.length === 0) return 100;
  const correct = effective.filter((k) => k.correct).length;
  return Math.round((correct / effective.length) * 100);
}
