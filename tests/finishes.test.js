import { describe, it, expect } from "vitest";
import { FINISHES } from "../lib/finishes.js";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

describe("FINISHES", () => {
  it("has exactly the six advertised finishes", () => {
    expect(FINISHES).toHaveLength(6);
  });

  it("every finish has a valid 6-digit hex", () => {
    for (const f of FINISHES) {
      expect(f.hex).toMatch(HEX_RE);
    }
  });

  it("finish names are unique", () => {
    const names = FINISHES.map((f) => f.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("all advertised names in the copy are present", () => {
    const advertised = [
      "Midnight",
      "Starlight",
      "Glacier Grey",
      "Desert Sand",
      "Alpine Green",
      "Product Red",
    ];
    for (const name of advertised) {
      expect(FINISHES.some((f) => f.name === name)).toBe(true);
    }
  });

  it("every hex is a distinct colour", () => {
    const hexes = FINISHES.map((f) => f.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});
