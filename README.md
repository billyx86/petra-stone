# Petra — The rock, reimagined.

Apple-style parody marketing site with interactive Three.js 3D product renders.

We sell rocks. Premium ones. From $999.

## Open

Serve the folder (modules need a local server):

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open the URL. Or enable GitHub Pages on `main` / root.

## Tests

Pure logic (rock-warp math, finish palette, mobile menu controller, finish
picker) is unit-tested with vitest:

```bash
npm install
npm test
```

CI (`.github/workflows/test.yml`) runs the suite on every push to `main`
and on pull requests.

## Stack

- HTML / CSS / ES modules
- Three.js via CDN import map
- No build step

Parody. Not affiliated with Apple Inc.
