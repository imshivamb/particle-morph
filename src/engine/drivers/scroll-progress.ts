import { clampProgress } from "../progress";

export function scrollProgress(scroller: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): number {
  const range = scroller.scrollHeight - scroller.clientHeight;
  if (range <= 0) return 0;
  return clampProgress(scroller.scrollTop / range);
}