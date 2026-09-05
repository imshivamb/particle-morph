import { BoxGeometry } from "three";
import { describe, expect, it } from "vitest";

import {
  assertSameTargetCount,
  createCubeTarget,
  createHelixTarget,
  createMeshTargetFromGeometry,
  createSphereTarget,
  createSpiralTarget,
  createTorusTarget,
  normalizePositions,
} from "../src/engine/target";

describe("target generators", () => {
  it("centers and scales arbitrary coordinates into a shared box", () => {
    const positions = new Float32Array([100, 0, 0, -20, 10, 4]);
    normalizePositions(positions);
    expect(positions[0]).toBeCloseTo(1);
    expect(positions[3]).toBeCloseTo(-1);
    expect(Math.abs(positions[1] ?? 0)).toBeLessThan(0.2);
  });

  it("builds equal-count procedural and mesh targets", () => {
    const options = { particleCount: 96, seed: 4 };
    const sphere = createSphereTarget(options);
    const torus = createTorusTarget(options);
    const cube = createCubeTarget(options);
    const helix = createHelixTarget(options);
    const spiral = createSpiralTarget(options);
    const mesh = createMeshTargetFromGeometry(new BoxGeometry(2, 2, 2), options);

    for (const target of [sphere, torus, cube, helix, spiral, mesh]) {
      expect(target.count).toBe(96);
      expect(target.normals.length).toBe(96 * 3);
    }
    expect(() => assertSameTargetCount(sphere, mesh)).not.toThrow();
  });

  it("keeps sphere samples on a unit-ish surface before any later scale", () => {
    const sphere = createSphereTarget({ particleCount: 48, seed: 1 });
    let min = Infinity;
    let max = 0;
    for (let index = 0; index < sphere.count; index += 1) {
      const x = sphere.positions[index * 3] ?? 0;
      const y = sphere.positions[index * 3 + 1] ?? 0;
      const z = sphere.positions[index * 3 + 2] ?? 0;
      const radius = Math.hypot(x, y, z);
      min = Math.min(min, radius);
      max = Math.max(max, radius);
    }
    expect(min).toBeGreaterThan(0.9);
    expect(max).toBeLessThan(1.1);
  });
});
