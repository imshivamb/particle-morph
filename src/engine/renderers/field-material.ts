import * as THREE from "three";

import {
  behaviorModeIndex,
  pointerModeIndex,
  type MorphLook,
} from "../types";

export function createSharedFieldUniforms(look: MorphLook): {
  uProgress: { value: number };
  uTime: { value: number };
  uExpansionStrength: { value: number };
  uTurbulenceStrength: { value: number };
  uSynchronization: { value: number };
  uBehaviorMode: { value: number };
  uBehaviorStrength: { value: number };
  uPointer: { value: THREE.Vector2 };
  uPointerRadius: { value: number };
  uPointerStrength: { value: number };
  uPointerMode: { value: number };
  uParticleSize: { value: number };
  uOpacity: { value: number };
  uDpr: { value: number };
  uGlow: { value: number };
  uSourceScale: { value: THREE.Vector3 };
  uTargetScale: { value: THREE.Vector3 };
} {
  return {
    uProgress: { value: 1 },
    uTime: { value: 0 },
    uExpansionStrength: { value: look.expansionStrength },
    uTurbulenceStrength: { value: look.turbulenceStrength },
    uSynchronization: { value: look.synchronization },
    uBehaviorMode: { value: behaviorModeIndex(look.behavior) },
    uBehaviorStrength: { value: look.behaviorStrength },
    uPointer: { value: new THREE.Vector2(look.pointer.x, look.pointer.y) },
    uPointerRadius: { value: look.pointer.radius },
    uPointerStrength: { value: look.pointer.strength },
    uPointerMode: { value: pointerModeIndex(look.pointer.mode) },
    uParticleSize: { value: look.particleSize },
    uOpacity: { value: 1 },
    uDpr: { value: 1 },
    uGlow: { value: look.glow },
    uSourceScale: { value: new THREE.Vector3(1, 1, 1) },
    uTargetScale: { value: new THREE.Vector3(1, 1, 1) },
  };
}

export function applyLook(
  uniforms: THREE.ShaderMaterial["uniforms"],
  look: MorphLook,
): void {
  uniforms.uExpansionStrength.value = look.expansionStrength;
  uniforms.uTurbulenceStrength.value = look.turbulenceStrength;
  uniforms.uSynchronization.value = look.synchronization;
  uniforms.uBehaviorMode.value = behaviorModeIndex(look.behavior);
  uniforms.uBehaviorStrength.value = look.behaviorStrength;
  uniforms.uPointer.value.set(look.pointer.x, look.pointer.y);
  uniforms.uPointerRadius.value = look.pointer.radius;
  uniforms.uPointerStrength.value = look.pointer.strength;
  uniforms.uPointerMode.value = pointerModeIndex(look.pointer.mode);
  uniforms.uGlow.value = look.glow;
}