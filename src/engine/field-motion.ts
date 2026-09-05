export const FIELD_SAMPLE_GLSL = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uExpansionStrength;
uniform float uTurbulenceStrength;
uniform float uSynchronization;
uniform vec3 uSourceScale;
uniform vec3 uTargetScale;

struct FieldSample {
  vec3 position;
  vec3 color;
  vec3 normal;
  float flight;
};

vec3 coherentNoise(vec3 point, float time, float seed) {
  return vec3(
    sin(point.y * 5.1 + time * 0.68 + seed * 6.28),
    cos(point.x * 4.4 - time * 0.61 + seed * 4.07),
    sin((point.x + point.y) * 3.7 + time * 0.49 + seed * 8.12)
  );
}

FieldSample sampleField(
  vec3 sourcePosition,
  vec3 targetPosition,
  vec3 sourceColor,
  vec3 targetColor,
  vec3 sourceNormal,
  vec3 targetNormal,
  float seed
) {
  float spread = 1.0 - uSynchronization;
  float start = spread * seed * 0.24;
  float end = 1.0 - spread * (1.0 - seed) * 0.18;
  float localProgress = smoothstep(start, end, uProgress);
  float targetMix = smoothstep(0.32, 0.88, localProgress);
  float expansion =
    smoothstep(0.22, 0.48, localProgress) *
    (1.0 - smoothstep(0.48, 0.78, localProgress));
  float flight = 4.0 * localProgress * (1.0 - localProgress);

  vec3 source = sourcePosition * uSourceScale;
  vec3 target = targetPosition * uTargetScale;
  vec3 mixed = mix(source, target, targetMix);
  vec3 radial = normalize(mixed + vec3(0.0001)) * expansion * uExpansionStrength;
  vec3 curl = coherentNoise(mixed, uTime, seed) * flight * uTurbulenceStrength * 0.28;
  vec3 idle = coherentNoise(target, uTime * 0.35, seed) * 0.012 * (1.0 - flight);

  vec3 normal = normalize(mix(sourceNormal, targetNormal, targetMix) + vec3(0.0001));
  float lit = 0.34 + 0.66 * max(dot(normal, normalize(vec3(0.42, 0.78, 0.74))), 0.0);
  float wrap = 0.18 * max(dot(normal, normalize(vec3(-0.55, 0.15, 0.4))), 0.0);
  float rim = pow(1.0 - max(dot(normal, vec3(0.12, 0.22, 0.96)), 0.0), 2.0) * 0.28;

  FieldSample field;
  field.position = mixed + radial + curl + idle;
  field.color = mix(sourceColor, targetColor, targetMix) * (lit + wrap) + vec3(rim * 0.25, rim * 0.4, rim * 0.55);
  field.normal = normal;
  field.flight = flight;
  return field;
}
`;
