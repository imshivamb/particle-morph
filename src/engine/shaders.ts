export const PARTICLE_VERTEX_SHADER = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uExpansionStrength;
uniform float uTurbulenceStrength;
uniform float uSynchronization;
uniform float uParticleSize;
uniform float uDpr;
uniform vec3 uSourceScale;
uniform vec3 uTargetScale;

attribute vec3 aTargetPosition;
attribute vec3 aSourceColor;
attribute vec3 aTargetColor;
attribute float aSeed;

varying vec3 vColor;
varying float vFlight;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

vec3 coherentNoise(vec3 point, float time) {
  return vec3(
    sin(point.y * 5.1 + time * 0.68 + aSeed * 6.28),
    cos(point.x * 4.4 - time * 0.61 + aSeed * 4.07),
    sin((point.x + point.y) * 3.7 + time * 0.49 + aSeed * 8.12)
  );
}

void main() {
  float spread = 1.0 - uSynchronization;
  float start = spread * aSeed * 0.24;
  float end = 1.0 - spread * (1.0 - aSeed) * 0.18;
  float localProgress = smoothstep(start, end, uProgress);
  float targetMix = smoothstep(0.32, 0.88, localProgress);
  float expansion =
    smoothstep(0.22, 0.48, localProgress) *
    (1.0 - smoothstep(0.48, 0.78, localProgress));
  float flight = 4.0 * localProgress * (1.0 - localProgress);

  vec3 sourcePosition = position * uSourceScale;
  vec3 targetPosition = aTargetPosition * uTargetScale;
  vec3 mixed = mix(sourcePosition, targetPosition, targetMix);
  vec3 radial = normalize(mixed + vec3(0.0001)) * expansion * uExpansionStrength;
  vec3 curl = coherentNoise(mixed, uTime) * flight * uTurbulenceStrength * 0.28;
  vec3 idle = coherentNoise(targetPosition, uTime * 0.35) * 0.012 * (1.0 - flight);
  vec3 displaced = mixed + radial + curl + idle;

  vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uParticleSize * uDpr * (1.0 + flight * 0.35) * (2.1 / max(0.35, -viewPosition.z));
  vColor = mix(aSourceColor, aTargetColor, targetMix);
  vFlight = flight;
}
`;

export const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
uniform float uGlow;

varying vec3 vColor;
varying float vFlight;

void main() {
  vec2 point = gl_PointCoord * 2.0 - 1.0;
  float radius = length(point);
  if (radius > 1.0) discard;

  float core = smoothstep(1.0, 0.18, radius);
  float halo = smoothstep(1.0, 0.0, radius) * uGlow * (0.45 + vFlight * 0.35);
  vec3 color = vColor * (0.72 + core * 0.55) + vec3(halo);
  float alpha = core * 0.92 + halo * 0.35;
  gl_FragColor = vec4(color, alpha);
}
`;
