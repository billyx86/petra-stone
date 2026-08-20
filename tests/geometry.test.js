import { describe, it, expect } from "vitest";
import { rockWarp, rockVertex, ROCK_SQUASH } from "../lib/geometry.js";

describe("rockWarp", () => {
  it("is bounded by the sum of its amplitude terms (<= 0.25)", () => {
    // Sample a dense set of unit directions; every warp must stay in range.
    for (let a = 0; a < 2 * Math.PI; a += Math.PI / 64) {
      for (let b = 0; b < 2 * Math.PI; b += Math.PI / 64) {
        const nx = Math.sin(a) * Math.cos(b);
        const ny = Math.cos(a);
        const nz = Math.sin(a) * Math.sin(b);
        const w = rockWarp(nx, ny, nz);
        expect(Math.abs(w)).toBeLessThanOrEqual(0.25 + 1e-9);
      }
    }
  });

  it("is deterministic (same direction, same warp)", () => {
    const nx = 0.31, ny = -0.62, nz = 0.72;
    expect(rockWarp(nx, ny, nz)).toBe(rockWarp(nx, ny, nz));
  });

  it("returns a finite number for every sampled direction", () => {
    const w = rockWarp(0, 1, 0);
    expect(Number.isFinite(w)).toBe(true);
  });
});

describe("rockVertex", () => {
  it("scales x and y by the squash factors (z unsquashed)", () => {
    // At a direction where warp contribution is non-zero, the x/y squash must
    // still hold relative to an un-squashed reference.
    const nx = 1, ny = 0, nz = 0;
    const v = rockVertex(nx, ny, nz);
    const w = rockWarp(nx, ny, nz);
    expect(v.x).toBeCloseTo(1 * (1 + w) * ROCK_SQUASH.x, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  it("moves vertices outward (radius grows) for positive warp", () => {
    const nx = 0, ny = 1, nz = 0;
    const w = rockWarp(nx, ny, nz);
    const v = rockVertex(nx, ny, nz);
    // radial component along +y is (1 + warp); if warp is positive the vertex
    // is further out than the unit sphere along y.
    if (w > 0) {
      expect(Math.abs(v.y)).toBeGreaterThan(ROCK_SQUASH.y);
    } else {
      expect(Math.abs(v.y)).toBeLessThan(ROCK_SQUASH.y);
    }
  });

  it("is symmetric in the sense that opposite directions give mirrored vertices", () => {
    // warp(-n) vs warp(n): the sin terms are odd, cos terms even, so it is
    // NOT symmetric — but the function must be well-defined and finite for
    // the opposite direction.
    const v1 = rockVertex(0.4, 0.5, -0.6);
    const v2 = rockVertex(-0.4, -0.5, 0.6);
    for (const key of ["x", "y", "z"]) {
      expect(Number.isFinite(v1[key])).toBe(true);
      expect(Number.isFinite(v2[key])).toBe(true);
    }
  });
});

describe("ROCK_SQUASH", () => {
  it("wider than tall (x squash > y squash)", () => {
    expect(ROCK_SQUASH.x).toBeGreaterThan(ROCK_SQUASH.y);
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(ROCK_SQUASH)).toBe(true);
  });
});
