import { describe, expect, it } from "vitest";

import {
  resolveParticleQuality,
  sampleParticleMotion,
} from "../src/engine/motion";

describe("sampleParticleMotion", () => {
  it("starts settled on the source with no cloud", () => {
    const sample = sampleParticleMotion(0);

    expect(sample.targetMix).toBe(0);
    expect(sample.expansion).toBe(0);
    expect(sample.settle).toBe(0);
  });

  it("opens a cloud in the middle of the morph", () => {
    const sample = sampleParticleMotion(0.5);

    expect(sample.expansion).toBeGreaterThan(0.4);
    expect(sample.turbulence).toBeGreaterThan(0.8);
    expect(sample.targetMix).toBeGreaterThan(0.2);
    expect(sample.targetMix).toBeLessThan(0.8);
  });

  it("settles on the destination with the cloud gone", () => {
    const sample = sampleParticleMotion(1);

    expect(sample.targetMix).toBe(1);
    expect(sample.expansion).toBe(0);
    expect(sample.settle).toBe(1);
  });
});

describe("resolveParticleQuality", () => {
  it("uses the low tier when motion should be reduced", () => {
    expect(
      resolveParticleQuality({
        viewportWidth: 1600,
        hardwareConcurrency: 16,
        reducedMotion: true,
      }),
    ).toBe("low");
  });

  it("uses the high tier on a large capable desktop", () => {
    expect(
      resolveParticleQuality({
        viewportWidth: 1440,
        hardwareConcurrency: 8,
        reducedMotion: false,
      }),
    ).toBe("high");
  });
});
