import type { ParticleQuality } from "./motion";
import type { ParticleTarget } from "./target";

export type RendererId = "points" | "sprites" | "shards";

export const BEHAVIOR_IDS = [
  "settle",
  "expand",
  "scatter",
  "implode",
  "turbulence",
  "orbit",
] as const;

export type BehaviorId = (typeof BEHAVIOR_IDS)[number];

export const DRIVER_IDS = ["auto", "manual", "scroll", "pointer"] as const;

export type DriverId = (typeof DRIVER_IDS)[number];

export type PointerMode = "off" | "repel" | "attract";

export type PointerField = {
  x: number;
  y: number;
  radius: number;
  strength: number;
  mode: PointerMode;
};

export type MorphLook = {
  expansionStrength: number;
  turbulenceStrength: number;
  synchronization: number;
  particleSize: number;
  glow: number;
  behavior: BehaviorId;
  behaviorStrength: number;
  pointer: PointerField;
};

export function isBehaviorId(value: string): value is BehaviorId {
  return (BEHAVIOR_IDS as readonly string[]).includes(value);
}

export function isDriverId(value: string): value is DriverId {
  return (DRIVER_IDS as readonly string[]).includes(value);
}

export function behaviorModeIndex(id: BehaviorId): number {
  switch (id) {
    case "settle":
      return 0;
    case "expand":
      return 1;
    case "scatter":
      return 2;
    case "implode":
      return 3;
    case "turbulence":
      return 4;
    case "orbit":
      return 5;
    default: {
      const exhaustive: never = id;
      throw new Error(`Unknown behavior "${String(exhaustive)}"`);
    }
  }
}

export function pointerModeIndex(mode: PointerMode): number {
  switch (mode) {
    case "off":
      return 0;
    case "repel":
      return 1;
    case "attract":
      return 2;
    default: {
      const exhaustive: never = mode;
      throw new Error(`Unknown pointer mode "${String(exhaustive)}"`);
    }
  }
}

export const DEFAULT_POINTER: PointerField = {
  x: 0,
  y: 0,
  radius: 0.72,
  strength: 0.7,
  mode: "off",
};

export type RendererConfig = {
  size: number;
  opacity: number;
};

export type ParticleFieldState = {
  activeTarget: string | null;
  progress: number;
  quality: ParticleQuality;
  renderer: RendererId;
  driver: DriverId;
  behavior: BehaviorId;
};

export type RegisteredTarget = {
  id: string;
  target: ParticleTarget;
};
