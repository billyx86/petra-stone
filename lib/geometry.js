// Pure rock-warp math, extracted from app.js so it can be unit tested.
//
// The "rock" is a radius-1 icosahedron whose vertices are displaced outward
// along their own direction by rockWarp(), then non-uniformly squashed.
// Everything here is deterministic — no randomness — so the rock is always
// the same rock.

export const ROCK_SQUASH = Object.freeze({ x: 1.08, y: 0.78 });

/**
 * How far a unit direction is pushed outward.
 * Bounded: |warp| <= 0.12 + 0.08 + 0.05 = 0.25.
 */
export function rockWarp(nx, ny, nz) {
  return (
    0.12 * Math.sin(nx * 4.2) * Math.cos(ny * 3.1) +
    0.08 * Math.sin(nz * 5.5 + nx * 2) +
    0.05 * Math.cos(ny * 7.3)
  );
}

/**
 * Final position of a vertex originally at unit direction (nx, ny, nz).
 * Mirrors exactly what makeStoneGeometry() did inline in app.js.
 */
export function rockVertex(nx, ny, nz) {
  const warp = rockWarp(nx, ny, nz);
  return {
    x: nx * (1 + warp) * ROCK_SQUASH.x,
    y: ny * (1 + warp) * ROCK_SQUASH.y,
    z: nz * (1 + warp),
  };
}
