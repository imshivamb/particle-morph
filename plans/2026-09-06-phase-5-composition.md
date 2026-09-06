# Phase 5 — Composition & Advanced Inputs

> Implement in this session. Kernel stays small. New worlds are new plugs.

**Goal:** Turn Scree from a collection of working capabilities into a composable visual system.

**Architecture:** Behaviors produce displacements. Drivers produce values. Renderers only draw. None of those layers own each other.

**Not in this phase:** WebGPU, audio, webcam, gesture, embeddings, live data, React package, npm, physics.

---

## Model

```
base mix(source, dest, t)
  + expand displacement * weight
  + turbulence displacement * weight
  + orbit displacement * weight
  + …
  + pointer displacement
  → final particle position
```

Numbers are constant weights on the existing flight-shaped displacements. `{ from, to, easing }` is an extra envelope over the same `t`.

## Public API

```ts
engine.setBehavior({ expand: 0.8, turbulence: 0.35, orbit: 0.15 });
engine.transition({
  from: "mark",
  to: "text",
  durationSeconds: 1.6,
  motion: "organic",
});
engine.setDriver("manual");
engine.setProgress(0.5);
```

`setBehavior("expand")` still means exclusive expand.

## Files

- `src/engine/motion-field.ts` — mix, easing, envelopes
- `src/engine/transitions.ts` — presets + `resolveMotion`
- `src/engine/drivers/sequence-progress.ts` — scroll showcase helper
- `src/engine/field-motion.ts` — additive GLSL influences
- `src/engine/scene.ts` — `transition()`, mix-aware `setBehavior`
- Playground: presets, mix sliders, copy code, one scroll showcase

## Done when

Changing target, renderer, mix, or driver does not require changing the others. One scroll showcase walks image → text → 3D on the same field.
