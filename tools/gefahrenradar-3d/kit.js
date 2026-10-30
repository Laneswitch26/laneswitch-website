// LANE SWITCH Gefahrenradar · 3D-Baukasten (nur Werkzeug zum Vorrendern, nicht Teil der Website).
// Koordinaten: x nach rechts, y nach oben, zf = Entfernung in Fahrtrichtung (three.js z = -zf).
import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export {THREE};

export const W = 960, H = 672; // 10:7 wie die Spielbühne (800 × 560)
let seed = 11;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const reseed = s => { seed = s; };
export const P = (x, y, zf) => new THREE.Vector3(x, y, -zf);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, t) => { const u = clamp((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// ---------------- Texturen (einmal erzeugt, überall wiederverwendet) ----------------
const texCache = new Map();
function canvasTex(key, w, h, draw, {rep = [1, 1], srgb = true} = {}) {
  if (texCache.has(key)) { const t = texCache.get(key).clone(); t.repeat.set(...rep); t.needsUpdate = true; return t; }
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; texCache.set(key, t);
  const out = t.clone(); out.repeat.set(...rep); out.needsUpdate = true; return out;
}
function noise(g, w, h, base, amp, n) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < (n ?? w * h / 6); i++) { const v = (rnd() - 0.5) * amp; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
}
const T = {
  asphalt: rep => canvasTex('asphalt', 512, 1024, (g, w, h) => {
    noise(g, w, h, '#55595b', 0.22, 120000); g.globalAlpha = 0.16;
    for (let i = 0; i < 14; i++) { g.fillStyle = rnd() > 0.5 ? '#3f4446' : '#676b6c'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 90, 20 + rnd() * 160, rnd(), 0, 7); g.fill(); }
    g.globalAlpha = 0.3; g.strokeStyle = '#2c3133'; g.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (rnd() - 0.5) * 30; y += rnd() * 20; g.lineTo(x, y); } g.stroke(); }
  }, {rep}),
  paving: rep => canvasTex('paving', 256, 256, (g, w, h) => {
    noise(g, w, h, '#b9b6ad', 0.12, 20000); g.strokeStyle = 'rgba(70,70,65,.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    for (let r = 0; r < 4; r++) for (let i = 0; i <= 2; i++) { const x = i * 128 + (r % 2) * 64; g.beginPath(); g.moveTo(x, r * 64); g.lineTo(x, r * 64 + 64); g.stroke(); }
  }, {rep}),
  grass: rep => canvasTex('grass', 256, 256, (g, w, h) => {
    noise(g, w, h, '#6c8a4a', 0.3, 30000);
    for (let i = 0; i < 2500; i++) { g.strokeStyle = rnd() > 0.5 ? 'rgba(150,180,90,.5)' : 'rgba(40,70,30,.4)'; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 3 - rnd() * 4); g.stroke(); }
  }, {rep}),
  hedge: rep => canvasTex('hedge', 256, 128, (g, w, h) => {
    noise(g, w, h, '#3f5f34', 0.35, 40000);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${100 + rnd() * 60},${140 + rnd() * 50},${60 + rnd() * 30},.55)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 3, 1 + rnd() * 2, rnd() * 3, 0, 7); g.fill(); }
  }, {rep}),
  roof: rep => canvasTex('roof', 128, 128, (g, w, h) => {
    noise(g, w, h, '#8b4a3a', 0.25, 6000); g.strokeStyle = 'rgba(40,15,10,.5)'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 16 % 2) * 8; x < w; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
  }, {rep}),
  // Eine Fensterachse (2,6 m breit) als Kachel: wird je Haus horizontal wiederholt.
  facade: (color, floors, rep) => canvasTex('facade' + color + floors, 104, Math.round((floors * 2.7 + 0.8) * 40), (g, w, h) => {
    noise(g, w, h, color, 0.08, w * h / 10); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h - 24, w, 24);
    for (let f = 0; f < floors; f++) {
      const ww = 44, wh = 58, cx = w / 2, y = h - (40 + f * 108) - wh;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - ww / 2 - 3, y - 3, ww + 6, wh + 8); g.fillStyle = '#f3f1ea'; g.fillRect(cx - ww / 2 - 4, y - 4, ww + 8, wh + 8);
      const gr = g.createLinearGradient(0, y, 0, y + wh); gr.addColorStop(0, '#9fb9c9'); gr.addColorStop(.5, '#3b4c5a'); gr.addColorStop(1, '#26323c'); g.fillStyle = gr; g.fillRect(cx - ww / 2, y, ww, wh);
      g.fillStyle = '#f3f1ea'; g.fillRect(cx - 2, y, 4, wh); g.fillRect(cx - ww / 2, y + wh * 0.38, ww, 3); g.fillStyle = '#d6d1c6'; g.fillRect(cx - ww / 2 - 7, y + wh + 3, ww + 14, 5);
      if ((f + floors) % 3 === 1) { g.fillStyle = 'rgba(240,236,226,.85)'; g.fillRect(cx - ww / 2, y, ww * 0.45, wh * 0.9); }
    }
  }, {rep}),
  forest: rep => canvasTex('forest', 512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f4a2c'); gr.addColorStop(1, '#1d2e1c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = rnd() * w, y = h * (0.25 + rnd() * 0.7); g.fillStyle = `rgba(${40 + rnd() * 40},${70 + rnd() * 50},${35 + rnd() * 25},.8)`; g.beginPath(); g.ellipse(x, y, 10 + rnd() * 26, 18 + rnd() * 40, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(60,45,35,.8)'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, h * 0.55 + rnd() * h * 0.4, 3, h);
  }, {rep}),
  leaf: () => canvasTex('leaf', 128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const x = 20 + rnd() * 88, y = 20 + rnd() * 88; g.save(); g.translate(x, y); g.rotate(rnd() * 6.3); const v = Math.floor(rnd() * 60); g.fillStyle = `rgb(${70 + v},${110 + v},${45 + v / 2})`; g.beginPath(); g.ellipse(0, 0, 16, 8, 0, 0, 7); g.fill(); g.restore(); }
  }),
  sign: (key, draw, w = 256, h = 256) => canvasTex('sign-' + key, w, h, draw),
};
export {T};

// ---------------- Materialien ----------------
const S = o => new THREE.MeshStandardMaterial(o);
export const paint = c => new THREE.MeshPhysicalMaterial({color: c, roughness: 0.32, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08});
export const MAT = {};
function initMaterials(w) {
  Object.assign(MAT, {
    road: S({map: T.asphalt([1, 30]), roughness: w.wet ? 0.5 : 0.92, metalness: 0, envMapIntensity: w.wet ? 0.6 : 1, color: w.wet ? 0x8a9095 : 0xffffff}),
    walk: S({map: T.paving([1, 120]), roughness: 0.95}), kerb: S({color: 0xb9b5aa, roughness: 0.9}),
    line: S({color: 0xeceade, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2}),
    hedge: S({map: T.hedge([6, 1]), roughness: 1}), trunk: S({color: 0x5a4a3c, roughness: 1}),
    pole: S({color: 0x50575c, roughness: 0.5, metalness: 0.6}), steel: S({color: 0x9aa1a5, roughness: 0.35, metalness: 0.9}),
    glass: new THREE.MeshPhysicalMaterial({color: 0x1b2731, roughness: 0.06, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.3}),
    tire: S({color: 0x1b1d1f, roughness: 0.85}), rim: S({color: 0xb8c0c4, roughness: 0.25, metalness: 0.9}), dark: S({color: 0x1e2326, roughness: 0.6}),
    white: S({color: 0xf2f2ee, roughness: 0.5}), concrete: S({color: 0xa9a59c, roughness: 0.95}),
    leaves: ['#4e7a3f', '#5f8c46', '#6c9a4c', '#45703a', '#7aa556'].map(c => S({color: c, roughness: 1, envMapIntensity: 0.4, flatShading: true})),
  });
  MAT.lamp = (color, on = false) => S({color, emissive: on ? color : 0x000000, emissiveIntensity: on ? 2.2 : 0, roughness: 0.3});
}

// ---------------- Welt ----------------
export function createWorld({preset = 'town', wet = false} = {}) {
  reseed(11);
  const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const look = {
    town: {sun: [0.42, 0.30, -0.84], turb: 5, ray: 1.6, fog: [0xd9d2c0, 0.009], exp: 0.6, sunI: 3.3, hemi: 0.85},
    rural: {sun: [-0.35, 0.36, -0.86], turb: 4, ray: 1.8, fog: [0xd6dccf, 0.0075], exp: 0.6, sunI: 3.2, hemi: 0.85},
    rain: {sun: [0.2, 0.55, -0.8], turb: 18, ray: 0.6, fog: [0x9ea6aa, 0.02], exp: 0.55, sunI: 0.6, hemi: 1.5},
    fog: {sun: [0.1, 0.5, -0.86], turb: 20, ray: 0.4, fog: [0xc9cdcd, 0.018], exp: 0.62, sunI: 0.5, hemi: 1.6},
  }[preset];
  const SUN = new THREE.Vector3(...look.sun).normalize();
  const sky = new Sky(); sky.scale.setScalar(4000); const su = sky.material.uniforms;
  su.turbidity.value = look.turb; su.rayleigh.value = look.ray; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.86; su.sunPosition.value.copy(SUN); scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer); const env = new THREE.Scene(); const sky2 = sky.clone(); sky2.material = sky.material.clone(); env.add(sky2);
  const ge = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshBasicMaterial({color: 0x6d7458})); ge.rotation.x = -Math.PI / 2; ge.position.y = -2; env.add(ge);
  scene.environment = pmrem.fromScene(env, 0.02).texture;
  if (preset === 'rain' || preset === 'fog') { scene.background = new THREE.Color(look.fog[0]); sky.visible = false; }
  scene.fog = new THREE.FogExp2(look.fog[0], look.fog[1]);
  renderer.toneMappingExposure = look.exp;
  scene.add(new THREE.HemisphereLight(0xbfd8ef, 0x5d6a48, look.hemi));
  const sun = new THREE.DirectionalLight(0xffe2bf, look.sunI); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 55; sc.bottom = -55; sc.near = 1; sc.far = 400; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const camera = new THREE.PerspectiveCamera(56, W / H, 0.05, 1500); scene.add(camera);
  const w = {THREE, renderer, scene, camera, sun, SUN, preset, wet, updaters: [], hazards: []};
  initMaterials(w);
  w.statics = []; w.staticDepth = 0;
  w.add = (geo, m, x, y, zf, cast = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, -zf); o.castShadow = cast; o.receiveShadow = true; scene.add(o); if (w.staticDepth > 0) w.statics.push(o); return o; };
  w.onUpdate = f => w.updaters.push(f);
  w.cockpit = cockpit(w);
  return w;
}

// Kamera: Fahrprofil aus Geschwindigkeitsstützpunkten [[t, v], ...] (m/s), Spur x, optional Lenkung.
export function drive(w, {x = 1.25, speeds = [[0, 8.3]], yaw = () => 0, xAt = null, z0 = 0}) {
  const v = t => { if (t <= speeds[0][0]) return speeds[0][1]; for (let i = 1; i < speeds.length; i++) if (t <= speeds[i][0]) { const [a, va] = speeds[i - 1], [b, vb] = speeds[i]; const u = (t - a) / (b - a); return va + (vb - va) * u * u * (3 - 2 * u); } return speeds[speeds.length - 1][1]; };
  const table = []; let z = z0; for (let t = 0; t <= 20; t += 1 / 200) { table.push(z); z += v(t) / 200; }
  const zAt = t => table[Math.min(table.length - 1, Math.round(t * 200))];
  w.drive = {v, zAt};
  w.onUpdate(t => {
    const cam = w.camera, zf = zAt(t), sp = v(t);
    cam.position.set(xAt ? xAt(t) : x, 1.22 + Math.sin(t * 8.5) * 0.006 * Math.min(1, sp / 4), -zf);
    cam.rotation.set(-0.045, yaw(t) + Math.sin(t * 0.7) * 0.003 * Math.min(1, sp / 4), 0, 'YXZ');
    w.sun.position.copy(cam.position).addScaledVector(w.SUN, 150); w.sun.target.position.set(cam.position.x, 0, cam.position.z - 30); w.sun.target.updateMatrixWorld();
    w.cockpit.setSpeed(sp * 3.6);
  });
  return w.drive;
}
export function setTime(w, t) { for (const f of w.updaters) f(t); }
// Unbewegliche Umgebung (Straßen, Häuser, Bäume …) wird nach Material zusammengefasst: weniger Zeichenaufrufe, schnelleres Rendern.
const statically = fn => (w, ...a) => { w.staticDepth++; try { return fn(w, ...a); } finally { w.staticDepth--; } };
export function bake(w) {
  const groups = new Map(); const keep = new Set(['position', 'normal', 'uv']);
  for (const m of w.statics) {
    if (Array.isArray(m.material) || m.parent !== w.scene || m.userData.dynamic) continue;
    m.updateMatrixWorld(true);
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    if (!g.attributes.uv || !g.attributes.normal) continue;
    for (const k of Object.keys(g.attributes)) if (!keep.has(k)) g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(m.matrixWorld);
    const key = m.material.uuid + (m.castShadow ? '|c' : '');
    if (!groups.has(key)) groups.set(key, {mat: m.material, cast: m.castShadow, list: []});
    groups.get(key).list.push(g); w.scene.remove(m);
  }
  for (const {mat, cast, list} of groups.values()) { const merged = mergeGeometries(list, false); if (!merged) continue; const o = new THREE.Mesh(merged, mat); o.castShadow = cast; o.receiveShadow = true; o.matrixAutoUpdate = false; w.scene.add(o); }
  w.statics = [];
}
export function render(w) { w.renderer.render(w.scene, w.camera); }
// Gefahrenbereiche als Ellipsen im 800 × 560-Koordinatensystem der Spielbühne.
export function hazardAreas(w, t) {
  const out = [];
  for (const h of w.hazards) {
    const list = h(t); if (!list) continue;
    for (const {pos, r = 0.8, min = 72} of list) {
      const p = pos.clone().project(w.camera); if (p.z > 1 || p.z < -1) continue;
      const d = pos.distanceTo(w.camera.position); const f = (H / 2) / Math.tan(THREE.MathUtils.degToRad(w.camera.fov / 2));
      const rad = r / d * f * 800 / W;
      out.push([Math.round((p.x + 1) / 2 * 800), Math.round((1 - p.y) / 2 * 560), Math.round(Math.max(min, rad * 1.25)), Math.round(Math.max(min, rad * 1.25))]);
    }
  }
  return out;
}

// ---------------- Cockpit (in allen Szenen gleich) ----------------
function cockpit(w) {
  const g = new THREE.Group(); w.camera.add(g);
  const tv = Math.tan(THREE.MathUtils.degToRad(w.camera.fov / 2)), asp = W / H;
  const at = (sx, sy, z) => [(sx - 0.5) * 2 * tv * asp * z, -(sy - 0.5) * 2 * tv * z, -z]; // Bildschirmanteil -> Kameraraum
  const hood = new THREE.PlaneGeometry(5.0, 1.0, 50, 8); const hp = hood.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i); hp.setZ(i, -0.022 * x * x); } hood.computeVertexNormals();
  const hm = new THREE.Mesh(hood, new THREE.MeshPhysicalMaterial({color: 0x0f3d60, roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.35}));
  // Motorhaube zwischen 80 % und 87 % der Bildhöhe, immer oberhalb der Fahrbahn.
  { const [, yf] = at(0.5, 0.80, 3.4), [, yr] = at(0.5, 0.88, 2.5); hm.position.set(0.37, (yf + yr) / 2, -2.95); hm.rotation.x = -Math.PI / 2 + Math.atan2(yf - yr, 0.9); } g.add(hm);
  const dashM = S({color: 0x151d22, roughness: 0.85});
  const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.25), dashM); { const [, y] = at(0.5, 0.875, 0.805); dash.position.set(0.37, y - 0.15, -0.68); g.userData.dashTop = y; }; g.add(dash);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 12), S({color: 0x2c3a42, roughness: 0.6})); lip.rotation.z = Math.PI / 2; lip.position.set(0.37, g.userData.dashTop - 0.02, -0.80); g.add(lip);
  const pilM = S({color: 0x10181d, roughness: 0.8});
  for (const [ax, bx] of [[-0.66, -0.54], [1.40, 1.28]]) { const a = new THREE.Vector3(ax, -0.62, -1.0), b = new THREE.Vector3(bx, 0.42, -0.36); const v = b.clone().sub(a); const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, v.length(), 0.08), pilM); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(m); }
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.0), S({color: 0x2a3338, roughness: 0.95})); roofL.position.set(0.37, 0.42, -0.45); roofL.rotation.x = 0.18; g.add(roofL);
  const mir = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.03), S({color: 0x111a1f, roughness: 0.6})); mir.position.set(0.36, 0.215, -0.9); mir.rotation.y = -0.25; g.add(mir);
  const mg = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshPhysicalMaterial({color: 0x8899a0, metalness: 1, roughness: 0.05})); mg.position.set(0.36, 0.215, -0.884); mg.rotation.y = -0.25; g.add(mg);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), pilM); stem.position.set(0.37, 0.28, -0.91); g.add(stem);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.026, 16, 48), S({color: 0x0c1114, roughness: 0.55})); { const [, y] = at(0.5, 1.0, 0.55); wheel.position.set(0, y - 0.15, -0.55); }; wheel.rotation.x = -0.35; g.add(wheel);
  // Kombiinstrument: Tacho + Blinkerpfeile, nur bei Änderung neu gezeichnet.
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const cx = c.getContext('2d'); const ct = new THREE.CanvasTexture(c); ct.colorSpace = THREE.SRGBColorSpace;
  const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), new THREE.MeshBasicMaterial({map: ct, toneMapped: false})); { const [, y] = at(0.5, 0.94, 0.5); cl.position.set(0, y, -0.5); } g.add(cl);
  let state = {speed: -1, left: false, right: false, label: 'Zone 30'};
  function draw() {
    const s = state; cx.fillStyle = '#071015'; cx.fillRect(0, 0, 512, 160); cx.lineCap = 'round'; cx.lineWidth = 12;
    cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.beginPath(); cx.arc(120, 92, 60, Math.PI * 0.85, Math.PI * 2.15); cx.stroke();
    cx.strokeStyle = '#65e5df'; cx.beginPath(); cx.arc(120, 92, 60, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * Math.min(1, s.speed / 60) + 0.001)); cx.stroke();
    cx.fillStyle = '#e9f6f5'; cx.font = 'bold 44px Arial'; cx.textAlign = 'center'; cx.fillText(String(s.speed), 120, 104); cx.font = '18px Arial'; cx.fillStyle = 'rgba(233,246,245,.6)'; cx.fillText('km/h', 120, 130);
    cx.textAlign = 'left'; cx.font = 'bold 24px Arial'; cx.fillStyle = 'rgba(233,246,245,.8)'; cx.fillText(s.label, 230, 80); cx.font = '22px Arial'; cx.fillStyle = 'rgba(233,246,245,.5)'; cx.fillText('D · Automatik', 230, 115);
    const arrow = (x, dir, on) => { cx.fillStyle = on ? '#3ee07a' : 'rgba(255,255,255,.10)'; cx.beginPath(); cx.moveTo(x + dir * 22, 30); cx.lineTo(x, 14); cx.lineTo(x, 22); cx.lineTo(x - dir * 18, 22); cx.lineTo(x - dir * 18, 38); cx.lineTo(x, 38); cx.lineTo(x, 46); cx.closePath(); cx.fill(); };
    arrow(36, -1, s.left); arrow(476, 1, s.right); ct.needsUpdate = true;
  }
  const api = {
    blink: null, label: 'Zone 30',
    setSpeed(kmh) { const v = Math.max(0, Math.round(kmh)); if (v !== state.speed) { state.speed = v; draw(); } },
  };
  w.onUpdate(t => { const on = Math.floor(t * 2.6) % 2 === 0; const l = api.blink === 'left' && on, r = api.blink === 'right' && on; if (l !== state.left || r !== state.right || api.label !== state.label) { state.left = l; state.right = r; state.label = api.label; draw(); } });
  return api;
}

// ---------------- Straßen ----------------
// Gerade Straße mit Gehwegen; gaps: {left:[[z0,z1]], right:[[z0,z1]]} für Einmündungen.
export const townStreet = statically(function townStreet(w, {len = 260, width = 6.5, gaps = {left: [], right: []}, houseGaps = null, centerLine = true, houses = true, trees = true, hedges = true, lamps = true, z0 = -10} = {}) {
  const half = width / 2;
  const strip = (a, b, y, m, th, za, zb, cast = false) => w.add(new THREE.BoxGeometry(b - a, th, zb - za), m, (a + b) / 2, y - th / 2, (za + zb) / 2, cast);
  strip(-half, half, 0, MAT.road, 0.02, z0, z0 + len);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(160, len + 40), S({map: T.grass([30, 60]), roughness: 1})); gr.rotation.x = -Math.PI / 2; gr.position.set(0, -0.03, -(z0 + len / 2)); gr.receiveShadow = true; w.scene.add(gr);
  if (centerLine) for (let z = z0; z < z0 + len; z += 6) w.add(new THREE.BoxGeometry(0.13, 0.004, 3), MAT.line, 0, 0.002, z + 1.5, false);
  for (const s of [-1, 1]) {
    const gl = (s < 0 ? gaps.left : gaps.right) || [];
    const hgl = houseGaps ? ((s < 0 ? houseGaps.left : houseGaps.right) || []) : gl;
    const freeOf = (pad, list = gl) => { const out = []; let a = z0; for (const [g0, g1] of [...list].sort((p, q) => p[0] - q[0])) { if (g0 - pad > a) out.push([a, g0 - pad]); a = Math.max(a, g1 + pad); } if (a < z0 + len) out.push([a, z0 + len]); return out; };
    if (houses) for (const [za, zb] of freeOf(houseGaps ? 0 : 17, hgl)) houseRow(w, s, half + 9.25, za, zb);
    for (const [za, zb] of freeOf(0)) {
      strip(s < 0 ? -half - 2.55 : half + 0.15, s < 0 ? -half - 0.15 : half + 2.55, 0.13, MAT.walk, 0.13, za, zb);
      w.add(new THREE.BoxGeometry(0.15, 0.14, zb - za), MAT.kerb, s * (half + 0.075), 0.07, (za + zb) / 2, false);
      if (hedges) for (let z = za + 1; z + 4 < zb && z < 230; z += 16) { const l = Math.min(10.5, zb - z - 1); if (l > 2) hedge(w, s * (half + 3.05), z + l / 2, l); }
      if (trees) for (let z = za + 6; z < zb - 2 && z < 240; z += 15) tree(w, s * (half + 1.5), z + rnd() * 2, 0.85 + rnd() * 0.35);
      if (lamps) for (let z = za + 12 + (s > 0 ? 15 : 0); z < zb - 2 && z < 240; z += 30) lamp(w, s * (half + 2.05), z, s);
    }
  }
});
// Querstraße (Einmündung/Kreuzung) bei zc; sides: 'left' | 'right' | 'both'.
export const sideRoad = statically(function sideRoad(w, {zc, width = 6.0, sides = 'both', mainHalf = 3.25, houses = true, centerLine = false, len = 70} = {}) {
  const half = width / 2;
  for (const s of sides === 'both' ? [-1, 1] : [sides === 'left' ? -1 : 1]) {
    const x0 = s * mainHalf, x1 = s * (mainHalf + len);
    w.add(new THREE.BoxGeometry(len, 0.02, width), MAT.road, (x0 + x1) / 2, -0.01, zc, false);
    if (centerLine) for (let k = 4; k < len; k += 6) w.add(new THREE.BoxGeometry(3, 0.004, 0.13), MAT.line, s * (mainHalf + k), 0.002, zc, false);
    for (const e of [-1, 1]) {
      const zz = zc + e * (half + 1.35);
      w.add(new THREE.BoxGeometry(len - 2.6, 0.13, 2.4), MAT.walk, s * (mainHalf + 2.6 + (len - 2.6) / 2), 0.065, zz, false);
      w.add(new THREE.BoxGeometry(len - 2.6, 0.14, 0.15), MAT.kerb, s * (mainHalf + 2.6 + (len - 2.6) / 2), 0.07, zc + e * (half + 0.075), false);
      if (houses) for (let k = 0; k < 3; k++) { const hx = s * (mainHalf + 13 + k * 15); const h = 6 + rnd() * 2.4; house(w, hx, zc + e * (half + 12), 11, h, 9, 'z', -e); }
    }
  }
});
// Landstraße mit Leitlinien, Leitpfosten und Wald oder Feld.
export const ruralRoad = statically(function ruralRoad(w, {len = 300, width = 6.0, forest = 'both', fields = false, z0 = -10, trees = true} = {}) {
  const half = width / 2;
  w.add(new THREE.BoxGeometry(width, 0.02, len), MAT.road, 0, -0.01, z0 + len / 2, false);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, len + 40), S({map: T.grass([60, 70]), roughness: 1, color: fields ? 0xcfd29a : 0xffffff})); gr.rotation.x = -Math.PI / 2; gr.position.set(0, -0.03, -(z0 + len / 2)); gr.receiveShadow = true; w.scene.add(gr);
  for (let z = z0; z < z0 + len; z += 12) w.add(new THREE.BoxGeometry(0.12, 0.004, 4), MAT.line, 0, 0.002, z + 2, false);
  for (const s of [-1, 1]) w.add(new THREE.BoxGeometry(0.15, 0.004, len), MAT.line, s * (half - 0.25), 0.002, z0 + len / 2, false);
  // Bankett
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, len), S({color: 0x8c8a74, roughness: 1})); b.rotation.x = -Math.PI / 2; b.position.set(s * (half + 0.6), -0.02, -(z0 + len / 2)); b.receiveShadow = true; w.scene.add(b); }
  for (const s of [-1, 1]) for (let z = 0; z < len; z += 50) { const p = w.add(new THREE.BoxGeometry(0.12, 1.0, 0.12), MAT.white, s * (half + 1.0), 0.5, z, true); w.add(new THREE.BoxGeometry(0.13, 0.12, 0.13), MAT.dark, s * (half + 1.0), 0.85, z, false); }
  for (const s of [-1, 1]) {
    const side = forest === 'both' || (forest === 'left' && s < 0) || (forest === 'right' && s > 0);
    if (side) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, 9), S({map: T.forest([len / 30, 1]), roughness: 1, color: 0x9aa89a})); wall.rotation.y = s * -Math.PI / 2; wall.position.set(s * 24, 4.5, -(z0 + len / 2)); w.scene.add(wall);
      if (trees) for (let row = 0; row < 3; row++) for (let z = z0 + 4 + row * 2; z < 200; z += 4 + rnd() * 3) { const x = s * (half + 3.5 + row * 5 + rnd() * 4); conifer(w, x, z, 0.9 + rnd() * 0.7); }
    } else if (trees) { for (let z = 10; z < 220; z += 28) tree(w, s * (half + 6 + rnd() * 3), z, 1 + rnd() * 0.3); }
  }
});

// ---------------- Bebauung & Grün ----------------
const facadeColors = ['#efe6d2', '#e7d3bf', '#dfe3d6', '#f2efe8', '#e9dccb', '#d9e2e1', '#ecd9c6', '#e2cfc0'];
export function house(w, x, zf, len, h, dep, axis = 'x', faceSign = -1) {
  const floors = Math.max(2, Math.floor(h / 2.7)), col = facadeColors[Math.floor(rnd() * facadeColors.length)];
  const fm = S({map: T.facade(col, floors, [Math.max(1, Math.round(len / 2.6)), 1]), roughness: 0.9});
  const em = S({map: T.facade(col, floors, [Math.max(1, Math.round(dep / 2.6)), 1]), roughness: 0.9});
  const plain = S({color: col, roughness: 0.95});
  // Box: Materialreihenfolge +x, -x, +y, -y, +z, -z
  const geo = axis === 'x' ? new THREE.BoxGeometry(dep, h, len) : new THREE.BoxGeometry(len, h, dep);
  let mats;
  if (axis === 'x') mats = faceSign < 0 ? [plain, fm, plain, plain, em, plain] : [fm, plain, plain, plain, em, plain];
  else mats = faceSign < 0 ? [em, em, plain, plain, fm, plain] : [em, em, plain, plain, plain, fm];
  const b = w.add(geo, mats, x, h / 2, zf);
  const sh = new THREE.Shape(); const span = axis === 'x' ? dep : dep; sh.moveTo(-span / 2 - 0.5, 0); sh.lineTo(span / 2 + 0.5, 0); sh.lineTo(0, 3.4); sh.closePath();
  const rl = len + 0.6; const rg = new THREE.ExtrudeGeometry(sh, {depth: rl, bevelEnabled: false}); rg.translate(0, 0, -rl / 2);
  const rm = S({map: T.roof([0.25, 0.25]), roughness: 0.85});
  const roof = new THREE.Mesh(rg, [rm, rm]); roof.castShadow = roof.receiveShadow = true; roof.position.set(x, h, -zf); if (axis !== 'x') roof.rotation.y = Math.PI / 2; w.scene.add(roof);
  w.add(new THREE.BoxGeometry(0.6, 1.6, 0.6), S({color: 0x8a5a4a, roughness: 0.9}), x + (axis === 'x' ? dep * 0.2 : len * 0.25), h + 2.6, zf);
  return b;
}
function houseRow(w, s, xFront, za, zb) {
  let z = za + 1; while (z < zb - 6 && z < 250) { const len = Math.min(9 + rnd() * 5, zb - z - 1); if (len < 6) break; const h = 6 + rnd() * 2.4; house(w, s * (xFront + 4.5 + rnd() * 1.2), z + len / 2, len, h, 9, 'x', -s); z += len + 5 + rnd() * 5; }
}
export const hedge = statically(function hedge(w, x, zf, len, h = 1.0) {
  const g = new THREE.BoxGeometry(0.7, h, len, 4, 6, Math.max(4, Math.round(len * 3))); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + (rnd() - 0.5) * 0.07, p.getY(i) + (p.getY(i) > 0 ? (rnd() - 0.5) * 0.12 : 0), p.getZ(i));
  g.computeVertexNormals(); return w.add(g, MAT.hedge, x, h / 2, zf);
});
const leafGeoCache = [];
export function tree(w, x, zf, s = 1) {
  w.add(new THREE.CylinderGeometry(0.11 * s, 0.17 * s, 3.3 * s, 7), MAT.trunk, x, 0.13 + 1.65 * s, zf);
  let sd = Math.floor(Math.abs(zf * 97 + x * 13)) + 5; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  if (!leafGeoCache.length) for (let k = 0; k < 4; k++) { const g = new THREE.IcosahedronGeometry(1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + Math.sin(p.getX(i) * 7 + k) * Math.cos(p.getY(i) * 5) * 0.12 + Math.sin(p.getZ(i) * 11 + p.getX(i) * 3 + k) * 0.05; p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.85, p.getZ(i) * f); } g.computeVertexNormals(); leafGeoCache.push(g); }
  for (let i = 0; i < 12; i++) { const a = rr() * 6.283, rad = rr() * 1.6, r = (0.7 + rr() * 0.6) * s; const m = w.add(leafGeoCache[i % 4], MAT.leaves[Math.floor(rr() * 5)], x + Math.cos(a) * rad * s, (3.1 + rr() * 2.4) * s, zf + Math.sin(a) * rad * 0.7 * s); m.scale.setScalar(r); m.rotation.y = rr() * 6; }
}
export function conifer(w, x, zf, s = 1) {
  w.add(new THREE.CylinderGeometry(0.1 * s, 0.16 * s, 2 * s, 6), MAT.trunk, x, s, zf);
  const m = S({color: [0x2f5130, 0x355a33, 0x2a4a2c][Math.floor(rnd() * 3)], roughness: 1, flatShading: true});
  for (let k = 0; k < 3; k++) w.add(new THREE.ConeGeometry((1.7 - k * 0.42) * s, (2.6 - k * 0.3) * s, 7), m, x, (2.2 + k * 1.5) * s, zf);
}
export function lamp(w, x, zf, s) {
  w.add(new THREE.CylinderGeometry(0.05, 0.07, 5.2, 8), MAT.pole, x, 2.73, zf);
  const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-s * 0.3, 0.35, 0), new THREE.Vector3(-s * 1.0, 0.4, 0)]);
  w.add(new THREE.TubeGeometry(c, 10, 0.04, 6), MAT.pole, x, 5.3, zf); w.add(new THREE.BoxGeometry(0.5, 0.1, 0.25), MAT.pole, x - s * 1.0, 5.65, zf);
}
// Schild an Pfosten. face: Blickrichtung des Schildes (+1 = zur Kamera).
export function signPost(w, x, zf, tex, {sw = 0.66, sh = 0.82, top = 3.0, pole = true, rotY = 0} = {}) {
  if (pole) w.add(new THREE.CylinderGeometry(0.035, 0.035, top + 0.1, 8), MAT.pole, x, (top + 0.1) / 2 + 0.05, zf + 0.03);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), S({map: tex, roughness: 0.5, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}));
  m.position.set(x, top, -zf); m.rotation.y = rotY; m.castShadow = true; w.scene.add(m); return m;
}
export const SIGNS = {
  zone30: () => T.sign('zone30', (g, w, h) => { g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.beginPath(); g.arc(128, 135, 88, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 22; g.strokeStyle = '#c8202a'; g.stroke(); g.fillStyle = '#111'; g.font = 'bold 96px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('30', 128, 140); g.font = 'bold 52px Arial'; g.fillText('ZONE', 128, 275); }, 256, 320),
  stop: () => T.sign('stop', (g, w, h) => { g.clearRect(0, 0, w, h); const oct = (r, c) => { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(128 + r * Math.cos(a), 128 + r * Math.sin(a)); } g.closePath(); g.fill(); }; oct(124, '#fff'); oct(112, '#c8202a'); g.fillStyle = '#fff'; g.font = 'bold 70px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 128, 132); }),
  bus: () => T.sign('bus', (g, w, h) => { g.clearRect(0, 0, w, h); g.beginPath(); g.arc(128, 128, 122, 0, 7); g.fillStyle = '#f2c500'; g.fill(); g.lineWidth = 16; g.strokeStyle = '#1d8a3a'; g.stroke(); g.fillStyle = '#1d8a3a'; g.font = 'bold 150px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', 128, 136); }),
  cross: () => T.sign('cross', (g, w, h) => { g.clearRect(0, 0, w, h); g.save(); g.translate(128, 128); for (const a of [Math.PI / 4, -Math.PI / 4]) { g.save(); g.rotate(a); g.fillStyle = '#c8202a'; g.fillRect(-124, -20, 248, 40); g.fillStyle = '#fff'; for (let i = -3; i <= 3; i += 2) g.fillRect(i * 31 - 15, -16, 30, 32); g.restore(); } g.restore(); }),
  giveWay: () => T.sign('giveway', (g, w, h) => { g.clearRect(0, 0, w, h); g.beginPath(); g.moveTo(10, 20); g.lineTo(246, 20); g.lineTo(128, 236); g.closePath(); g.fillStyle = '#c8202a'; g.fill(); g.beginPath(); g.moveTo(44, 40); g.lineTo(212, 40); g.lineTo(128, 194); g.closePath(); g.fillStyle = '#fff'; g.fill(); }),
};
// Ampel mit drei Leuchten; state(t) -> 'red' | 'yellow' | 'green'
export function trafficLight(w, x, zf, state, {top = 3.2} = {}) {
  w.add(new THREE.CylinderGeometry(0.06, 0.06, top + 0.6, 8), MAT.pole, x, (top + 0.6) / 2, zf + 0.15);
  w.add(new THREE.BoxGeometry(0.34, 0.95, 0.25), MAT.dark, x, top, zf);
  const lamps = ['red', 'yellow', 'green'].map((c, i) => { const col = {red: 0xff2a1a, yellow: 0xffb000, green: 0x22e06a}[c]; const on = MAT.lamp(col, true), off = S({color: 0x2a2c2c, roughness: 0.4}); const m = w.add(new THREE.CircleGeometry(0.1, 20), off, x, top + 0.3 - i * 0.3, zf - 0.13, false); return {c, m, on, off}; });
  w.onUpdate(t => { const s = state(t); for (const l of lamps) l.m.material = l.c === s ? l.on : l.off; });
}
export const cones = statically(function cones(w, x0, z0, z1, step = 2.5) {
  const cm = S({color: 0xff5a1f, roughness: 0.6}), wm = S({color: 0xf4f4f0, roughness: 0.5});
  for (let z = z0; z <= z1; z += step) { w.add(new THREE.ConeGeometry(0.17, 0.55, 14), cm, x0, 0.3, z); w.add(new THREE.CylinderGeometry(0.115, 0.135, 0.09, 14), wm, x0, 0.33, z, false); w.add(new THREE.BoxGeometry(0.4, 0.04, 0.4), MAT.dark, x0, 0.02, z); }
});
export function puddle(w, x, zf, rx, rz) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({color: 0x2c3439, roughness: 0.1, metalness: 0.45, envMapIntensity: 0.4, polygonOffset: true, polygonOffsetFactor: -3}));
  m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); m.position.set(x, 0.006, -zf); m.receiveShadow = true; w.scene.add(m); return m;
}
export function rain(w, n = 2200) {
  const pos = new Float32Array(n * 6); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const seeds = Array.from({length: n}, () => [rnd() * 16 - 8, rnd() * 9, rnd() * 30 + 1]);
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({color: 0xcfd8de, transparent: true, opacity: 0.45})); lines.frustumCulled = false; w.scene.add(lines);
  w.onUpdate(t => { const c = w.camera.position; for (let i = 0; i < n; i++) { const [x, y0, z] = seeds[i]; const y = ((y0 - t * 9) % 9 + 9) % 9; pos.set([c.x + x, y, c.z - z, c.x + x - 0.02, y + 0.35, c.z - z], i * 6); } geo.attributes.position.needsUpdate = true; });
}

// ---------------- Fahrzeuge ----------------
// Gemeinsame Lichtsteuerung: brake, left, right, hazard, reverse, head, blue
function lightsFor(w, grp, parts) {
  const st = {brake: false, left: false, right: false, hazard: false, reverse: false, head: false, blue: false};
  grp.userData.lights = st;
  w.onUpdate(t => {
    const blink = Math.floor(t * 2.6) % 2 === 0, fast = Math.floor(t * 6) % 2 === 0;
    for (const p of parts) {
      let on = false;
      if (p.k === 'tail') on = st.brake; if (p.k === 'left') on = (st.left || st.hazard) && blink; if (p.k === 'right') on = (st.right || st.hazard) && blink;
      if (p.k === 'reverse') on = st.reverse; if (p.k === 'head') on = st.head; if (p.k === 'blue') on = st.blue && (p.alt ? fast : !fast);
      p.m.material = on ? p.on : p.off;
    }
  });
  return st;
}
function lightPart(grp, parts, k, color, offColor, size, pos, alt = false) {
  const on = MAT.lamp(color, true), off = S({color: offColor, roughness: 0.35, emissive: k === 'tail' ? 0x3a0204 : 0, emissiveIntensity: 1});
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), off); m.position.set(...pos); m.userData.dynamic = true; grp.add(m); parts.push({k, m, on, off, alt}); return m;
}
// Fahrzeugteile mit gleichem Material zu einem Mesh zusammenfassen (Lichter und Türen bleiben einzeln).
function compact(grp) {
  const groups = new Map(); const keep = new Set(['position', 'normal', 'uv']);
  for (const m of [...grp.children]) {
    if (!m.isMesh || m.userData.dynamic || Array.isArray(m.material)) continue;
    m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    if (!g.attributes.uv || !g.attributes.normal) continue;
    for (const k of Object.keys(g.attributes)) if (!keep.has(k)) g.deleteAttribute(k);
    g.clearGroups(); g.applyMatrix4(m.matrix);
    if (!groups.has(m.material)) groups.set(m.material, []); groups.get(m.material).push(g); grp.remove(m);
  }
  for (const [mat, list] of groups) { const o = new THREE.Mesh(mergeGeometries(list, false), mat); o.castShadow = o.receiveShadow = true; grp.add(o); }
  return grp;
}
function wheels(grp, xs, zs, r = 0.33, wdt = 0.24) {
  for (const sx of xs) for (const wz of zs) { const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, wdt, 22), MAT.tire); t.rotation.z = Math.PI / 2; t.position.set(sx, r, wz); t.castShadow = true; grp.add(t); const rm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, wdt + 0.01, 14), MAT.rim); rm.rotation.z = Math.PI / 2; rm.position.copy(t.position); grp.add(rm); }
}
// Auto. Lokal: Heck bei z=0, Front bei z=-4.35 (fährt Richtung -z).
export function car(w, color, {door = false} = {}) {
  const grp = new THREE.Group(); const p = paint(color); const parts = [];
  const sh = new THREE.Shape(); sh.moveTo(0, 0.32); sh.lineTo(0, 0.72); sh.quadraticCurveTo(0.02, 0.95, 0.25, 0.98); sh.lineTo(1.05, 1.0); sh.lineTo(3.2, 1.0); sh.quadraticCurveTo(3.8, 0.95, 4.2, 0.82); sh.quadraticCurveTo(4.35, 0.75, 4.33, 0.5); sh.lineTo(4.3, 0.32); sh.lineTo(3.85, 0.32); sh.absarc(3.42, 0.32, 0.42, 0, Math.PI, false); sh.lineTo(1.28, 0.32); sh.absarc(0.86, 0.32, 0.42, 0, Math.PI, false); sh.closePath();
  const body = new THREE.ExtrudeGeometry(sh, {depth: 1.62, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 12}); body.translate(0, 0, -0.81); body.rotateY(Math.PI / 2);
  const bm = new THREE.Mesh(body, p); bm.castShadow = bm.receiveShadow = true; grp.add(bm);
  const cab = new THREE.Shape(); cab.moveTo(0.95, 1.0); cab.quadraticCurveTo(1.25, 1.36, 1.6, 1.42); cab.lineTo(2.55, 1.44); cab.quadraticCurveTo(2.9, 1.36, 3.25, 1.0); cab.closePath();
  const cg = new THREE.ExtrudeGeometry(cab, {depth: 1.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2}); cg.translate(0, 0, -0.71); cg.rotateY(Math.PI / 2);
  const cm = new THREE.Mesh(cg, MAT.glass); cm.castShadow = true; grp.add(cm);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.05, 0.95), p); roof.position.set(0, 1.46, -2.07); roof.castShadow = true; grp.add(roof);
  const pil = (a, b, wd) => { const v = new THREE.Vector3().subVectors(b, a); const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, v.length(), wd), p); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); grp.add(m); };
  for (const sx of [-1, 1]) {
    pil(new THREE.Vector3(sx * 0.74, 1.0, -3.2), new THREE.Vector3(sx * 0.72, 1.43, -2.56), 0.09); pil(new THREE.Vector3(sx * 0.75, 1.0, -2.0), new THREE.Vector3(sx * 0.73, 1.44, -2.0), 0.12); pil(new THREE.Vector3(sx * 0.74, 1.0, -1.0), new THREE.Vector3(sx * 0.72, 1.42, -1.6), 0.16);
    lightPart(grp, parts, 'tail', 0xff2020, 0x7a0c10, [0.3, 0.11, 0.06], [sx * 0.6, 0.82, 0.04]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.12, 0.1, 0.06], [sx * 0.86, 0.82, -0.02]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a6a30, [0.1, 0.08, 0.06], [sx * 0.72, 0.72, -4.33]);
    lightPart(grp, parts, 'head', 0xfff6dd, 0xd8dcdc, [0.32, 0.1, 0.06], [sx * 0.55, 0.72, -4.36]);
    lightPart(grp, parts, 'reverse', 0xffffff, 0xd0d0d0, [0.1, 0.07, 0.06], [sx * 0.32, 0.82, 0.045]);
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), p); mir.position.set(sx * 0.9, 1.02, -2.95); grp.add(mir);
  }
  lightPart(grp, parts, 'tail', 0xff2020, 0x5a0a0c, [0.36, 0.04, 0.04], [0, 1.4, -1.0]); // dritte Bremsleuchte
  wheels(grp, [-0.78, 0.78], [-0.86, -3.42]);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.03), MAT.white); plate.position.set(0, 0.55, 0.07); grp.add(plate);
  const eu = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.031), S({color: 0x2a54a8})); eu.position.set(-0.235, 0.55, 0.075); grp.add(eu);
  const bump = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.08), MAT.dark); bump.position.set(0, 0.4, 0.05); grp.add(bump);
  const under = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 3.8), MAT.dark); under.position.set(0, 0.22, -2.15); grp.add(under);
  if (door) { // linke Vordertür als bewegliches Teil (fahrbahnseitig bei Rechtsparkern)
    const d = new THREE.Group(); d.position.set(-0.86, 0, -3.0); grp.add(d);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 1.05), p); panel.position.set(0, 0.68, 0.53); panel.castShadow = true; d.add(panel);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.85), MAT.glass); win.position.set(0, 1.18, 0.6); d.add(win);
    grp.userData.door = d;
  }
  grp.userData.lights = lightsFor(w, grp, parts); grp.userData.len = 4.35;
  compact(grp); w.scene.add(grp); return grp;
}
// Kastenwagen (Lieferwagen), Rettungswagen-Variante mit ambulance=true
export function van(w, color = 0xf1f1ee, {ambulance = false} = {}) {
  const grp = new THREE.Group(), p = paint(color), parts = [], L = 5.4;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 2.0, L - 1.1), p); body.position.set(0, 1.35, -(L - 1.1) / 2); body.castShadow = body.receiveShadow = true; grp.add(body);
  const cab = new THREE.Shape(); cab.moveTo(0, 0.35); cab.lineTo(0, 2.3); cab.lineTo(0.35, 2.3); cab.lineTo(1.1, 1.2); cab.lineTo(1.1, 0.35); cab.closePath();
  const cg = new THREE.ExtrudeGeometry(cab, {depth: 1.9, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2}); cg.translate(0, 0, -0.95); cg.rotateY(Math.PI / 2); const cm = new THREE.Mesh(cg, p); cm.position.z = -(L - 1.1); cm.castShadow = true; grp.add(cm);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.15), MAT.glass); ws.position.set(0, 1.78, -(L - 1.1) - 0.72); ws.rotation.x = -0.97; grp.add(ws);
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), MAT.glass); sw.position.set(sx * 0.99, 1.85, -(L - 0.9)); sw.rotation.y = sx * Math.PI / 2; grp.add(sw); }
  const rearDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.02), MAT.dark); rearDoor.position.set(0, 2.0, 0.01); grp.add(rearDoor);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 0.02), MAT.dark); seam.position.set(0, 1.35, 0.01); grp.add(seam);
  for (const sx of [-1, 1]) {
    lightPart(grp, parts, 'tail', 0xff2020, 0x7a0c10, [0.16, 0.34, 0.05], [sx * 0.88, 0.8, 0.02]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.16, 0.12, 0.05], [sx * 0.88, 1.06, 0.02]);
    lightPart(grp, parts, 'reverse', 0xffffff, 0xcfcfcf, [0.16, 0.1, 0.05], [sx * 0.88, 0.58, 0.02]);
    lightPart(grp, parts, 'head', 0xfff6dd, 0xd8dcdc, [0.3, 0.14, 0.05], [sx * 0.66, 0.85, -L - 0.03]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a6a30, [0.12, 0.1, 0.05], [sx * 0.9, 0.85, -L - 0.03]);
  }
  wheels(grp, [-0.86, 0.86], [-1.0, -(L - 0.9)], 0.36, 0.26);
  const bump = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.1), MAT.dark); bump.position.set(0, 0.42, 0.05); grp.add(bump);
  const under = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.25, L - 0.4), MAT.dark); under.position.set(0, 0.3, -L / 2); grp.add(under);
  if (ambulance) {
    const stripe = S({color: 0xff6a13, roughness: 0.5});
    for (const sx of [-1, 1]) { const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, L - 1.2), stripe); s1.position.set(sx * 0.985, 1.1, -(L - 1.1) / 2); grp.add(s1); }
    const sf = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.28, 0.02), stripe); sf.position.set(0, 1.1, 0.0); grp.add(sf);
    for (const sx of [-1, 1]) { const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 1.0), stripe); s2.position.set(sx * 0.96, 1.0, -(L - 0.6)); grp.add(s2); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.3), MAT.dark); bar.position.set(0, 2.42, -(L - 1.2)); grp.add(bar);
    for (const sx of [-1, 1]) { lightPart(grp, parts, 'blue', 0x2a6bff, 0x1a2a66, [0.5, 0.14, 0.3], [sx * 0.36, 2.52, -(L - 1.2)], sx > 0); lightPart(grp, parts, 'blue', 0x2a6bff, 0x1a2a66, [0.2, 0.14, 0.2], [sx * 0.8, 2.4, -0.2], sx < 0); }
    // Front-Blitzer
    for (const sx of [-1, 1]) lightPart(grp, parts, 'blue', 0x2a6bff, 0x1a2a66, [0.14, 0.08, 0.04], [sx * 0.3, 0.55, -L - 0.05], sx > 0);
  }
  grp.userData.lights = lightsFor(w, grp, parts); grp.userData.len = L;
  compact(grp); w.scene.add(grp); return grp;
}
export function bus(w, {color = 0xf4f2ea, stripe = 0x0f6d8a} = {}) {
  const grp = new THREE.Group(), p = paint(color), parts = [], L = 12;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.75, L), p); body.position.set(0, 1.7, -L / 2); body.castShadow = body.receiveShadow = true; grp.add(body);
  for (const sx of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.15, L - 1.2), MAT.glass); g.position.set(sx * 1.285, 2.25, -L / 2 - 0.3); grp.add(g); const st = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, L), S({color: stripe, roughness: 0.5})); st.position.set(sx * 1.285, 1.35, -L / 2); grp.add(st); }
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.0), MAT.glass); rw.position.set(0, 2.3, 0.01); grp.add(rw);
  const fw = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.7), MAT.glass); fw.position.set(0, 2.0, -L - 0.01); fw.rotation.y = Math.PI; grp.add(fw);
  const dest = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.28), MAT.lamp(0xffb34a, true)); dest.position.set(0, 2.88, -L - 0.012); dest.rotation.y = Math.PI; grp.add(dest);
  for (const dz of [-2.4, -7.0]) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.2, 1.2), MAT.glass); d.position.set(1.28, 1.4, dz); grp.add(d); }
  for (const sx of [-1, 1]) {
    lightPart(grp, parts, 'tail', 0xff2020, 0x7a0c10, [0.2, 0.32, 0.05], [sx * 1.1, 0.75, 0.02]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.2, 0.18, 0.05], [sx * 1.1, 1.05, 0.02]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.05, 0.12, 0.25], [sx * 1.29, 0.9, -1.5]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.05, 0.12, 0.25], [sx * 1.29, 0.9, -L + 1.2]);
    lightPart(grp, parts, 'head', 0xfff6dd, 0xd8dcdc, [0.35, 0.16, 0.05], [sx * 0.85, 0.7, -L - 0.02]);
  }
  wheels(grp, [-1.05, 1.05], [-2.6, -L + 2.4], 0.5, 0.32);
  grp.userData.lights = lightsFor(w, grp, parts); grp.userData.len = L; compact(grp); w.scene.add(grp); return grp;
}
export function truck(w, {color = 0xd9dde0, cab = 0x2b5f8c} = {}) {
  const grp = new THREE.Group(), parts = [], L = 10;
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 7.6), S({color, roughness: 0.6})); box.position.set(0, 2.25, -3.8); box.castShadow = box.receiveShadow = true; grp.add(box);
  const ribs = S({color: 0xb7bcc0, roughness: 0.6}); for (let k = 0; k < 9; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(2.52, 2.7, 0.05), ribs); r.position.set(0, 2.25, -0.4 - k * 0.85); grp.add(r); }
  const doors = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.6, 0.02), MAT.dark); doors.position.set(0, 2.25, 0.01); grp.add(doors);
  const cp = paint(cab); const c = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.3, 1.9), cp); c.position.set(0, 1.85, -8.95); c.castShadow = true; grp.add(c);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.95), MAT.glass); ws.position.set(0, 2.4, -9.91); ws.rotation.y = Math.PI; grp.add(ws);
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), MAT.glass); sw.position.set(sx * 1.23, 2.4, -9.2); sw.rotation.y = sx * Math.PI / 2; grp.add(sw); }
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, L - 0.2), MAT.dark); chassis.position.set(0, 0.7, -L / 2); grp.add(chassis);
  for (const sx of [-1, 1]) {
    lightPart(grp, parts, 'tail', 0xff2020, 0x7a0c10, [0.25, 0.14, 0.05], [sx * 0.95, 0.75, 0.05]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.2, 0.14, 0.05], [sx * 1.15, 0.75, 0.05]);
    lightPart(grp, parts, sx < 0 ? 'left' : 'right', 0xffa020, 0x8a5a20, [0.04, 0.12, 0.3], [sx * 1.26, 0.85, -5]);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 4), MAT.steel); guard.position.set(sx * 1.2, 0.55, -4.6); grp.add(guard);
  }
  const ub = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.1), MAT.steel); ub.position.set(0, 0.5, 0.0); grp.add(ub);
  wheels(grp, [-1.0, 1.0], [-1.3, -2.5, -8.6], 0.5, 0.36);
  grp.userData.lights = lightsFor(w, grp, parts); grp.userData.len = L; compact(grp); w.scene.add(grp); return grp;
}
// Platzierung: Heck bei zRear, Fahrtrichtung dir (+1 vorwärts, -1 entgegen), seitlich quer: dir 'left'/'right'
export function place(o, x, zRear, dir = 1) {
  if (dir === 1) { o.rotation.y = 0; o.position.set(x, 0, -zRear); }
  else if (dir === -1) { o.rotation.y = Math.PI; o.position.set(x, 0, -(zRear + o.userData.len)); }
  else if (dir === 'left') { o.rotation.y = Math.PI / 2; o.position.set(x, 0, -zRear); } // Front zeigt nach -x
  else if (dir === 'right') { o.rotation.y = -Math.PI / 2; o.position.set(x, 0, -zRear); } // Front zeigt nach +x
  return o;
}

// ---------------- Menschen & Tiere ----------------
const skin = [0xc79a7c, 0xe0b899, 0x8d5f45, 0xa8775a];
export function person(w, {shirt = 0x6f8fa8, pants = 0x2b3440, hair = 0x3a2c26, skinTone = 0, vest = false, tool = false, scale = 1, helmet = false} = {}) {
  const grp = new THREE.Group(); const sk = S({color: skin[skinTone], roughness: 0.7}), jk = S({color: vest ? 0xf2e600 : shirt, roughness: 0.85, emissive: vest ? 0x3a3600 : 0}), tr = S({color: pants, roughness: 0.9});
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.48, 4, 10), jk); body.position.y = 1.26; grp.add(body);
  if (vest) for (const y of [1.12, 1.32]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 14), S({color: 0xd8dde0, roughness: 0.3, metalness: 0.6})); b.position.y = y; grp.add(b); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), sk); head.position.y = 1.72; grp.add(head);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(0.126, 16, 8, 0, 6.3, 0, 1.4), S({color: helmet ? 0xffffff : hair, roughness: 0.8})); hr.position.y = 1.74; grp.add(hr);
  const legs = [], arms = [];
  for (const sx of [-0.09, 0.09]) {
    const hip = new THREE.Group(); hip.position.set(sx, 0.92, 0); grp.add(hip); const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.72, 4, 8), tr); l.position.y = -0.45; hip.add(l); legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(sx * 2.5, 1.5, 0); grp.add(sh); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8), jk); a.position.y = -0.3; sh.add(a); arms.push(sh);
  }
  if (tool) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8), S({color: 0x8a6a3a, roughness: 0.8})); bar.rotation.z = Math.PI / 2 - 0.25; bar.position.set(0.0, 1.05, -0.25); grp.add(bar); grp.userData.tool = bar; }
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
  grp.scale.setScalar(scale);
  grp.userData.walk = (phase, amount = 1) => { const s = Math.sin(phase) * 0.45 * amount; legs[0].rotation.x = s; legs[1].rotation.x = -s; arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8; };
  w.scene.add(grp); return grp;
}
export function cyclist(w, {shirt = 0xd2553a} = {}) {
  const grp = new THREE.Group(); const fm = S({color: 0x1f6f78, roughness: 0.4, metalness: 0.5});
  for (const z of [0.55, -0.55]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 28), MAT.tire); wh.rotation.y = Math.PI / 2; wh.position.set(0, 0.36, z); grp.add(wh); }
  const bar = (a, b, r = 0.022) => { const v = new THREE.Vector3().subVectors(b, a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 6), fm); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); grp.add(m); };
  const V = (y, z) => new THREE.Vector3(0, y, z);
  bar(V(0.36, 0.55), V(0.42, 0.0)); bar(V(0.42, 0.0), V(0.85, 0.12)); bar(V(0.85, 0.12), V(0.88, -0.4)); bar(V(0.42, 0.0), V(0.88, -0.4)); bar(V(0.88, -0.4), V(0.36, -0.55)); bar(V(0.88, -0.4), V(1.02, -0.45));
  const rider = person(w, {shirt, helmet: true}); w.scene.remove(rider); rider.position.set(0, 0.05, 0.12); rider.rotation.x = -0.25; grp.add(rider);
  rider.children.forEach(c => { if (c.isGroup && Math.abs(c.position.y - 1.5) < 0.01) c.rotation.x = -1.1; });
  grp.userData.pedal = ph => { const legs = rider.children.filter(c => c.isGroup && Math.abs(c.position.y - 0.92) < 0.01); legs[0].rotation.x = -0.9 + Math.sin(ph) * 0.5; legs[1].rotation.x = -0.9 - Math.sin(ph) * 0.5; };
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); w.scene.add(grp); return grp;
}
export function motorbike(w, {color = 0x1d2a33} = {}) {
  const grp = new THREE.Group(); const p = paint(color); const parts = [];
  for (const z of [0.7, -0.7]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 10, 24), MAT.tire); wh.rotation.y = Math.PI / 2; wh.position.set(0, 0.36, z); grp.add(wh); }
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.35, 1.0), p); tank.position.set(0, 0.8, -0.1); grp.add(tank);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.6), MAT.dark); seat.position.set(0, 0.95, 0.4); grp.add(seat);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), MAT.steel); fork.position.set(0, 0.75, -0.65); fork.rotation.x = 0.35; grp.add(fork);
  lightPart(grp, parts, 'head', 0xfff6dd, 0xd8dcdc, [0.2, 0.16, 0.08], [0, 1.0, -0.92]);
  const rider = person(w, {shirt: 0x2a2f36, pants: 0x1c2026, helmet: true}); w.scene.remove(rider); rider.position.set(0, 0.25, 0.25); rider.rotation.x = -0.3; grp.add(rider);
  const hl = rider.children.find(c => c.isMesh && c.geometry.type === 'SphereGeometry' && c.position.y > 1.73); if (hl) hl.material = S({color: 0xd2d6da, roughness: 0.25, metalness: 0.4});
  rider.children.forEach(c => { if (c.isGroup && Math.abs(c.position.y - 1.5) < 0.01) c.rotation.x = -1.0; if (c.isGroup && Math.abs(c.position.y - 0.92) < 0.01) c.rotation.x = -1.2; });
  grp.userData.lights = lightsFor(w, grp, parts); grp.userData.lights.head = true;
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); w.scene.add(grp); return grp;
}
function quadruped(w, {len, h, color, neck, head, legLen, mane = null, bodyR = 0.22}) {
  const grp = new THREE.Group(); const m = S({color, roughness: 0.85});
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(h * bodyR, len * 0.6, 6, 12), m); body.rotation.x = Math.PI / 2; body.position.set(0, legLen + h * 0.2, 0); grp.add(body);
  const nk = new THREE.Group(); nk.position.set(0, legLen + h * 0.32, -len * 0.42); grp.add(nk);
  const n = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.09, neck, 4, 8), m); n.position.set(0, neck * 0.45, -neck * 0.2); n.rotation.x = -0.45; nk.add(n);
  const hd = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.08, head, 4, 8), m); hd.position.set(0, neck * 0.85, -neck * 0.45 - head * 0.3); hd.rotation.x = -1.2; nk.add(hd);
  if (mane) { const mn = new THREE.Mesh(new THREE.BoxGeometry(0.06, neck * 0.9, 0.12), S({color: mane, roughness: 1})); mn.position.set(0, neck * 0.5, -neck * 0.05); mn.rotation.x = -0.45; nk.add(mn); }
  const ears = []; for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035 * (h / 0.9), 0.14 * (h / 0.9), 6), m); e.position.set(sx * 0.06 * (h / 0.9), neck * 0.85 + 0.12, -neck * 0.38); nk.add(e); ears.push(e); }
  const legs = []; for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const hip = new THREE.Group(); hip.position.set(sx * h * 0.14, legLen, sz * len * 0.36); grp.add(hip); const l = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.045, h * 0.03, legLen, 6), m); l.position.y = -legLen / 2; hip.add(l); legs.push(hip); }
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, h * 0.3, 4, 6), S({color: mane ?? color, roughness: 1})); tail.position.set(0, legLen + h * 0.2, len * 0.55); tail.rotation.x = 0.4; grp.add(tail);
  grp.userData.walk = (ph, a = 1) => legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.35 * a; });
  grp.userData.neck = nk;
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); w.scene.add(grp); return grp;
}
export const deer = w => quadruped(w, {len: 1.15, h: 1.15, color: 0x8a5a34, neck: 0.38, head: 0.24, legLen: 0.62});
export const horse = w => quadruped(w, {len: 2.3, h: 1.9, color: 0x5b3a26, neck: 0.62, head: 0.5, legLen: 0.95, mane: 0x241812, bodyR: 0.17});
// Bahnübergang: Gleise quer bei zc, Andreaskreuz + Blinklicht rechts/links, Schranke rechts
export function railway(w, {zc, lightOn}) {
  for (const dz of [-0.75, 0.75]) w.add(new THREE.BoxGeometry(40, 0.08, 0.08), MAT.steel, 0, 0.04, zc + dz, false);
  w.add(new THREE.BoxGeometry(40, 0.03, 3.2), S({color: 0x6f6a62, roughness: 1}), 0, 0.012, zc, false);
  for (let x = -20; x < 20; x += 0.65) w.add(new THREE.BoxGeometry(0.25, 0.05, 2.6), S({color: 0x6b5644, roughness: 1}), x, 0.02, zc, false);
  for (const s of [-1, 1]) {
    const x = s * (s > 0 ? 3.9 : 4.3), z = s > 0 ? zc - 4.5 : zc + 4.5;
    signPost(w, x, z, SIGNS.cross(), {sw: 1.1, sh: 1.1, top: 2.9});
    w.add(new THREE.BoxGeometry(0.62, 0.32, 0.12), MAT.dark, x, 2.25, z - 0.02, false);
    const red = w.add(new THREE.CircleGeometry(0.11, 18), S({color: 0x2a1010}), x, 2.25, z - 0.09, false);
    const on = MAT.lamp(0xff2a1a, true), off = S({color: 0x3a1414, roughness: 0.3});
    w.onUpdate(t => { red.material = lightOn(t) ? on : off; });
    if (s > 0) { // offene Schranke (senkrecht)
      w.add(new THREE.BoxGeometry(0.3, 1.0, 0.3), MAT.white, x + 1.0, 0.5, z, true);
      const arm = new THREE.Group(); arm.position.set(x + 1.0, 1.0, -z); w.scene.add(arm);
      for (let k = 0; k < 6; k++) { const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.08), k % 2 ? S({color: 0xd01f26}) : MAT.white); seg.position.set(0, 0.3 + k * 0.55, 0); seg.castShadow = true; arm.add(seg); }
      arm.rotation.z = 0.12;
    }
  }
}
