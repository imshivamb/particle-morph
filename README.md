# Morph Engine

A small WebGL kit that keeps **one field of points** and morphs that same field from one shape to another.

It is not a crossfade and not two pictures stacked. An image, SVG, word, mesh, or procedural shape is sampled into the same particle target. Those points destablize, open into a cloud, and settle as the next form. The engine does not care where the target came from.

This is not a Nutricheck product. The playground is a demo of the engine.

## Playground

```bash
npm install
npm test
npm run dev
```

Open the local Vite URL. The left row is the source axis: **Image / Text / 3D / Sphere**. The right renderer panel is the draw axis: **Points / Sprites / Shards**. Size and opacity are remembered per skin. Drop two images, type a word, drop a GLB, or pick a shape. Files stay in the browser.

## Public API

```ts
import {
  ParticleMorphEngine,
  createImageTarget,
  createTextTarget,
  createMeshTarget,
  createSphereTarget,
} from "./src/engine";

const engine = new ParticleMorphEngine({
  canvas,
  quality: "medium",
  reducedMotion: false,
});

engine.registerTarget("logo", await createImageTarget("/logo.png", {
  particleCount: 128 * 128,
}));
engine.registerTarget("hello", createTextTarget("HELLO", {
  particleCount: 128 * 128,
}));
engine.registerTarget("heart", await createMeshTarget("/heart.glb", {
  particleCount: 128 * 128,
}));
engine.registerTarget("sphere", createSphereTarget({
  particleCount: 128 * 128,
}));

engine.morphTo("hello");
engine.setRenderer("shards");
```

Every generator returns the same `ParticleTarget`: `{ positions, colors, seeds, normals, count }`. Targets must share a particle count. `setRenderer` only changes how the field is drawn.

- `points` — glow dots. Default and cheapest.
- `sprites` — instanced soft quads, a little larger than points.
- `shards` — instanced triangles that rotate in flight.

`size` is a multiplier around the renderer’s own default, not a pixel value.

## What this phase is not

Data, maps, audio, webcam, WebGPU, physics, or a React package. Those come later.
