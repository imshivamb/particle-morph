import { describe, expect, it } from "vitest";

import { fieldPointFromClient } from "../src/engine/drivers/pointer-from-event";
import { scrollProgress } from "../src/engine/drivers/scroll-progress";
import { clampProgress, shouldPlayAutoTween } from "../src/engine/progress";

describe("clampProgress", () => {
  it("keeps values inside 0 to 1", () => {
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(0.5)).toBe(0.5);
    expect(clampProgress(1)).toBe(1);
  });

  it("clamps out-of-range and non-finite values", () => {
    expect(clampProgress(-2)).toBe(0);
    expect(clampProgress(4)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe("shouldPlayAutoTween", () => {
  it("plays only when Auto owns progress", () => {
    expect(
      shouldPlayAutoTween({
        driver: "auto",
        durationSeconds: 2.6,
        reducedMotion: false,
      }),
    ).toBe(true);
    expect(
      shouldPlayAutoTween({
        driver: "manual",
        durationSeconds: 2.6,
        reducedMotion: false,
      }),
    ).toBe(false);
    expect(
      shouldPlayAutoTween({
        driver: "scroll",
        durationSeconds: 2.6,
        reducedMotion: false,
      }),
    ).toBe(false);
    expect(
      shouldPlayAutoTween({
        driver: "auto",
        durationSeconds: 0,
        reducedMotion: false,
      }),
    ).toBe(false);
  });
});

describe("scrollProgress", () => {
  it("maps a scroller to 0–1", () => {
    expect(
      scrollProgress({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }),
    ).toBe(0);
    expect(
      scrollProgress({ scrollTop: 400, scrollHeight: 1000, clientHeight: 200 }),
    ).toBe(0.5);
    expect(
      scrollProgress({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 }),
    ).toBe(1);
  });
});

describe("fieldPointFromClient", () => {
  it("puts the viewport center on the origin", () => {
    expect(
      fieldPointFromClient({
        clientX: 450,
        clientY: 450,
        width: 900,
        height: 900,
      }),
    ).toEqual({ x: 0, y: 0 });
  });
});
