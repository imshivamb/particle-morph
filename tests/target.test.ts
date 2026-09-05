import { describe, expect, it } from "vitest";

import { buildParticleTarget, type PixelSource } from "../src/engine/target";

function solidShape(width: number, height: number): PixelSource {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside = x > 8 && x < 24 && y > 8 && y < 24;
      const offset = (y * width + x) * 4;
      data[offset] = inside ? 40 : 0;
      data[offset + 1] = inside ? 180 : 0;
      data[offset + 2] = inside ? 220 : 0;
      data[offset + 3] = inside ? 255 : 0;
    }
  }
  return { width, height, data };
}

describe("buildParticleTarget", () => {
  it("samples a fixed particle count from visible pixels", () => {
    const target = buildParticleTarget(solidShape(32, 32), {
      particleCount: 64,
      seed: 7,
      alphaThreshold: 20,
      depth: 0.3,
    });

    expect(target.positions.length).toBe(64 * 3);
    expect(target.colors.length).toBe(64 * 3);
    expect(target.seeds.length).toBe(64);
  });

  it("is deterministic for the same image and seed", () => {
    const source = solidShape(32, 32);
    const options = {
      particleCount: 48,
      seed: 2026,
      alphaThreshold: 20,
      depth: 0.25,
    };

    expect(buildParticleTarget(source, options)).toEqual(
      buildParticleTarget(source, options),
    );
  });

  it("rejects a fully transparent image", () => {
    const data = new Uint8ClampedArray(16);
    expect(() =>
      buildParticleTarget(
        { width: 2, height: 2, data },
        { particleCount: 8, seed: 1, alphaThreshold: 20, depth: 0.2 },
      ),
    ).toThrow(/no visible pixels/i);
  });

  it("keeps shallow depth inside the requested range", () => {
    const target = buildParticleTarget(solidShape(32, 32), {
      particleCount: 80,
      seed: 3,
      alphaThreshold: 20,
      depth: 0.2,
    });

    for (let index = 2; index < target.positions.length; index += 3) {
      expect(target.positions[index]).toBeGreaterThanOrEqual(-0.2);
      expect(target.positions[index]).toBeLessThanOrEqual(0.2);
    }
  });
});
