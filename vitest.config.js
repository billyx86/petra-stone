import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // three.js is CDN-only (import map in index.html) and not an npm dep.
      // Aliased to stubs so app.js can be imported under jsdom; in the
      // browser the real CDN modules load via the import map instead.
      // Order matters: the specific key must precede the bare "three" key.
      "three/addons/controls/OrbitControls.js": fileURLToPath(
        new URL("./tests/stubs/OrbitControls.js", import.meta.url)
      ),
      three: fileURLToPath(new URL("./tests/stubs/three.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
