import {
  createImageTarget,
  createMeshTarget,
  createProceduralTarget,
  createTextTarget,
  createTorusKnotTarget,
  fieldPointFromClient,
  getParticleQualityConfig,
  isBehaviorId,
  isDriverId,
  isRendererId,
  Scree,
  resolveParticleQuality,
  scrollProgress,
  type BehaviorId,
  type DriverId,
  type ProceduralTargetId,
} from "../engine";

import "./styles.css";

const IMAGE_PRESETS = [
  { id: "mark", src: "/presets/mark.svg" },
  { id: "nova", src: "/presets/nova.svg" },
  { id: "glyph", src: "/presets/glyph.svg" },
] as const;

const SHAPES: ProceduralTargetId[] = [
  "sphere",
  "torus",
  "cube",
  "cylinder",
  "pyramid",
  "helix",
  "spiral",
  "wave",
];

const stage = document.querySelector<HTMLCanvasElement>("#stage");
const statusNode = document.querySelector<HTMLParagraphElement>("#status");
const playButton = document.querySelector<HTMLButtonElement>("#play-custom");
const applyTextButton = document.querySelector<HTMLButtonElement>("#apply-text");
const useKnotButton = document.querySelector<HTMLButtonElement>("#use-knot");
const sourceInput = document.querySelector<HTMLInputElement>("#file-a");
const targetInput = document.querySelector<HTMLInputElement>("#file-b");
const meshInput = document.querySelector<HTMLInputElement>("#file-mesh");
const textInput = document.querySelector<HTMLInputElement>("#text-value");
const textWeight = document.querySelector<HTMLSelectElement>("#text-weight");
const textSize = document.querySelector<HTMLInputElement>("#text-size");
const sourceName = document.querySelector<HTMLElement>("#name-a");
const targetName = document.querySelector<HTMLElement>("#name-b");
const meshName = document.querySelector<HTMLElement>("#name-mesh");
const dropZone = document.querySelector<HTMLElement>(".drop");
const progressInput = document.querySelector<HTMLInputElement>("#progress");
const strengthInput = document.querySelector<HTMLInputElement>("#behavior-strength");
const scrollSpace = document.querySelector<HTMLElement>("#scroll-space");
const sizeInput = document.querySelector<HTMLInputElement>("#renderer-size");
const opacityInput = document.querySelector<HTMLInputElement>("#renderer-opacity");
const sourceButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-source]"),
];
const kindButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-kind]")];
const presetButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-preset]"),
];
const shapeButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-shape]"),
];
const rendererButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-renderer]"),
];
const behaviorButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-behavior]"),
];
const driverButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-driver]"),
];
const panels = [...document.querySelectorAll<HTMLElement>("[data-panel]")];

if (
  !stage ||
  !statusNode ||
  !playButton ||
  !applyTextButton ||
  !useKnotButton ||
  !sourceInput ||
  !targetInput ||
  !meshInput ||
  !textInput ||
  !textWeight ||
  !textSize ||
  !sourceName ||
  !targetName ||
  !meshName ||
  !dropZone ||
  !progressInput ||
  !strengthInput ||
  !scrollSpace ||
  !sizeInput ||
  !opacityInput
) {
  throw new Error("Playground markup is missing");
}

const canvas = stage;
const statusEl = statusNode;
const playCustom = playButton;
const applyText = applyTextButton;
const useKnot = useKnotButton;
const fileA = sourceInput;
const fileB = targetInput;
const fileMesh = meshInput;
const textValue = textInput;
const weightControl = textWeight;
const sizeTextControl = textSize;
const nameA = sourceName;
const nameB = targetName;
const nameMesh = meshName;
const sizeControl = sizeInput;
const opacityControl = opacityInput;
const strengthControl = strengthInput;
const scrollTrack = scrollSpace;

let customReady = false;
let liveImageId = "mark";
let fileARef: File | null = null;
let fileBRef: File | null = null;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const quality = resolveParticleQuality({
  viewportWidth: window.innerWidth,
  hardwareConcurrency: navigator.hardwareConcurrency,
  reducedMotion,
});
const particleCount = getParticleQualityConfig(quality).particleCount;
const shared = { particleCount, seed: 2026 };

const engine = new Scree({
  canvas,
  quality,
  reducedMotion,
  onTransitionStateChange: (isTransitioning) => {
    if (!customReady) {
      statusEl.textContent = isTransitioning
        ? "Particles opening…"
        : "Settled. Pick another source.";
    }
  },
  onProgress: (progress) => {
    progressInput.value = String(progress);
  },
  onError: (message) => {
    statusEl.textContent = message;
  },
});

function setPressed(
  buttons: HTMLButtonElement[],
  key: string,
  value: string,
): void {
  for (const button of buttons) {
    button.setAttribute(
      "aria-pressed",
      button.dataset[key] === value ? "true" : "false",
    );
  }
}

function showKind(kind: string): void {
  setPressed(kindButtons, "kind", kind);
  for (const panel of panels) {
    panel.hidden = panel.dataset.panel !== kind;
  }
}

function applyRendererConfig(): void {
  engine.setRenderer(engine.getRenderer(), {
    size: Number(sizeControl.value),
    opacity: Number(opacityControl.value),
  });
}

function syncRendererSliders(): void {
  const look = engine.getRendererConfig();
  sizeControl.value = String(look.size);
  opacityControl.value = String(look.opacity);
}

function resize(): void {
  engine.resize(window.innerWidth, window.innerHeight);
}

function refreshCustomButton(): void {
  playCustom.disabled = !(fileARef && fileBRef);
}

function morphSource(id: string, source: "image" | "text" | "mesh" | "sphere"): void {
  customReady = false;
  if (source === "image") liveImageId = id;
  setPressed(sourceButtons, "source", source);
  engine.morphTo(id);
}

async function start(): Promise<void> {
  statusEl.textContent = "Sampling forms…";
  const images = await Promise.all(
    IMAGE_PRESETS.map(async (preset) => ({
      id: preset.id,
      target: await createImageTarget(preset.src, {
        ...shared,
        seed: shared.seed + preset.id.length,
        alphaThreshold: 24,
        depth: 0.22,
      }),
    })),
  );
  for (const item of images) {
    engine.registerTarget(item.id, item.target);
  }
  engine.registerTarget("text", createTextTarget("HELLO", { ...shared, seed: 11 }));
  engine.registerTarget("mesh", createTorusKnotTarget({ ...shared, seed: 17 }));
  for (const shape of SHAPES) {
    engine.registerTarget(
      shape,
      createProceduralTarget(shape, { ...shared, seed: 30 + shape.length }),
    );
  }
  resize();
  engine.morphTo("mark", { durationSeconds: 0 });
  setPressed(sourceButtons, "source", "image");
  setPressed(presetButtons, "preset", "mark");
  setPressed(shapeButtons, "shape", "sphere");
  setPressed(behaviorButtons, "behavior", engine.getBehavior().id);
  setPressed(driverButtons, "driver", engine.getDriver());
  strengthControl.value = String(engine.getBehavior().strength);
  showKind("image");
  syncRendererSliders();
  statusEl.textContent = reducedMotion
    ? "Reduced motion: forms change without the cloud."
    : "Auto is on. Click Nova to watch it play. Then try Manual.";
}

for (const button of sourceButtons) {
  button.addEventListener("click", () => {
    const source = button.dataset.source;
    if (source === "image") {
      showKind("image");
      morphSource(liveImageId, "image");
      return;
    }
    if (source === "text") {
      showKind("text");
      morphSource("text", "text");
      return;
    }
    if (source === "mesh") {
      showKind("mesh");
      morphSource("mesh", "mesh");
      return;
    }
    if (source === "sphere") {
      showKind("shape");
      setPressed(shapeButtons, "shape", "sphere");
      morphSource("sphere", "sphere");
    }
  });
}

for (const button of kindButtons) {
  button.addEventListener("click", () => {
    const kind = button.dataset.kind;
    if (kind) showKind(kind);
  });
}

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.preset;
    if (!id) return;
    setPressed(presetButtons, "preset", id);
    morphSource(id, "image");
  });
}

for (const button of shapeButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.shape;
    if (!id) return;
    setPressed(shapeButtons, "shape", id);
    morphSource(id, "sphere");
  });
}

const BEHAVIOR_STATUS: Record<BehaviorId, string> = {
  settle: "Straight travel with a little organic drift.",
  expand: "Cloud opens outward, then settles.",
  scatter: "Particles break apart, then find the next form.",
  implode: "The field pulls in, then settles.",
  turbulence: "Coherent displacement. The target stays underneath.",
  orbit: "The field rotates as it travels.",
};

const DRIVER_STATUS: Record<DriverId, string> = {
  auto: "Auto: click Mark, then Nova. The bar plays itself.",
  manual: "Manual: drag Progress halfway, then click Nova. The shape changes. The bar stays.",
  scroll: "Scroll: roll the page. The bar follows the scrollbar.",
  pointer: "Pointer: move the mouse over the shape. Particles push away. Not a zoom.",
};

for (const button of rendererButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.renderer;
    if (!id || !isRendererId(id)) return;
    engine.setRenderer(id);
    setPressed(rendererButtons, "renderer", id);
    syncRendererSliders();
    statusEl.textContent =
      "This is the same particle field. Only the renderer changed.";
  });
}

for (const button of behaviorButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.behavior;
    if (!id || !isBehaviorId(id)) return;
    engine.setBehavior(id, { strength: Number(strengthControl.value) });
    setPressed(behaviorButtons, "behavior", id);
    const current = engine.getActiveTarget();
    if (current && engine.getDriver() === "auto") {
      engine.morphTo(current, { replay: true });
    }
    statusEl.textContent = BEHAVIOR_STATUS[id];
  });
}

function applyScrollDriver(on: boolean): void {
  document.documentElement.classList.toggle("scroll-drive", on);
  document.body.classList.toggle("scroll-drive", on);
  document.documentElement.classList.toggle("pointer-drive", false);
  document.body.classList.toggle("pointer-drive", false);
  scrollTrack.hidden = !on;
  if (!on) return;
  engine.setProgress(
    scrollProgress({
      scrollTop: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: window.innerHeight,
    }),
  );
}

for (const button of driverButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.driver;
    if (!id || !isDriverId(id)) return;
    engine.setDriver(id);
    setPressed(driverButtons, "driver", id);
    applyScrollDriver(id === "scroll");
    document.documentElement.classList.toggle("pointer-drive", id === "pointer");
    document.body.classList.toggle("pointer-drive", id === "pointer");
    statusEl.textContent = DRIVER_STATUS[id];
  });
}

strengthControl.addEventListener("input", () => {
  engine.setBehavior(engine.getBehavior().id, {
    strength: Number(strengthControl.value),
  });
});

sizeControl.addEventListener("input", () => {
  applyRendererConfig();
  statusEl.textContent = "Renderer size is a multiplier around the auto default.";
});

opacityControl.addEventListener("input", () => {
  applyRendererConfig();
});

applyText.addEventListener("click", () => {
  applyText.disabled = true;
  statusEl.textContent = "Setting text…";
  try {
    engine.registerTarget(
      "text",
      createTextTarget(textValue.value, {
        ...shared,
        seed: 11,
        weight: weightControl.value,
        size: Number(sizeTextControl.value),
      }),
    );
    morphSource("text", "text");
    statusEl.textContent = "Text is now a particle target.";
  } catch (error) {
    statusEl.textContent =
      error instanceof Error ? error.message : "That text could not be sampled.";
  } finally {
    applyText.disabled = false;
  }
});

useKnot.addEventListener("click", () => {
  engine.registerTarget("mesh", createTorusKnotTarget({ ...shared, seed: 17 }));
  nameMesh.textContent = "Knot";
  morphSource("mesh", "mesh");
  statusEl.textContent = "Built-in knot. Same field.";
});

async function loadMeshFile(file: File): Promise<void> {
  nameMesh.textContent = "Sampling…";
  statusEl.textContent = "Reading this model…";
  useKnot.disabled = true;
  applyText.disabled = true;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  try {
    const target = await createMeshTarget(file, { ...shared, seed: 19 });
    engine.registerTarget("mesh", target);
    nameMesh.textContent = file.name;
    morphSource("mesh", "mesh");
    statusEl.textContent = "Mesh surface sampled. Files stayed in this tab.";
  } catch {
    nameMesh.textContent = "Drop a model";
    statusEl.textContent = "That model could not be sampled. Use a GLB or GLTF.";
  } finally {
    useKnot.disabled = false;
    applyText.disabled = false;
  }
}

fileMesh.addEventListener("change", () => {
  const file = fileMesh.files?.[0];
  if (!file) return;
  void loadMeshFile(file);
});

fileA.addEventListener("change", () => {
  fileARef = fileA.files?.[0] ?? null;
  nameA.textContent = fileARef?.name ?? "Source";
  refreshCustomButton();
});

fileB.addEventListener("change", () => {
  fileBRef = fileB.files?.[0] ?? null;
  nameB.textContent = fileBRef?.name ?? "Target";
  refreshCustomButton();
});

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || file.name.endsWith(".svg");
}

function assignDroppedFiles(files: File[]): void {
  const mesh = files.find(
    (file) =>
      file.name.endsWith(".glb") ||
      file.name.endsWith(".gltf") ||
      file.type.includes("gltf"),
  );
  if (mesh) {
    showKind("mesh");
    void loadMeshFile(mesh);
    return;
  }

  const images = files.filter(isImageFile).slice(0, 2);
  if (images[0] && (images[1] || !fileARef)) {
    fileARef = images[0];
    nameA.textContent = images[0].name;
  } else if (images[0]) {
    fileBRef = images[0];
    nameB.textContent = images[0].name;
  }
  if (images[1]) {
    fileBRef = images[1];
    nameB.textContent = images[1].name;
  }
  if (images.length > 0) showKind("image");
  refreshCustomButton();
}

progressInput.addEventListener("input", () => {
  if (engine.getDriver() === "auto") {
    engine.setDriver("manual");
    setPressed(driverButtons, "driver", "manual");
    applyScrollDriver(false);
  }
  engine.setProgress(Number(progressInput.value));
  statusEl.textContent = "Progress is driven by the slider.";
});

window.addEventListener(
  "scroll",
  () => {
    if (engine.getDriver() !== "scroll") return;
    engine.setProgress(
      scrollProgress({
        scrollTop: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: window.innerHeight,
      }),
    );
  },
  { passive: true },
);

window.addEventListener("pointermove", (event) => {
  if (engine.getDriver() !== "pointer") return;
  engine.setPointer(
    fieldPointFromClient({
      clientX: event.clientX,
      clientY: event.clientY,
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  );
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  assignDroppedFiles([...(event.dataTransfer?.files ?? [])]);
});

playCustom.addEventListener("click", async () => {
  if (!fileARef || !fileBRef) return;
  playCustom.disabled = true;
  statusEl.textContent = "Sampling your images in this browser…";
  try {
    const [source, destination] = await Promise.all([
      createImageTarget(fileARef, { ...shared, seed: 11 }),
      createImageTarget(fileBRef, { ...shared, seed: 17 }),
    ]);
    engine.registerTarget("custom-a", source);
    engine.registerTarget("custom-b", destination);
    customReady = true;
    setPressed(presetButtons, "preset", "");
    liveImageId = "custom-b";
    engine.morphTo("custom-a", { durationSeconds: 0 });
    engine.morphTo("custom-b");
    setPressed(sourceButtons, "source", "image");
    statusEl.textContent = "Your images never left this tab.";
  } catch {
    statusEl.textContent =
      "Those files could not be sampled. Use a PNG, WebP, JPEG, or SVG with a clear silhouette.";
  } finally {
    refreshCustomButton();
  }
});

window.addEventListener("resize", resize);
window.addEventListener("pagehide", () => engine.dispose());

void start().catch(() => {
  statusEl.textContent = "The particle stage could not start in this browser.";
});
