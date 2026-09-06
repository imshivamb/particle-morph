import { clampProgress } from "../progress";

export function sequenceProgress(
  progress: number,
  stepCount: number,
): { index: number; local: number } {
  const count = Math.max(1, Math.floor(stepCount));
  const t = clampProgress(progress);
  if (t >= 1) return { index: count - 1, local: 1 };
  const scaled = t * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: scaled - index };
}
