import * as THREE from "three";

import {
  getParticleQualityConfig,
  type ParticleQuality,
} from "./motion";
import { clampProgress } from "./progress";
import { createParticleRenderer } from "./renderers";
import type { ParticleRenderer } from "./renderers/types";
import {
  assertSameTargetCount,
  targetDepthSpan,
  type ParticleTarget,
} from "./target";
import type {
  MorphLook,
  ParticleFieldState,
  RendererConfig,
  RendererId,
} from "./types";

export type { MorphLook, RendererConfig } from "./types";

export type MorphToOptions = {
  durationSeconds?: number;
  cameraZ?: number;
  scale?: [number, number, number];
  renderer?: RendererId;
};

export type ScreeOptions = {
  canvas: HTMLCanvasElement;
  quality: ParticleQuality;
  reducedMotion: boolean;
  look?: Partial<MorphLook>;
  renderer?: RendererId;
  onTransitionStateChange?: (isTransitioning: boolean) => void;
  onProgress?: (progress: number) => void;
  onError?: (message: string) => void;
};

const DEFAULT_LOOK: MorphLook = {
  expansionStrength: 0.58,
  turbulenceStrength: 0.52,
  synchronization: 0.72,
  particleSize: 2.9,
  glow: 0.44,
};

const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  size: 1,
  opacity: 0.675,
};

type Tween = {
  startTime: number;
  durationMs: number;
  from: number;
  to: number;
};

export class Scree {
  private readonly webgl: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.08, 24);
  private readonly targets = new Map<string, ParticleTarget>();
  private readonly targetScales = new Map<string, THREE.Vector3>();
  private readonly quality: ParticleQuality;
  private readonly reducedMotion: boolean;
  private readonly onTransitionStateChange?: (isTransitioning: boolean) => void;
  private readonly onProgress?: (progress: number) => void;
  private readonly onError?: (message: string) => void;
  private look: MorphLook;
  private readonly rendererLooks: Record<RendererId, RendererConfig> = {
    points: { ...DEFAULT_RENDERER_CONFIG },
    sprites: { ...DEFAULT_RENDERER_CONFIG },
    shards: { ...DEFAULT_RENDERER_CONFIG },
  };
  private skin: ParticleRenderer;
  private field: { source: ParticleTarget; destination: ParticleTarget } | null =
    null;
  private sourceScale = new THREE.Vector3(1, 1, 1);
  private targetScale = new THREE.Vector3(1, 1, 1);
  private progress = 1;
  private viewport = { width: 1, height: 1 };
  private activeTarget: string | null = null;
  private frameId: number | null = null;
  private paused = false;
  private disposed = false;
  private tween: Tween | null = null;
  private readonly replacedFrom = new Map<string, ParticleTarget>();
  private visibilityHandler = (): void => {
    this.setPaused(document.hidden);
  };

  constructor(options: ScreeOptions) {
    const quality = getParticleQualityConfig(options.quality);
    this.quality = options.quality;
    this.reducedMotion = options.reducedMotion;
    this.onTransitionStateChange = options.onTransitionStateChange;
    this.onProgress = options.onProgress;
    this.onError = options.onError;
    this.look = { ...DEFAULT_LOOK, ...options.look };
    this.camera.position.set(0, 0, 3.1);
    this.camera.lookAt(0, 0, 0);

    this.webgl = new THREE.WebGLRenderer({
      canvas: options.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.webgl.setClearColor(0x000000, 0);
    this.webgl.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, quality.maxDpr),
    );

    const initialRenderer = options.renderer ?? "points";
    this.skin = createParticleRenderer(
      initialRenderer,
      this.look,
      this.rendererLooks[initialRenderer],
      this.webgl.getPixelRatio(),
    );
    this.scene.add(this.skin.object);
    options.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.startLoop();
  }

  registerTarget(
    id: string,
    target: ParticleTarget,
    scale: [number, number, number] = [1, 1, 1],
  ): void {
    const existing = this.targets.values().next().value;
    if (existing) {
      assertSameTargetCount(existing, target);
    }
    const previous = this.targets.get(id);
    this.targets.set(id, target);
    this.targetScales.set(id, new THREE.Vector3(...scale));
    if (previous && this.activeTarget === id) {
      this.replacedFrom.set(id, previous);
    }

    if (!this.activeTarget) {
      this.activeTarget = id;
      this.writeField(target, target);
      this.sourceScale.copy(this.targetScales.get(id) ?? new THREE.Vector3(1, 1, 1));
      this.targetScale.copy(this.sourceScale);
      this.syncSkin();
      this.applyProgress(1);
    }
  }

  morphTo(id: string, options: MorphToOptions = {}): void {
    if (options.renderer) {
      this.setRenderer(options.renderer);
    }

    const destination = this.targets.get(id);
    if (!destination) {
      this.onError?.(`Unknown morph target "${id}"`);
      return;
    }
    if (options.scale) {
      this.targetScales.set(id, new THREE.Vector3(...options.scale));
    }

    const sourceId = this.activeTarget;
    const replaced = this.replacedFrom.get(id);
    this.replacedFrom.delete(id);
    if (sourceId === id && !this.tween && !replaced) {
      this.onTransitionStateChange?.(false);
      return;
    }

    const source =
      replaced ??
      (sourceId ? this.targets.get(sourceId) : destination) ??
      destination;
    this.writeField(source, destination);
    this.sourceScale.copy(
      this.targetScales.get(sourceId ?? id) ?? new THREE.Vector3(1, 1, 1),
    );
    this.targetScale.copy(
      this.targetScales.get(id) ?? new THREE.Vector3(1, 1, 1),
    );
    this.activeTarget = id;
    this.syncSkin();

    const cameraZ = options.cameraZ ?? 3.1;
    const durationSeconds = options.durationSeconds ?? 2.6;
    this.frameCamera(destination, cameraZ);

    if (this.reducedMotion || durationSeconds <= 0) {
      this.setProgress(1);
      this.onTransitionStateChange?.(false);
      return;
    }

    this.setProgress(0);
    this.tween = {
      startTime: performance.now(),
      durationMs: durationSeconds * 1000,
      from: 0,
      to: 1,
    };
    this.onTransitionStateChange?.(true);
  }

  private frameCamera(target: ParticleTarget, cameraZ: number): void {
    if (targetDepthSpan(target) > 0.42) {
      this.camera.position.set(0.92, 0.62, Math.max(2.55, cameraZ * 0.92));
    } else {
      this.camera.position.set(0, 0, cameraZ);
    }
    this.camera.lookAt(0, 0, 0);
  }

  getActiveTarget(): string | null {
    return this.activeTarget;
  }

  getProgress(): number {
    return this.progress;
  }

  getFieldState(): ParticleFieldState {
    return {
      activeTarget: this.activeTarget,
      progress: this.progress,
      quality: this.quality,
      renderer: this.skin.id,
    };
  }

  getRenderer(): RendererId {
    return this.skin.id;
  }

  getRendererConfig(id: RendererId = this.skin.id): RendererConfig {
    return { ...this.rendererLooks[id] };
  }

  setRenderer(id: RendererId, config: Partial<RendererConfig> = {}): void {
    this.rendererLooks[id] = { ...this.rendererLooks[id], ...config };
    const look = this.rendererLooks[id];
    if (id === this.skin.id) {
      this.skin.setConfig(look);
      return;
    }

    this.scene.remove(this.skin.object);
    this.skin.dispose();
    this.skin = createParticleRenderer(
      id,
      this.look,
      look,
      this.webgl.getPixelRatio(),
    );
    this.scene.add(this.skin.object);
    this.syncSkin();
    this.skin.setProgress(this.progress);
  }

  setProgress(progress: number): void {
    this.tween = null;
    this.applyProgress(progress);
  }

  setLook(look: Partial<MorphLook>): void {
    this.look = { ...this.look, ...look };
    this.skin.setLook(this.look);
  }

  resize(width: number, height: number): void {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.viewport = { width: safeWidth, height: safeHeight };
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.webgl.setSize(safeWidth, safeHeight, false);
    this.skin.setViewport(safeWidth, safeHeight);
    this.skin.setDpr(this.webgl.getPixelRatio());
  }

  setPaused(paused: boolean): void {
    if (this.disposed || this.paused === paused) return;
    this.paused = paused;
    if (paused && this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      return;
    }
    if (!paused) this.startLoop();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.tween = null;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.webgl.domElement.removeEventListener(
      "webglcontextlost",
      this.handleContextLost,
    );
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.scene.remove(this.skin.object);
    this.skin.dispose();
    this.webgl.dispose();
  }

  private writeField(source: ParticleTarget, destination: ParticleTarget): void {
    this.field = { source, destination };
  }

  private syncSkin(): void {
    if (!this.field) return;
    this.skin.setField(this.field);
    this.skin.setSourceScale(this.sourceScale);
    this.skin.setTargetScale(this.targetScale);
    this.skin.setViewport(this.viewport.width, this.viewport.height);
    this.skin.setDpr(this.webgl.getPixelRatio());
    this.skin.setLook(this.look);
    this.skin.setConfig(this.rendererLooks[this.skin.id]);
    this.skin.setProgress(this.progress);
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.setPaused(true);
    this.onError?.("WebGL context was lost");
  };

  private startLoop(): void {
    if (this.disposed || this.paused || this.frameId !== null) return;

    const render = (time: number) => {
      this.frameId = null;
      if (this.disposed || this.paused) return;
      this.stepTween(time);
      this.skin.setTime(time / 1000);
      this.webgl.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(render);
    };

    this.frameId = requestAnimationFrame(render);
  }

  private stepTween(time: number): void {
    if (!this.tween) return;
    const elapsed = time - this.tween.startTime;
    const linear = Math.min(1, elapsed / this.tween.durationMs);
    const eased = linear * linear * (3 - 2 * linear);
    this.applyProgress(this.tween.from + (this.tween.to - this.tween.from) * eased);
    if (linear >= 1) {
      this.tween = null;
      this.onTransitionStateChange?.(false);
    }
  }

  private applyProgress(progress: number): void {
    this.progress = clampProgress(progress);
    this.skin.setProgress(this.progress);
    this.onProgress?.(this.progress);
  }
}
