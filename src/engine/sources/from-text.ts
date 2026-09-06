import { buildParticleTarget } from "./from-pixels";
import { resolveParticleCount, resolveSeed } from "./options";
import type { ParticleTarget, TextTargetOptions } from "./types";

export const MAX_TEXT_CHARS = 64;
const MAX_RASTER = 720;

function wrapText(value: string, maxLineChars: number): string[] {
  const words = value.split(/(\s+|[.@/_-])/);
  const lines: string[] = [];
  let current = "";

  const push = (): void => {
    const trimmed = current.trim();
    if (trimmed) lines.push(trimmed);
    current = "";
  };

  for (const part of words) {
    if (!part || part === " ") {
      if (part === " " && current) current += " ";
      continue;
    }
    if (current.length + part.length <= maxLineChars) {
      current += part;
      continue;
    }
    if (current) push();
    if (part.length <= maxLineChars) {
      current = part;
      continue;
    }
    for (let index = 0; index < part.length; index += maxLineChars) {
      lines.push(part.slice(index, index + maxLineChars));
    }
  }
  push();
  return lines.length > 0 ? lines : [value];
}

function layoutLines(value: string): string[] {
  if (value.includes("\n")) {
    return value.split(/\n/).flatMap((line) => wrapText(line.trim(), 18));
  }
  if (value.includes("@") && !value.includes(" ")) {
    const at = value.indexOf("@");
    const local = value.slice(0, at);
    const domain = value.slice(at);
    return [...wrapText(local, 14), ...wrapText(domain, 16)];
  }
  if (value.length > 28) return wrapText(value, 10);
  if (value.length > 16) return wrapText(value, 12);
  return wrapText(value, 18);
}

function isDenseCopy(value: string, lines: string[]): boolean {
  const glyphs = value.replace(/\s/g, "").length;
  return glyphs > 10 || lines.length > 2;
}

function lineWidth(
  context: CanvasRenderingContext2D,
  line: string,
  letterSpacing: number,
): number {
  return context.measureText(line).width + Math.max(0, line.length - 1) * letterSpacing;
}

function rasterizeText(text: string, options: TextTargetOptions): ImageData {
  const raw = text.trim();
  if (!raw) {
    throw new Error("Text target needs at least one visible character");
  }
  const value = raw.slice(0, MAX_TEXT_CHARS);
  const lines = layoutLines(value);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  const requestedSize = options.size ?? 160;
  let fontSize = Math.max(
    36,
    Math.min(requestedSize, Math.round(requestedSize * (11 / Math.max(11, longest)))),
  );
  const fontFamily = options.font ?? "Outfit, Inter, sans-serif";
  const weight = options.weight ?? 600;
  const lineHeight = options.lineHeight ?? 1.18;
  const align = options.align ?? "center";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Text target could not be rasterized");
  }

  const dense = isDenseCopy(value, lines);
  let letterSpacing =
    options.letterSpacing ?? Math.round(fontSize * (dense ? 0.09 : 0.05));
  let pad = Math.ceil(fontSize * (dense ? 0.34 : 0.28));
  let textWidth = 1;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    context.font = `${weight} ${fontSize}px ${fontFamily}`;
    context.letterSpacing = `${letterSpacing}px`;
    textWidth = 1;
    for (const line of lines) {
      textWidth = Math.max(textWidth, lineWidth(context, line, letterSpacing));
    }
    pad = Math.ceil(fontSize * (dense ? 0.34 : 0.28));
    const neededW = textWidth + pad * 2;
    const neededH = lines.length * fontSize * lineHeight + pad * 2;
    if (neededW <= MAX_RASTER && neededH <= MAX_RASTER) break;
    const scale = Math.min(MAX_RASTER / neededW, MAX_RASTER / neededH) * 0.96;
    fontSize = Math.max(28, Math.floor(fontSize * scale));
    letterSpacing =
      options.letterSpacing ?? Math.round(fontSize * (dense ? 0.09 : 0.05));
  }

  canvas.width = Math.max(32, Math.ceil(textWidth + pad * 2));
  canvas.height = Math.max(32, Math.ceil(lines.length * fontSize * lineHeight + pad * 2));

  context.font = `${weight} ${fontSize}px ${fontFamily}`;
  context.letterSpacing = `${letterSpacing}px`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineJoin = "round";
  context.miterLimit = 2;
  const fillColor = options.color ?? (dense ? "#6f7b88" : "#b7c4d0");
  context.fillStyle = fillColor;
  const originX =
    align === "left" ? pad : align === "right" ? canvas.width - pad : canvas.width / 2;
  lines.forEach((line, index) => {
    const y = pad + fontSize * lineHeight * (index + 0.5);
    if (dense) {
      context.strokeStyle = "#d7e0ea";
      context.lineWidth = Math.max(2.2, fontSize * 0.07);
      context.strokeText(line, originX, y);
    }
    context.fillText(line, originX, y);
  });

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function createTextTarget(
  text: string,
  options: TextTargetOptions = {},
): ParticleTarget {
  const raw = text.trim();
  const value = raw.slice(0, MAX_TEXT_CHARS);
  const dense = isDenseCopy(value, layoutLines(value));
  const image = rasterizeText(text, options);
  return buildParticleTarget(
    { width: image.width, height: image.height, data: image.data },
    {
      particleCount: resolveParticleCount(options),
      seed: resolveSeed(options),
      alphaThreshold: options.alphaThreshold ?? (dense ? 80 : 90),
      depth: options.depth ?? 0.08,
      jitter: dense ? 0.07 : 0.1,
      extent: 0.88,
      preferEdges: true,
    },
  );
}
