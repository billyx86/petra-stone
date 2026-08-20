import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { rockVertex } from "./lib/geometry.js";
import { createMenuController } from "./lib/menu.js";
import { createFinishPicker } from "./lib/picker.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeStoneGeometry(detail = 1) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const p = rockVertex(n.x, n.y, n.z);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function makeMaterial(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? 0x8a8f98,
    metalness: opts.metalness ?? 0.55,
    roughness: opts.roughness ?? 0.35,
    clearcoat: opts.clearcoat ?? 0.6,
    clearcoatRoughness: 0.25,
    reflectivity: 0.6,
    envMapIntensity: 1.1,
  });
}

function createScene(canvas, options = {}) {
  const {
    color = 0x9aa0aa,
    bg = 0x000000,
    bgAlpha = 0,
    autoRotate = true,
    scale = 1.35,
    detail = 3,
    enableOrbit = true,
    cameraZ = 3.2,
    lightIntensity = 1,
  } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  if (bgAlpha > 0) scene.background = new THREE.Color(bg);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0.4, 0.25, cameraZ);

  const stone = new THREE.Mesh(makeStoneGeometry(detail), makeMaterial({ color }));
  stone.scale.setScalar(scale);
  stone.rotation.set(0.35, 0.6, 0.15);
  scene.add(stone);

  const rim = new THREE.Mesh(
    makeStoneGeometry(2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      wireframe: true,
    })
  );
  rim.scale.setScalar(scale * 1.02);
  scene.add(rim);

  const key = new THREE.DirectionalLight(0xffffff, 1.6 * lightIntensity);
  key.position.set(4, 6, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xa8c0ff, 0.55 * lightIntensity);
  fill.position.set(-5, 1, -2);
  scene.add(fill);

  const rimLight = new THREE.DirectionalLight(0xffe0c0, 0.7 * lightIntensity);
  rimLight.position.set(-2, 3, 6);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.25 * lightIntensity));

  const hemi = new THREE.HemisphereLight(0xdde6ff, 0x222228, 0.45 * lightIntensity);
  scene.add(hemi);

  let controls = null;
  if (enableOrbit) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 5.5;
    controls.autoRotate = autoRotate && !reduceMotion;
    controls.autoRotateSpeed = 0.9;
    controls.target.set(0, 0, 0);
  }

  let raf = 0;
  let visible = true;

  function resize() {
    const parent = canvas.parentElement || canvas;
    const w = parent.clientWidth || 1;
    const h = parent.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    if (!controls && !reduceMotion) {
      stone.rotation.y = t * 0.00035;
      rim.rotation.y = t * 0.00035;
    } else if (controls) {
      controls.update();
      rim.rotation.copy(stone.rotation);
    }
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", resize);

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.05 }
  );
  io.observe(canvas);

  raf = requestAnimationFrame(tick);

  return {
    stone,
    controls,
    setColor(hex) {
      stone.material.color.set(hex);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
      controls?.dispose();
      renderer.dispose();
    },
  };
}

/* Mount 3D scenes */
const heroCanvas = document.getElementById("heroCanvas");
const petraCanvas = document.getElementById("petraCanvas");
const airCanvas = document.getElementById("airCanvas");
const proCanvas = document.getElementById("proCanvas");
const ultraCanvas = document.getElementById("ultraCanvas");

if (heroCanvas) {
  const hero = createScene(heroCanvas, {
    color: 0xb0b6c0,
    scale: 1.45,
    detail: 4,
    cameraZ: 3.4,
    autoRotate: true,
  });
  const hint = document.getElementById("dragHint");
  const hideHint = () => hint?.classList.add("hidden");
  heroCanvas.addEventListener("pointerdown", hideHint, { once: true });
  setTimeout(hideHint, 6000);
  window.__hero = hero;
  const finishPicker = document.getElementById("finishPicker");
  if (finishPicker) createFinishPicker({ root: finishPicker, scene: hero });
}

if (petraCanvas) {
  createScene(petraCanvas, {
    color: 0x6b7280,
    scale: 1.25,
    detail: 3,
    enableOrbit: false,
    cameraZ: 3.0,
  });
}

if (airCanvas) {
  createScene(airCanvas, {
    color: 0xd4d4d8,
    scale: 1.1,
    detail: 3,
    enableOrbit: false,
    cameraZ: 3.1,
    lightIntensity: 1.15,
  });
}

if (proCanvas) {
  createScene(proCanvas, {
    color: 0x3f3f46,
    scale: 1.3,
    detail: 4,
    enableOrbit: false,
    cameraZ: 3.0,
  });
}

if (ultraCanvas) {
  createScene(ultraCanvas, {
    color: 0xc0c5ce,
    scale: 1.7,
    detail: 4,
    enableOrbit: true,
    cameraZ: 3.8,
    autoRotate: true,
    lightIntensity: 1.25,
  });
}

/* Mobile menu (full behaviour lives in lib/menu.js) */
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const menuCtrl = menuToggle && mobileMenu
  ? createMenuController({ toggle: menuToggle, panel: mobileMenu })
  : null;
menuCtrl?.bind();

/* Buy toast */
const toast = document.getElementById("toast");
let toastTimer = 0;
function showToast() {
  if (!toast) return;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
document.querySelectorAll(".btn-pill, .btn-primary").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showToast();
  });
});

/* Scroll reveal */
if (!reduceMotion) {
  const targets = document.querySelectorAll(
    ".product-copy, .why-card, .feature-item, .support-grid > div, .quote-block blockquote, .specs-inner h2"
  );
  targets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

/* Smooth nav shadow on scroll */
const nav = document.getElementById("nav");
window.addEventListener(
  "scroll",
  () => {
    if (!nav) return;
    nav.style.borderBottomColor =
      window.scrollY > 8 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)";
  },
  { passive: true }
);
