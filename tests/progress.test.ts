import { describe, expect, it } from "vitest";

import { clampProgress } from "../src/engine/progress";

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
