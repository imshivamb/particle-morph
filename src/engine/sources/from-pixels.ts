import { finalizeTarget, flatNormals } from "./normalize";
import { resolveParticleCount, resolveSeed } from "./options";
import { clamp, mulberry32 } from "./rng";
import type { ParticleTarget, ParticleTargetOptions, PixelSource } from "./types";

export function buildParticleTarget(
  source: PixelSource,
  options: ParticleTargetOptions,
): ParticleTarget {
  const particleCount = resolveParticleCount(options);
  const visible: { x: number; y: number; r: number; g: number; b: number; lum: number }[] =
    [];
  let minX = source.width;
  let maxX = 0;
  let minY = source.height;
  let maxY = 0;

  for (let y = 0; y < source.height; y += 1) {
    const row = y * source.width;
    for (let x = 0; x < source.width; x += 1) {
      const offset = (row + x) * 4;
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
  const random = mulberry32(resolveSeed(options));
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount);

  for (let index = 0; index < particleCount; index += 1) {
    const pixel = visible[Math.floor(random() * visible.length)] ?? visible[0]!;
    const offset = index * 3;
    const jitter = options.jitter ?? 0.65;
    const jitterX = (random() - 0.5) * jitter;
    const jitterY = (random() - 0.5) * jitter;
    const extent = options.extent ?? 2;
    positions[offset] = ((pixel.x + jitterX - centerX) * extent) / span;
    positions[offset + 1] = ((centerY - pixel.y - jitterY) * extent) / span;
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

  return finalizeTarget({
    positions,
    colors,
    seeds,
    normals: flatNormals(particleCount),
    normalize: false,
  });
}
