# Scree

A small WebGL kit that keeps **one field of points** and morphs that same field from one shape to another.

It is not a crossfade and not two pictures stacked. An image, SVG, word, mesh, or procedural shape is sampled into the same particle target. Those points destablize, open into a cloud, and settle as the next form. The engine does not care where the target came from.

The playground is a demo of the engine.

**Live:** [scree-tau.vercel.app](https://scree-tau.vercel.app)

Pushes to `main` redeploy that URL.

## Playground

```bash
npm install
npm test
npm run dev
```

Open the local Vite URL. The **Target** panel is Image / Text / 3D / Shape. **Points / Sprites / Shards** change the draw. **Organic / Explode / Dissolve / Vortex** mix motions. **Auto / Manual / Scroll / Pointer** write progress. **Showcase** scrolls Image → Text → 3D → Shape on the same field. **Copy code** copies a snippet you can paste next to a Scree canvas. Files stay in the browser.

## Public API

```ts
import {
  Scree,
  createImageTarget,
  createTextTarget,
  createMeshTarget,
  createSphereTarget,
} from "./src/engine";

const engine = new Scree({
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

engine.setBehavior({ expand: 0.8, turbulence: 0.35, orbit: 0.15 });
engine.transition({
  from: "logo",
  to: "hello",
  durationSeconds: 1.6,
  motion: "organic",
});
engine.setRenderer("shards");
engine.setDriver("manual");
engine.setProgress(0.5);
```

`setBehavior("expand")` is still exclusive expand. A mix adds displacements; it does not swap the field. `transition` picks the pair and the mix. Drivers only write `t` and pointer. Changing one of those does not require changing the others.

Every generator returns the same `ParticleTarget`: `{ positions, colors, seeds, normals, count }`. Targets must share a particle count. `setRenderer` only changes how the field is drawn.

- `points` — glow dots. Default and cheapest.
- `sprites` — instanced soft quads, a little larger than points.
- `shards` — instanced triangles that rotate in flight.

`size` is a multiplier around the renderer’s own default, not a pixel value.

Presets: `organic`, `dissolve`, `explode`, `implode`, `vortex`, `reveal`, `disperse`, `reassemble`. Weights can also be envelopes: `{ expand: { from: 0, to: 0.8, easing: "organic" } }`.

## What this is not

Audio, webcam, WebGPU, physics, or a React package. Those come later.
