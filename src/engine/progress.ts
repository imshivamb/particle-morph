import type { DriverId } from "./types";

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function shouldPlayAutoTween(input: {
  driver: DriverId;
  durationSeconds: number;
  reducedMotion: boolean;
}): boolean {
  return input.driver === "auto" && input.durationSeconds > 0 && !input.reducedMotion;
}
