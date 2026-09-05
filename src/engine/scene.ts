import * as THREE from "three";

import {
  getParticleQualityConfig,
  type ParticleQuality,
} from "./motion";
import {
  PARTICLE_FRAGMENT_SHADER,
  PARTICLE_VERTEX_SHADER,
} from "./shaders";
import type { ParticleTarget } from "./target";

export type MorphLook = {
  expansionStrength: number;
  turbulenceStrength: number;
  synchronization: number;
  particleSize: number;
  glow: number;
};

export type MorphToOptions = {
  durationSeconds?: number;
  cameraZ?: number;
  scale?: [number, number, number];
};

export type ParticleMorphEngineOptions = {
  canvas: HTMLCanvasElement;
  quality: ParticleQuality;
  reducedMotion: boolean;
  look?: Partial<MorphLook>;
  onTransitionStateChange?: (isTransitioning: boolean) => void;
  onError?: (message: string) => void;
};

const DEFAULT_LOOK: MorphLook = {
  expansionStrength: 0.58,
  turbulenceStrength: 0.52,
  synchronization: 0.72,
  particleSize: 2.9,
  glow: 0.44,
};

type Tween = {
  startTime: number;
  durationMs: number;
  from: number;
  to: number;
};

export class ParticleMorphEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.08, 24);
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.ShaderMaterial;
  private readonly points: THREE.Points;
  private readonly targets = new Map<string, ParticleTarget>();
  private readonly targetScales = new Map<string, THREE.Vector3>();
  private readonly reducedMotion: boolean;
  private readonly onTransitionStateChange?: (isTransitioning: boolean) => void;
  private readonly onError?: (message: string) => void;
  private look: MorphLook;
  private activeTarget: string | null = null;
  private frameId: number | null = null;
  private paused = false;
  private disposed = false;
  private tween: Tween | null = null;
  private visibilityHandler = (): void => {
    this.setPaused(document.hidden);
  };

  constructor(options: ParticleMorphEngineOptions) {
    const quality = getParticleQualityConfig(options.quality);
    this.reducedMotion = options.reducedMotion;
    this.onTransitionStateChange = options.onTransitionStateChange;
    this.onError = options.onError;
    this.look = { ...DEFAULT_LOOK, ...options.look };
    this.camera.position.z = 3.1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, quality.maxDpr),
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX_SHADER,
      fragmentShader: PARTICLE_FRAGMENT_SHADER,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uExpansionStrength: { value: this.look.expansionStrength },
        uTurbulenceStrength: { value: this.look.turbulenceStrength },
        uSynchronization: { value: this.look.synchronization },
        uParticleSize: { value: this.look.particleSize },
        uDpr: { value: this.renderer.getPixelRatio() },
        uGlow: { value: this.look.glow },
        uSourceScale: { value: new THREE.Vector3(1, 1, 1) },
        uTargetScale: { value: new THREE.Vector3(1, 1, 1) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
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
    if (existing && existing.positions.length !== target.positions.length) {
      throw new Error("Particle targets must contain equal position counts");
    }
    this.targets.set(id, target);
    this.targetScales.set(id, new THREE.Vector3(...scale));

    if (!this.activeTarget) {
      this.activeTarget = id;
      this.writeBuffers(target, target);
      this.material.uniforms.uProgress.value = 1;
      this.material.uniforms.uSourceScale.value.copy(
        this.targetScales.get(id) ?? new THREE.Vector3(1, 1, 1),
      );
      this.material.uniforms.uTargetScale.value.copy(
        this.targetScales.get(id) ?? new THREE.Vector3(1, 1, 1),
      );
    }
  }

  morphTo(id: string, options: MorphToOptions = {}): void {
    const destination = this.targets.get(id);
    if (!destination) {
      this.onError?.(`Unknown morph target "${id}"`);
      return;
    }
    if (options.scale) {
      this.targetScales.set(id, new THREE.Vector3(...options.scale));
    }

    const sourceId = this.activeTarget;
    if (sourceId === id && !this.tween) {
      this.onTransitionStateChange?.(false);
      return;
    }

    const source =
      (sourceId ? this.targets.get(sourceId) : destination) ?? destination;
    this.writeBuffers(source, destination);
    this.material.uniforms.uSourceScale.value.copy(
      this.targetScales.get(sourceId ?? id) ?? new THREE.Vector3(1, 1, 1),
    );
    this.material.uniforms.uTargetScale.value.copy(
      this.targetScales.get(id) ?? new THREE.Vector3(1, 1, 1),
    );
    this.activeTarget = id;

    const cameraZ = options.cameraZ ?? 3.1;
    const durationSeconds = options.durationSeconds ?? 2.6;

    if (this.reducedMotion || durationSeconds <= 0) {
      this.tween = null;
      this.material.uniforms.uProgress.value = 1;
      this.camera.position.z = cameraZ;
      this.onTransitionStateChange?.(false);
      return;
    }

    this.material.uniforms.uProgress.value = 0;
    this.tween = {
      startTime: performance.now(),
      durationMs: durationSeconds * 1000,
      from: 0,
      to: 1,
    };
    this.camera.position.z = cameraZ;
    this.onTransitionStateChange?.(true);
  }

  getActiveTarget(): string | null {
    return this.activeTarget;
  }

  setLook(look: Partial<MorphLook>): void {
    this.look = { ...this.look, ...look };
    this.material.uniforms.uExpansionStrength.value = this.look.expansionStrength;
    this.material.uniforms.uTurbulenceStrength.value =
      this.look.turbulenceStrength;
    this.material.uniforms.uSynchronization.value = this.look.synchronization;
    this.material.uniforms.uParticleSize.value = this.look.particleSize;
    this.material.uniforms.uGlow.value = this.look.glow;
  }

  resize(width: number, height: number): void {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
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
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.handleContextLost,
    );
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  private writeBuffers(source: ParticleTarget, destination: ParticleTarget): void {
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(source.positions, 3),
    );
    this.geometry.setAttribute(
      "aTargetPosition",
      new THREE.BufferAttribute(destination.positions, 3),
    );
    this.geometry.setAttribute(
      "aSourceColor",
      new THREE.BufferAttribute(source.colors, 3),
    );
    this.geometry.setAttribute(
      "aTargetColor",
      new THREE.BufferAttribute(destination.colors, 3),
    );
    this.geometry.setAttribute(
      "aSeed",
      new THREE.BufferAttribute(source.seeds, 1),
    );
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
      this.material.uniforms.uTime.value = time / 1000;
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(render);
    };

    this.frameId = requestAnimationFrame(render);
  }

  private stepTween(time: number): void {
    if (!this.tween) return;
    const elapsed = time - this.tween.startTime;
    const linear = Math.min(1, elapsed / this.tween.durationMs);
    const eased = linear * linear * (3 - 2 * linear);
    this.material.uniforms.uProgress.value =
      this.tween.from + (this.tween.to - this.tween.from) * eased;
    if (linear >= 1) {
      this.tween = null;
      this.onTransitionStateChange?.(false);
    }
  }
}
