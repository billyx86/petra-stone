// Stub for "three" — only exists so `import app.js` resolves under vitest.
// In the browser, three.js comes from the CDN import map (index.html), not
// npm, so it is not a real dependency. The code paths under test (no WebGL)
// never construct any of these; the renderer stub throws so a test that
// accidentally reaches createScene() fails loudly instead of half-running.
export class WebGLRenderer {
  constructor() {
    throw new Error("three stub: WebGL is not available in tests");
  }
}
export class Scene {}
export class Color {}
export class PerspectiveCamera {}
export class Mesh {}
export class IcosahedronGeometry {}
export class Vector3 {}
export class MeshPhysicalMaterial {}
export class MeshBasicMaterial {}
export class DirectionalLight {}
export class AmbientLight {}
export class HemisphereLight {}
export const SRGBColorSpace = "srgb";
export const ACESFilmicToneMapping = 2;
