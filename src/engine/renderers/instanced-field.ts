import * as THREE from "three";

import type { ParticleFieldBuffers } from "./types";

export const SPRITE_DRAW_BUDGET = 13_547;
export const SHARD_DRAW_BUDGET = 11_290;
/** Points stay much denser than sprites/shards; only a light 8% thin. */
export const POINT_KEEP_RATIO = 0.92;

export function thinField(
  field: ParticleFieldBuffers,
  maxCount: number,
): ParticleFieldBuffers {
  const total = field.source.seeds.length;
  if (total <= maxCount) return field;

  const count = maxCount;
  const sourcePositions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const sourceColors = new Float32Array(count * 3);
  const targetColors = new Float32Array(count * 3);
  const sourceNormals = new Float32Array(count * 3);
  const targetNormals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.floor(((index + 0.5) * total) / count);
    const from = sourceIndex * 3;
    const to = index * 3;
    sourcePositions[to] = field.source.positions[from];
    sourcePositions[to + 1] = field.source.positions[from + 1];
    sourcePositions[to + 2] = field.source.positions[from + 2];
    targetPositions[to] = field.destination.positions[from];
    targetPositions[to + 1] = field.destination.positions[from + 1];
    targetPositions[to + 2] = field.destination.positions[from + 2];
    sourceColors[to] = field.source.colors[from];
    sourceColors[to + 1] = field.source.colors[from + 1];
    sourceColors[to + 2] = field.source.colors[from + 2];
    targetColors[to] = field.destination.colors[from];
    targetColors[to + 1] = field.destination.colors[from + 1];
    targetColors[to + 2] = field.destination.colors[from + 2];
    sourceNormals[to] = field.source.normals[from];
    sourceNormals[to + 1] = field.source.normals[from + 1];
    sourceNormals[to + 2] = field.source.normals[from + 2];
    targetNormals[to] = field.destination.normals[from];
    targetNormals[to + 1] = field.destination.normals[from + 1];
    targetNormals[to + 2] = field.destination.normals[from + 2];
    seeds[index] = field.source.seeds[sourceIndex];
  }

  return {
    source: {
      positions: sourcePositions,
      colors: sourceColors,
      seeds,
      normals: sourceNormals,
      count,
    },
    destination: {
      positions: targetPositions,
      colors: targetColors,
      seeds,
      normals: targetNormals,
      count,
    },
  };
}

export function bindInstancedField(
  geometry: THREE.InstancedBufferGeometry,
  field: ParticleFieldBuffers,
): number {
  const count = field.source.seeds.length;
  geometry.instanceCount = count;
  geometry.setAttribute(
    "aSourcePosition",
    new THREE.InstancedBufferAttribute(field.source.positions, 3),
  );
  geometry.setAttribute(
    "aTargetPosition",
    new THREE.InstancedBufferAttribute(field.destination.positions, 3),
  );
  geometry.setAttribute(
    "aSourceColor",
    new THREE.InstancedBufferAttribute(field.source.colors, 3),
  );
  geometry.setAttribute(
    "aTargetColor",
    new THREE.InstancedBufferAttribute(field.destination.colors, 3),
  );
  geometry.setAttribute(
    "aSourceNormal",
    new THREE.InstancedBufferAttribute(field.source.normals, 3),
  );
  geometry.setAttribute(
    "aTargetNormal",
    new THREE.InstancedBufferAttribute(field.destination.normals, 3),
  );
  geometry.setAttribute(
    "aSeed",
    new THREE.InstancedBufferAttribute(field.source.seeds, 1),
  );
  return count;
}
