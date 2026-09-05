import type { ParticleQuality } from "./motion";
import type { ParticleTarget } from "./target";

export type RendererId = "points" | "sprites" | "shards";

export type MorphLook = {
  expansionStrength: number;
  turbulenceStrength: number;
  synchronization: number;
  particleSize: number;
  glow: number;
};

export type RendererConfig = {
  size: number;
  opacity: number;
};

export type DriverId = "program" | "slider" | "scroll" | "pointer" | "time";

export type ParticleFieldState = {
  activeTarget: string | null;
  progress: number;
  quality: ParticleQuality;
  renderer: RendererId;
};

export type RegisteredTarget = {
  id: string;
  target: ParticleTarget;
};
