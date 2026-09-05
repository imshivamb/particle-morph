import {
  getParticleQualityConfig,
  loadParticleTargetFromFile,
  loadParticleTargetFromUrl,
  ParticleMorphEngine,
  resolveParticleQuality,
  type ParticleTargetOptions,
} from "../engine";

import "./styles.css";

const PRESETS = [
  { id: "mark", src: "/presets/mark.svg" },
  { id: "nova", src: "/presets/nova.svg" },
  { id: "glyph", src: "/presets/glyph.svg" },
] as const;

const stage = document.querySelector<HTMLCanvasElement>("#stage");
const statusNode = document.querySelector<HTMLParagraphElement>("#status");
const playButton = document.querySelector<HTMLButtonElement>("#play-custom");
const sourceInput = document.querySelector<HTMLInputElement>("#file-a");
const targetInput = document.querySelector<HTMLInputElement>("#file-b");
const sourceName = document.querySelector<HTMLElement>("#name-a");
const targetName = document.querySelector<HTMLElement>("#name-b");
const presetButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-preset]"),
];
const dropZone = document.querySelector<HTMLElement>(".drop");

if (
  !stage ||
  !statusNode ||
  !playButton ||
  !sourceInput ||
  !targetInput ||
  !sourceName ||
  !targetName ||
  !dropZone
) {
  throw new Error("Playground markup is missing");
}

const canvas = stage;
const statusEl = statusNode;
const playCustom = playButton;
const fileA = sourceInput;
const fileB = targetInput;
const nameA = sourceName;
const nameB = targetName;

let customReady = false;
let fileARef: File | null = null;
let fileBRef: File | null = null;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const quality = resolveParticleQuality({
  viewportWidth: window.innerWidth,
  hardwareConcurrency: navigator.hardwareConcurrency,
  reducedMotion,
});
const qualityConfig = getParticleQualityConfig(quality);
const targetOptions: ParticleTargetOptions = {
  particleCount: qualityConfig.particleCount,
  seed: 2026,
  alphaThreshold: 24,
  depth: 0.22,
};

const engine = new ParticleMorphEngine({
  canvas,
  quality,
  reducedMotion,
  onTransitionStateChange: (isTransitioning) => {
    if (!customReady) {
      statusEl.textContent = isTransitioning
        ? "Particles opening…"
        : "Settled. Pick another form.";
    }
  },
  onError: (message) => {
    statusEl.textContent = message;
  },
});

function setPressed(id: string): void {
  for (const button of presetButtons) {
    button.setAttribute(
      "aria-pressed",
      button.dataset.preset === id ? "true" : "false",
    );
  }
}

function resize(): void {
  engine.resize(window.innerWidth, window.innerHeight);
}

function refreshCustomButton(): void {
  playCustom.disabled = !(fileARef && fileBRef);
}

async function start(): Promise<void> {
  statusEl.textContent = "Sampling forms…";
  const loaded = await Promise.all(
    PRESETS.map(async (preset) => ({
      id: preset.id,
      target: await loadParticleTargetFromUrl(preset.src, {
        ...targetOptions,
        seed: targetOptions.seed + preset.id.length,
      }),
    })),
  );
  for (const item of loaded) {
    engine.registerTarget(item.id, item.target);
  }
  resize();
  engine.morphTo("mark", { durationSeconds: 0 });
  setPressed("mark");
  statusEl.textContent = reducedMotion
    ? "Reduced motion: forms change without the cloud."
    : "Mark is live. Click Nova or Glyph.";
}

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.preset;
    if (!id) return;
    customReady = false;
    setPressed(id);
    engine.morphTo(id);
  });
}

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
  refreshCustomButton();
}

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
      loadParticleTargetFromFile(fileARef, { ...targetOptions, seed: 11 }),
      loadParticleTargetFromFile(fileBRef, { ...targetOptions, seed: 17 }),
    ]);
    engine.registerTarget("custom-a", source);
    engine.registerTarget("custom-b", destination);
    customReady = true;
    for (const button of presetButtons) {
      button.setAttribute("aria-pressed", "false");
    }
    engine.morphTo("custom-a", { durationSeconds: 0 });
    engine.morphTo("custom-b");
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
