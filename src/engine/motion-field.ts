import { clampProgress } from "./progress";
import { BEHAVIOR_IDS, type BehaviorId } from "./types";

export type BehaviorWeights = Record<BehaviorId, number>;
export type BehaviorMix = Partial<BehaviorWeights>;
export type EasingId = "linear" | "organic" | "easeIn" | "easeOut";

export type MotionEnvelope = {
  from?: number;
  to?: number;
  easing?: EasingId;
};

export type MotionSpec = Partial<Record<BehaviorId, number | MotionEnvelope>>;

export function emptyBehaviorWeights(): BehaviorWeights {
  return {
    settle: 0,
    expand: 0,
    scatter: 0,
    implode: 0,
    turbulence: 0,
    orbit: 0,
  };
}

export function exclusiveBehavior(id: BehaviorId): BehaviorWeights {
  return { ...emptyBehaviorWeights(), [id]: 1 };
}

export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function normalizeMix(mix: BehaviorMix): BehaviorWeights {
  const next = emptyBehaviorWeights();
  for (const id of BEHAVIOR_IDS) {
    next[id] = clampWeight(mix[id] ?? 0);
  }
  return next;
}

export function dominantBehavior(mix: BehaviorWeights): BehaviorId | "mix" {
  const active = BEHAVIOR_IDS.filter((id) => mix[id] > 0);
  if (active.length === 1) return active[0];
  return "mix";
}

export function isEasingId(value: string): value is EasingId {
  return (
    value === "linear" ||
    value === "organic" ||
    value === "easeIn" ||
    value === "easeOut"
  );
}

export function ease(id: EasingId, progress: number): number {
  const t = clampProgress(progress);
  switch (id) {
    case "linear":
      return t;
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "organic":
      return t * t * (3 - 2 * t);
    default: {
      const exhaustive: never = id;
      throw new Error(`Unknown easing "${String(exhaustive)}"`);
    }
  }
}

export function envelopeAt(spec: number | MotionEnvelope, progress: number): number {
  if (typeof spec === "number") return clampWeight(spec);
  const from = spec.from ?? 0;
  const to = spec.to ?? 1;
  return from + (to - from) * ease(spec.easing ?? "organic", progress);
}

export function mixAtProgress(spec: MotionSpec, progress: number): BehaviorWeights {
  const next = emptyBehaviorWeights();
  for (const id of BEHAVIOR_IDS) {
    const item = spec[id];
    if (item === undefined) continue;
    next[id] = envelopeAt(item, progress);
  }
  return next;
}

export function specFromMix(mix: BehaviorMix): MotionSpec {
  const spec: MotionSpec = {};
  for (const id of BEHAVIOR_IDS) {
    const value = mix[id];
    if (value && value > 0) spec[id] = value;
  }
  return Object.keys(spec).length > 0 ? spec : { expand: 1 };
}
