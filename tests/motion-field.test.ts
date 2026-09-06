import { describe, expect, it } from "vitest";

import {
  dominantBehavior,
  ease,
  emptyBehaviorWeights,
  envelopeAt,
  exclusiveBehavior,
  mixAtProgress,
  normalizeMix,
} from "../src/engine/motion-field";
import { sequenceProgress } from "../src/engine/drivers/sequence-progress";
import {
  resolveMotion,
  TRANSITION_PRESETS,
} from "../src/engine/transitions";

describe("behavior mix", () => {
  it("keeps exclusive expand as a single influence", () => {
    expect(exclusiveBehavior("expand")).toEqual({
      ...emptyBehaviorWeights(),
      expand: 1,
    });
    expect(dominantBehavior(exclusiveBehavior("orbit"))).toBe("orbit");
  });

  it("adds weighted influences without replacing the field", () => {
    const mix = normalizeMix({ expand: 0.8, turbulence: 0.35, orbit: 0.15 });
    expect(mix.expand).toBe(0.8);
    expect(mix.turbulence).toBe(0.35);
    expect(mix.orbit).toBe(0.15);
    expect(mix.scatter).toBe(0);
    expect(dominantBehavior(mix)).toBe("mix");
  });

  it("clamps broken weights", () => {
    expect(normalizeMix({ expand: -2, scatter: Number.NaN }).expand).toBe(0);
  });
});

describe("envelopes", () => {
  it("treats a number as a constant weight", () => {
    expect(envelopeAt(0.4, 0)).toBe(0.4);
    expect(envelopeAt(0.4, 1)).toBe(0.4);
  });

  it("lerps from → to with organic easing", () => {
    expect(envelopeAt({ from: 0, to: 1, easing: "linear" }, 0.25)).toBe(0.25);
    expect(ease("organic", 0.5)).toBe(0.5);
    expect(mixAtProgress({ expand: { from: 0, to: 0.8 } }, 1).expand).toBe(0.8);
    expect(mixAtProgress({ expand: { from: 0, to: 0.8 } }, 0).expand).toBe(0);
  });
});

describe("resolveMotion", () => {
  it("accepts a preset, an exclusive id, or a mix", () => {
    expect(resolveMotion("organic")).toEqual({
      spec: TRANSITION_PRESETS.organic,
      preset: "organic",
    });
    expect(resolveMotion("scatter").spec).toEqual({ scatter: 1 });
    expect(resolveMotion({ expand: 0.8, turbulence: 0.35 }).spec).toEqual({
      expand: 0.8,
      turbulence: 0.35,
    });
  });
});

describe("sequenceProgress", () => {
  it("splits one 0–1 into local steps", () => {
    expect(sequenceProgress(0, 3)).toEqual({ index: 0, local: 0 });
    expect(sequenceProgress(0.5, 3).index).toBe(1);
    expect(sequenceProgress(1, 3)).toEqual({ index: 2, local: 1 });
  });
});
