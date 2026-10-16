import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function metaContent(html, selector) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector(selector)?.getAttribute("content") ?? null;
}

// Parse width/height straight out of the PNG IHDR chunk (bytes 16-23, big-endian).
function pngDimensions(buf) {
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // PNG signature
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

describe("Open Graph share card (issue #7)", () => {
  const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
  const png = readFileSync(path.join(root, "og-image.png"));
  const ogUrl = "https://billyx86.github.io/petra-stone/og-image.png";

  it("og-image.png exists and is exactly 1200x630", () => {
    expect(pngDimensions(png)).toEqual({ width: 1200, height: 630 });
  });

  it("index.html declares an absolute og:image + twitter:image", () => {
    expect(metaContent(indexHtml, 'meta[property="og:image"]')).toBe(ogUrl);
    expect(metaContent(indexHtml, 'meta[name="twitter:image"]')).toBe(ogUrl);
  });

  it("og:image dimensions are declared so clients don't guess", () => {
    expect(metaContent(indexHtml, 'meta[property="og:image:width"]')).toBe("1200");
    expect(metaContent(indexHtml, 'meta[property="og:image:height"]')).toBe("630");
  });

  it("twitter:card is summary_large_image so the image actually renders", () => {
    expect(metaContent(indexHtml, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image"
    );
  });
});
