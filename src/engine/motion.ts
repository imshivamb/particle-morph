export type ParticleQuality = "low" | "medium" | "high";

export type ParticleQualityConfig = {
  particleCount: number;
  maxDpr: 1 | 1.5 | 2;
};

export type ParticleMotionSample = {
  targetMix: number;
  expansion: number;
  turbulence: number;
  settle: number;
};

const QUALITY: Record<ParticleQuality, ParticleQualityConfig> = {
  low: { particleCount: 64 * 64, maxDpr: 1 },
  medium: { particleCount: 128 * 128, maxDpr: 1.5 },
  high: { particleCount: 256 * 256, maxDpr: 2 },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  const progress = clamp01((value - edgeStart) / (edgeEnd - edgeStart));
  return progress * progress * (3 - 2 * progress);
}

export function getParticleQualityConfig(
  quality: ParticleQuality,
): ParticleQualityConfig {
  return QUALITY[quality];
}

export function resolveParticleQuality(input: {
  viewportWidth: number;
  hardwareConcurrency?: number;
  reducedMotion: boolean;
}): ParticleQuality {
  if (input.reducedMotion) return "low";
  if (input.viewportWidth >= 1_280 && (input.hardwareConcurrency ?? 4) >= 8) {
    return "high";
  }
  return "medium";
}

export function sampleParticleMotion(progressValue: number): ParticleMotionSample {
  const progress = clamp01(progressValue);
  return {
    targetMix: smoothstep(0.32, 0.88, progress),
    expansion:
      smoothstep(0.22, 0.48, progress) * (1 - smoothstep(0.48, 0.78, progress)),
    turbulence: 4 * progress * (1 - progress),
    settle: smoothstep(0.78, 1, progress),
  };
}
