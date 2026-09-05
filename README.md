# Morph Engine

A small WebGL kit that keeps **one field of points** and morphs that same field from one shape to another.

It is not a crossfade and not two pictures stacked. An image or SVG is sampled into a fixed number of points. Those points destablize, open into a cloud, and settle as the next form. Click **Mark / Nova / Glyph**, or drop two of your own images. Files stay in the browser.

This is not a Nutricheck product. The playground is a demo of the engine.

## Playground

```bash
npm install
npm test
npm run dev
```

Open the local Vite URL. Click **Mark**, **Nova**, or **Glyph** for the authored morphs. Drop two of your own images to morph them in the same field. Files stay in the browser.

## Public API

```ts
import {
  ParticleMorphEngine,
  loadParticleTargetFromUrl,
} from "./src/engine";

const engine = new ParticleMorphEngine({
  canvas,
  quality: "medium",
  reducedMotion: false,
});

engine.registerTarget("wordmark", await loadParticleTargetFromUrl("/a.svg", {
  particleCount: 128 * 128,
  seed: 1,
  alphaThreshold: 24,
  depth: 0.22,
}));
engine.registerTarget("icon", await loadParticleTargetFromUrl("/b.svg", {
  particleCount: 128 * 128,
  seed: 2,
  alphaThreshold: 24,
  depth: 0.22,
}));

engine.morphTo("icon");
engine.setProgress(0.5);
```

`morphTo` takes a semantic id. It does not take texture-layer indices. `setProgress` is the driver remote: buttons, sliders, and later scroll all write the same `0…1` value.

Targets must have the same particle count. Look, camera, and duration stay on the show (`setLook`, `morphTo` options), not inside the kernel.

## What v1 is not

Mesh, text, or SVG authoring tools. Video export. WebGPU. Physics. Gesture or scroll drivers.
