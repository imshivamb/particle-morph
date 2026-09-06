# Scree — Possibility Map

Date: 2026-09-05
Status: exploration, no direction locked
Related: `plans/2026-09-04-001-feat-personal-particle-morph-kit-plan.md`

This is not a build spec. It is a map of what the current kernel can grow into, including useful products, not only visual demos.

---

## The actual primitive

v1 looks like “turn picture A into picture B.” That is only the first show.

The kernel is:

1. Anything becomes a **target** of equal-length points `{ positions, colors, seeds }`.
2. One **particle field** is shared across all states. Nothing is swapped or crossfaded.
3. A **progress** value (0→1) destablizes, opens a cloud, and settles.
4. A **show** decides look, camera, timing, and what drives progress.

If a thing can be sampled into that target, and a human event can move progress, it is in scope for this engine. If it needs bones, cloth, fluids, or photoreal characters, it is a different product.

---

## Layer model

Think in plugs, not features.

| Layer | Job | v1 today |
|---|---|---|
| **Targets** | What the field can become | 2D image / SVG silhouette |
| **Drivers** | What moves `progress` | Button + duration tween |
| **Look** | How points are drawn | Glow points, cloud, idle noise |
| **Shows** | The product a person uses | Playground presets + drop-two-images |
| **Library** | How other people reuse it | Local `src/engine` API only |

Every idea below is one of these plugs. The kernel should stay small. New worlds are new plugs.

---

## What the research repos already proved

Do not vendor these trees. Steal the capability, rewrite it.

- **TSL morphing particles** — 3D mesh surface sampling, many models in a texture atlas, instant switch, curl/chaos/oscillation on the GPU. WebGPU/TSL. Animals, vehicles, props as point clouds.
- **Ionian** — engine-shaped API: `registerMesh`, `setOverallProgress`, matcap/color sequences, host owns scroll/camera. GPGPU attraction. The “library” ancestor.
- **Reactive particle system** — image pixels as particles, mouse ripples via an offscreen interaction texture, explode/settle.
- **Gesture particle simulation** — parametric shapes (sphere, heart, flower, saturn, tornado), pinch expand/contract, fist to change form, hand as a 3D controller.

Modern award-site work in 2026 uses the same primitive with scroll, music, and hover as drivers (Codrops: scroll-driven WebGPU scenes, music-reactive morph).

---

## Target plugs — what the field can become

### Already possible (v1)

- PNG, WebP, JPEG, SVG silhouettes
- Color sampled from the artwork
- Fixed particle budget (quality tiers)

### Near (same kernel, new sampler)

- **Live type** — render a word offscreen, sample it. Headline ↔ mark ↔ CTA.
- **Icons / Figma exports** — brand systems, product glyphs.
- **Parametric math** — sphere, torus, spiral, wave, flower. No asset file.
- **Video / webcam frames** — sample a frame, morph to the next or to a logo. “You become the mark.”
- **3D mesh surfaces** — GLB/GLTF via surface sampling (TSL + Ionian already did this). This is the honest 3D path: points on a surface, not a game character.
- **Multi-mesh atlas** — many sculptures resident, zero-cost switch (TSL).
- **Data as form** — chart, map, waveform, table → points. Numbers become a silhouette.

### Later

- Depth maps / 2.5D photos
- Point-cloud / LiDAR dumps
- Multi-target blends (A + B at once, not only A→B)
- SDF / signed-distance shapes for sharper type

---

## Driver plugs — modern animation language

Same particles. Different remote.

- **Click / timeline** — what v1 does
- **Scroll** — Ionian’s `setOverallProgress`. Page chapters: word → product → icon
- **Hover / cursor ripples** — reactive-repo interaction canvas
- **Drag / pinch / hand** — gesture-repo expand and relocate
- **Audio / music** — kick opens the cloud, sustain settles the form
- **Loop / ping-pong** — living idle sculpture
- **Pointer physics** — push the field, spring back (hologram-style GPU pusher)
- **App state** — loading → ready, error → ok, empty → filled. Useful, not decorative
- **Scrub / editor** — a designer drags progress like After Effects, without being After Effects

---

## Look plugs

- Glow vs hard vs smooth dots (TSL already treats this as a skin)
- Matcap / metal / color sequences tied to the same progress (Ionian)
- Bloom on particles that travel farthest
- Depth fog, additive vs normal blending
- Reduced-motion snap (already required)

Look must stay off the kernel. A medical explainer and a music visualizer should share targets + progress and disagree only here.

---

## Shows — visually strong

These are the obvious portfolio / brand uses.

- Logo dissolve and brand film
- Landing-page scroll morph
- Product colorway / variant morph
- Type as particles
- Live selfie → mark
- Gesture sculpture
- Audio-reactive identity
- 3D sculpture reel (drop GLBs)
- Cinematic camera dolly while the field settles

Useful, but they are still “look at this.” The next section is the broader bet.

---

## Shows — useful to people

The engine is a **state-change explainer**. People need to see “this became that” without a hard cut. That is the utility.

### Understand a change

- **Before / after** — photo, product, face, city, wound, renovation. One field, so the eye trusts it is the same subject.
- **Process** — seed → plant, ore → part, dough → bread, sketch → product. Education and manufacturing.
- **Time** — then → now maps, climate, urban growth, a person’s face across years (with consent).
- **Compare** — plan A vs plan B as two settled states, cloud in the middle as “the decision.”

### Make abstract things graspable

- **Data sculpture** — a score, a budget, a climate series, a sports season. The form *is* the number changing.
- **System → part** — body → organ, city → building, machine → component.
- **Privacy-preserving presence** — a real face or body sampled into particles so you can show “a person” without showing the person. Useful for health, HR, and any demo that cannot leak identity.
- **Chaos → order** — messy uploads, inbox, raw logs settle into a tidy object. Onboarding and empty states that currently use spinners.

### Help someone do a job

- **Design / brand QA** — drop two marks, see whether the morph is readable. Agencies and in-house brand teams.
- **Presentation / teaching** — a teacher or founder scrubs A→B instead of slide-cutting. Better than a fade.
- **E-commerce configurator** — same garment, new color or cut, no asset swap pop.
- **Maps and wayfinding** — country → region → street as one field.
- **Status in products** — syncing, compiling, analyzing: the cloud is the wait, the settled form is the result. More honest than a Lottie of a random orb.
- **Accessibility of change** — reduced-motion snap + optional captions (“now showing the heart”) so the morph is a complement, not the only message.

If a product cannot name the *job* (“see the change,” “compare,” “wait,” “explain a part”), it is decoration. Decoration is allowed. It should not be the only story.

---

## Library — if this is more than a demo site

The playground is one consumer. A library is how other people do jobs with it.

### Smallest honest library

What v1 already almost is:

```ts
registerTarget(id, target)
morphTo(id, { duration, camera })
setLook(...)
setProgress(t)   // not in v1 yet — this is the Ionian unlock
```

Add `setProgress` and any host can attach scroll, audio, or app state. That single method is the difference between a toy and an animation library.

### Packaging people would actually use

- **Headless engine** (vanilla TS + Three) — current shape
- **React / Vue / R3F bindings** — `<Morph.Stage>` + `<Morph.Target id="logo" src=...>`
- **Target builder plugins** — `fromImage`, `fromMesh`, `fromText`, `fromVideo`, `fromFunction`
- **Driver plugins** — `fromScroll`, `fromPointer`, `fromAudio`, `fromMediaPipe`
- **Preset packs** — brand, education, data, sculpture. Optional, paid or free
- **Scene file later** — JSON of targets + a progress curve. Not v1

### Who the library is for

- Design engineers shipping a hero
- Product teams that need before/after or state-change
- Educators and journalists
- Agencies who repeat logo morphs for clients
- You, as a profile piece that is also installable

### What the library is not

- After Effects
- A 3D authoring suite
- Ionian-scale GPGPU platform on day one
- A social network of scenes

---

## Broad product bets (pick later, not now)

These are different companies that could share the same kernel.

1. **Motion kit for the web** — npm + playground. Design engineers. Closest to what exists.
2. **Explainer tool** — teachers, journalists, founders upload A/B and export a loop or embed. Useful first.
3. **Brand QA** — drop two logos, score whether the cloud stays readable. Narrow and sellable.
4. **Health / science twin** — body ↔ organ ↔ molecule.
5. **Live performance** — music and gesture. Art first, utility second.
6. **Privacy avatar** — identity-safe presence for calls, health, or support.

Do not build all six. The kernel can serve all six if plugs stay clean.

---

## What this will not be

- Skeletal acting, cloth, hair
- True fluid / fire / smoke
- Gaussian splats / photoreal people
- A full physics world
- “Any animation that exists in cinema”

“Anything is possible” is true **inside a particle field changing state**. It is false as a promise to replace every animator’s toolchain.

---

## Suggested unlock order (not decided)

When testing is done, the highest-leverage order is still:

1. **`setProgress(t)`** — unlocks scroll, audio, app state, scrubbing. Makes it a library.
2. **3D mesh targets** — makes it feel like an engine, not an image toy. Research already proved it.
3. **Type sampler** — instantly useful for brand and web heroes.
4. **One useful show** — before/after embed or state-change wait — so it is not only visually appealing.
5. Interaction skins (cursor, pinch) after the library remote exists.

v1 stays frozen as the look-dev gold standard while plugs are added beside it.

---

## Open

- Which product bet, if any, is the public story?
- Is the GitHub profile piece a library, a tool, or a film?
- Keep WebGL-only, or add a WebGPU path later for atlas + compute?

No decision in this file. Test the current playground, then choose a plug.
