import { getParticleQualityConfig } from "../motion";

import type { BaseTargetOptions } from "./types";

export function resolveParticleCount(options: BaseTargetOptions): number {
  if (options.particleCount !== undefined) {
    if (!Number.isInteger(options.particleCount) || options.particleCount <= 0) {
      throw new Error("Particle count must be a positive integer");
    }
    return options.particleCount;
  }
  return getParticleQualityConfig(options.quality ?? "medium").particleCount;
}

export function resolveSeed(options: BaseTargetOptions): number {
  return options.seed ?? 1;
}
