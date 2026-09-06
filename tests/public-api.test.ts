import { describe, expect, it } from "vitest";

import * as publicApi from "../src/engine";

describe("public package boundary", () => {
  it("exposes consumer APIs without renderer internals", () => {
    expect(publicApi).toHaveProperty("createScree");
    expect(publicApi).toHaveProperty("createImageTarget");
    expect(publicApi).toHaveProperty("createTextTarget");
    expect(publicApi).toHaveProperty("createSphereTarget");
    expect(publicApi).toHaveProperty("TRANSITION_PRESETS");
    expect(publicApi).not.toHaveProperty("createParticleRenderer");
    expect(publicApi).not.toHaveProperty("normalizePositions");
    expect(publicApi).not.toHaveProperty("FIELD_SAMPLE_GLSL");
  });
});
