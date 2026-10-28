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
picker, and the WebGL fallback layer) is unit-tested with vitest:

```bash
npm install
npm test
```

CI (`.github/workflows/test.yml`) runs the suite on every push to `main`
and on pull requests.

## Accessibility & resilience

- **Finish picker keyboard support** — the hero finish swatches follow the
  APG *radio-group* pattern: a roving `tabindex` keeps exactly one swatch in
  the tab order (the selection, or the first until you pick), and
  `←` / `→` / `↑` / `↓` move focus *and* selection with wraparound, `Home` /
  `End` jump to either end. Enter/Space keep native button activation.
- **WebGL fallback** — the 3D scenes are wrapped in `mountScene()`. If the
  browser has no WebGL (or a renderer throws), each canvas is swapped, in
  place, for a labelled static placeholder and the rest of the page keeps
  working. If a WebGL context is lost mid-session and does not recover, the
  affected scene is swapped the same way. All of this lives in
  `lib/webgl.js` and is covered by jsdom tests.

## Stack

- HTML / CSS / ES modules
- Three.js via CDN import map
- No build step

Parody. Not affiliated with Apple Inc.
