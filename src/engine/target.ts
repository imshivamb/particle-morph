export type PixelSource = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type ParticleTarget = {
  positions: Float32Array;
  colors: Float32Array;
  seeds: Float32Array;
};

export type ParticleTargetOptions = {
  particleCount: number;
  seed: number;
  alphaThreshold: number;
  depth: number;
};

const MAX_SOURCE_DIMENSION = 512;

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function buildParticleTarget(
  source: PixelSource,
  options: ParticleTargetOptions,
): ParticleTarget {
  if (!Number.isInteger(options.particleCount) || options.particleCount <= 0) {
    throw new Error("Particle count must be a positive integer");
  }

  const visible: { x: number; y: number; r: number; g: number; b: number; lum: number }[] =
    [];
  let minX = source.width;
  let maxX = 0;
  let minY = source.height;
  let maxY = 0;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const offset = (y * source.width + x) * 4;
      const alpha = source.data[offset + 3] ?? 0;
      if (alpha < options.alphaThreshold) continue;

      const r = (source.data[offset] ?? 0) / 255;
      const g = (source.data[offset + 1] ?? 0) / 255;
      const b = (source.data[offset + 2] ?? 0) / 255;
      visible.push({
        x,
        y,
        r,
        g,
        b,
        lum: r * 0.2126 + g * 0.7152 + b * 0.0722,
      });
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (visible.length === 0) {
    throw new Error("Particle target contains no visible pixels");
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const span = Math.max(maxX - minX + 1, maxY - minY + 1);
  const random = mulberry32(options.seed);
  const positions = new Float32Array(options.particleCount * 3);
  const colors = new Float32Array(options.particleCount * 3);
  const seeds = new Float32Array(options.particleCount);

  for (let index = 0; index < options.particleCount; index += 1) {
    const pixel = visible[Math.floor(random() * visible.length)] ?? visible[0]!;
    const offset = index * 3;
    const jitterX = (random() - 0.5) * 0.65;
    const jitterY = (random() - 0.5) * 0.65;
    positions[offset] = ((pixel.x + jitterX - centerX) * 2) / span;
    positions[offset + 1] = ((centerY - pixel.y - jitterY) * 2) / span;
    positions[offset + 2] = clamp(
      (pixel.lum - 0.5) * options.depth + (random() - 0.5) * options.depth * 0.35,
      -options.depth,
      options.depth,
    );
    colors[offset] = pixel.r;
    colors[offset + 1] = pixel.g;
    colors[offset + 2] = pixel.b;
    seeds[index] = random();
  }

  return { positions, colors, seeds };
}

function pixelSourceFromImage(image: CanvasImageSource, width: number, height: number): PixelSource {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, MAX_SOURCE_DIMENSION / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Particle target image could not be sampled");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  };
}

export async function loadParticleTargetFromUrl(
  src: string,
  options: ParticleTargetOptions,
): Promise<ParticleTarget> {
  const image = await loadHtmlImage(src);
  return buildParticleTarget(
    pixelSourceFromImage(image, image.naturalWidth, image.naturalHeight),
    options,
  );
}

export async function loadParticleTargetFromFile(
  file: File,
  options: ParticleTargetOptions,
): Promise<ParticleTarget> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await loadParticleTargetFromUrl(objectUrl, options);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Particle target image could not be sampled"));
    image.src = src;
  });
}
