// Die 25 Gefahrenradar-Szenen als 3D-Aufbau. Inhalte entsprechen dist/konzept/lernwelt/gefahrenradar/scenes.mjs.
// T0 = Zeitpunkt (s) im Video, ab dem die Gefahr erkennbar ist. Vor T0 passiert nichts Auffälliges.
// Die Kamera fährt ruhig und hält rechtzeitig, damit die Szene nie „durch“ die Gefahr fährt.
import * as K from './kit.js';
const {THREE, smooth} = K;
const wp = (o, dy = 0) => { const v = o.getWorldPosition(new THREE.Vector3()); v.y += dy; return v; };
const lerp = (a, b, u) => a + (b - a) * u;
const at = (x, y, zf) => new THREE.Vector3(x, y, -zf);
// Ruhiges Fahrprofil: konstant v, ab brake sanft bis vEnd (bei stop).
const profile = (v, brake, stop, vEnd = 0) => [[0, v], [brake, v], [stop, vEnd]];
const sideGap = (zc, half = 3) => [[zc - half, zc + half]];
// Bewegtes Fahrzeug entlang einer Achse (Front voraus): pos(t) liefert Heckposition.
function moveAlong(w, o, f) { w.onUpdate(t => { const [x, zf, rot] = f(t); o.position.set(x, 0, -zf); if (rot !== undefined) o.rotation.y = rot; }); }
const town = (w, extra = {}) => K.townStreet(w, extra);
// Gegenverkehr: mehrere Fahrzeuge mit Scheinwerfern; Gefahr ist jeweils das vorderste, das noch vor uns ist.
function oncoming(w, d, list, v) {
  const cars = list.map(([color, z0, t0]) => { const c = K.car(w, color); c.userData.lights.head = true; moveAlong(w, c, t => [-1.6, z0 - v * Math.max(0, t - t0), Math.PI]); return c; });
  return t => { const ahead = cars.filter(c => -c.position.z - 4.4 > d.zAt(t) + 3).sort((a, b) => b.position.z - a.position.z); return ahead.length ? [{pos: wp(ahead[0], 0.8).add(new THREE.Vector3(0, 0, 2.2)), r: 2.0}] : null; };
}

export const SCENES = {
  ball: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.1, speeds: profile(8.3, T0 + 0.5, T0 + 3.2)});
      const zB = d.zAt(T0) + 19.5;
      town(w);
      K.signPost(w, 4.6, 14, K.SIGNS.zone30(), {sw: 0.62, sh: 0.78, top: 2.6});
      for (const [z, c] of [[zB - 22, 0x3d6f86], [zB - 15.6, 0x567a8c], [zB - 5.65, 0x9aa7a6], [zB + 1.3, 0xb8462f], [zB + 28, 0xd9d4c8], [zB + 52, 0x2f3b45]]) K.place(K.car(w, c), -2.15, z);
      for (const [z, c] of [[zB + 40, 0x6c8f6a], [zB + 95, 0xc7b48e]]) K.place(K.car(w, c), 2.2, z);
      const ball = w.add(new THREE.SphereGeometry(0.2, 28, 16), new THREE.MeshStandardMaterial({color: 0xf07a22, roughness: 0.45}), -1.95, 0.2, zB);
      ball.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28), new THREE.MeshStandardMaterial({color: 0xfff3dc, roughness: 0.5})));
      const ped = K.person(w, {shirt: 0x8a6fa8}); ped.rotation.y = Math.PI;
      w.onUpdate(t => {
        const bt = Math.max(0, t - T0); ball.visible = t >= T0 - 0.05;
        const bx = -1.95 + 3.3 * (1 - Math.exp(-bt / 2.2)); ball.position.set(bx, 0.2 + Math.abs(Math.sin(bt * 5)) * 0.07 * Math.exp(-bt * 0.7), -zB); ball.rotation.z = -(bx + 1.95) / 0.2;
        ped.position.set(3.95, 0.13, -(zB + 30 - 1.2 * t)); ped.userData.walk(t * 5.5);
      });
      w.hazards.push(t => t >= T0 ? [{pos: wp(ball), r: 0.7}] : null);
    },
  },
  door: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 0.55, speeds: profile(8.3, T0 + 0.6, T0 + 3.4)});
      const zC = d.zAt(T0) + 20;
      town(w, {width: 8.5});
      for (const [z, c] of [[zC - 20, 0x8a99a3], [zC - 12.5, 0xd8d3c5], [zC + 6.5, 0x51606b], [zC + 14, 0x9b3b2f], [zC + 34, 0xcbc5b8]]) K.place(K.car(w, c), 3.1, z);
      const car = K.car(w, 0x2f9ea0, {door: true}); K.place(car, 3.1, zC);
      const driver = K.person(w, {shirt: 0x34586d}); w.scene.remove(driver); driver.scale.setScalar(0.85); driver.position.set(-0.38, -0.3, -2.55); car.add(driver);
      K.place(K.car(w, 0xe0e0dc), -2.2, 120, -1);
      w.onUpdate(t => { car.userData.door.rotation.y = -smooth(T0, T0 + 1.6, t) * 1.0; });
      w.hazards.push(t => t >= T0 ? [{pos: wp(car.userData.door, 0.8), r: 1.1}] : null);
    },
  },
  cycle: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 0.95, speeds: [[0, 6.5], [T0 + 0.3, 6.0], [T0 + 3.6, 1.2], [9, 0]]});
      w.cockpit.blink = 'right';
      const zc = d.zAt(T0) + 22;
      town(w, {width: 8.0, gaps: {left: [], right: sideGap(zc)}});
      K.sideRoad(w, {zc, sides: 'right', mainHalf: 4.0});
      const lane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 260), new THREE.MeshStandardMaterial({color: 0xa4544a, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1})); lane.rotation.x = -Math.PI / 2; lane.position.set(3.3, 0.004, -120); lane.receiveShadow = true; w.scene.add(lane);
      w.add(new THREE.BoxGeometry(0.12, 0.005, 260), K.MAT.line, 2.55, 0.003, 120, false);
      const bike = K.cyclist(w, {shirt: 0xd2553a});
      const z0 = d.zAt(T0) + 3.5;
      w.onUpdate(t => { const bt = t - T0; bike.position.set(3.3, 0.005, -(z0 + (bt < 0 ? 8.3 * bt : 5.4 * bt))); bike.userData.pedal(t * 6); bike.visible = true; });
      K.place(K.car(w, 0x7c8a94), -2.2, zc + 30, -1);
      w.hazards.push(t => t >= T0 ? [{pos: wp(bike, 1.0), r: 1.2}] : null);
    },
  },
  junction: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 7.5], [T0 + 0.6, 7.0], [T0 + 3.8, 0.8], [10, 0]]});
      const zc = d.zAt(T0) + 26;
      town(w, {gaps: {left: sideGap(zc), right: sideGap(zc)}, centerLine: false});
      K.sideRoad(w, {zc, sides: 'both'});
      K.hedge(w, 6.4, zc - 9.5, 12, 1.25); K.hedge(w, 11.5, zc - 6.0, 10, 1.25).rotation.y = Math.PI / 2;
      const blue = K.car(w, 0x2f5ea8); blue.userData.lights.head = true;
      moveAlong(w, blue, t => [lerp(19, 8.0, smooth(T0 - 1.0, T0 + 5, t)), zc + 1.5, Math.PI / 2]);
      w.hazards.push(t => t >= T0 ? [{pos: wp(blue, 0.8).add(new THREE.Vector3(-2, 0, 0)), r: 2.2}] : null);
    },
  },
  crossing: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(8.3, T0 + 0.6, T0 + 3.6)});
      const zc = d.zAt(T0) + 22;
      town(w, {centerLine: false});
      for (let x = -2.9; x < 3.3; x += 1.0) w.add(new THREE.BoxGeometry(0.5, 0.004, 4), K.MAT.line, x, 0.003, zc, false);
      const sign = K.T.sign('zebra', (g, W, H) => { g.fillStyle = '#1f5fbf'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 20); g.lineTo(236, 226); g.lineTo(20, 226); g.closePath(); g.fill(); g.fillStyle = '#111'; g.fillRect(70, 196, 116, 14); g.beginPath(); g.arc(132, 95, 14, 0, 7); g.fill(); g.fillRect(124, 110, 16, 52); g.fillRect(112, 160, 10, 36); g.fillRect(142, 160, 10, 36); });
      K.signPost(w, 4.9, zc - 6.5, sign, {sw: 0.7, sh: 0.7, top: 2.7}); K.signPost(w, -4.5, zc + 3, sign, {sw: 0.7, sh: 0.7, top: 2.7, rotY: 0});
      const p = K.person(w, {shirt: 0xb85c38, pants: 0x3b4252});
      w.onUpdate(t => { const u = smooth(T0 - 0.4, T0 + 2.2, t); p.position.set(lerp(5.2, 3.6, u), 0.13, -lerp(zc - 4, zc - 0.6, u)); p.rotation.y = lerp(0.3, Math.PI / 2, smooth(T0 + 1.6, T0 + 2.6, t)); p.userData.walk(t * 5.5, 1 - smooth(T0 + 2.2, T0 + 2.6, t)); });
      K.place(K.car(w, 0xa0b2ad), -2.2, zc + 45, -1);
      w.hazards.push(t => t >= T0 ? [{pos: wp(p, 1.0), r: 1.0}] : null);
    },
  },
  braking: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 8.3], [T0 + 0.4, 8.3], [T0 + 3.0, 0]]});
      town(w);
      const lead = K.car(w, 0x2f5ea8);
      const lz0 = 13;
      const zl = []; { let z = lz0; for (let t = 0; t <= 14; t += 0.01) { zl.push(z); const v = t < T0 ? 8.3 : Math.max(0, 8.3 - 3.6 * (t - T0)); z += v * 0.01; } }
      moveAlong(w, lead, t => [1.6, zl[Math.min(zl.length - 1, Math.round(t * 100))]]);
      w.onUpdate(t => { lead.userData.lights.brake = t >= T0; });
      const qz = lz0 + 8.3 * T0 + 8.3 * 8.3 / 7.2 + 12;
      for (const [z, c] of [[qz, 0x777f86], [qz + 6, 0xd6d1c3], [qz + 12, 0x6c3a2e]]) { const c2 = K.car(w, c); K.place(c2, 1.6, z); c2.userData.lights.brake = true; }
      for (const [z, c] of [[20, 0x3d6f86], [48, 0x9aa7a6], [70, 0xb8462f]]) K.place(K.car(w, c), -2.2, z);
      w.hazards.push(t => t >= T0 ? [{pos: wp(lead, 0.8).add(new THREE.Vector3(0, 0, 0.3)), r: 1.6}] : null);
    },
  },
  obstacle: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(8.3, T0 + 0.5, T0 + 3.4)});
      town(w);
      const zv = d.zAt(T0) + 23;
      const v = K.van(w, 0xf1f1ee); K.place(v, 1.75, zv); v.userData.lights.hazard = true;
      const stream = oncoming(w, d, [[0xf3f3f0, zv + 40, T0 - 0.8], [0x6c7a86, zv + 70, T0 - 0.8]], 6.0);
      K.place(K.car(w, 0x9aa7a6), 2.2, zv + 18); // parkt hinter dem Transporter, wird nie erreicht
      w.hazards.push(t => t >= T0 ? stream(t) : null);
    },
  },
  'bus-warning': {
    build(w) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 5.0], [2.5, 3.0], [8, 1.6], [10.5, 0.4]]});
      const zb = 30;
      town(w, {gaps: {left: [], right: [[zb - 9, zb + 15]]}, houseGaps: {left: [], right: []}});
      w.add(new THREE.BoxGeometry(3.0, 0.02, 24), K.MAT.road, 4.75, -0.01, zb + 3, false);
      w.add(new THREE.BoxGeometry(2.6, 0.13, 24), K.MAT.walk, 7.55, 0.065, zb + 3, false); w.add(new THREE.BoxGeometry(0.15, 0.14, 24), K.MAT.kerb, 6.2, 0.07, zb + 3, false);
      const b = K.bus(w); K.place(b, 4.7, zb); b.userData.lights.hazard = true;
      K.signPost(w, 6.7, zb + 13.5, K.SIGNS.bus(), {sw: 0.6, sh: 0.6, top: 2.6});
      const p = K.person(w, {shirt: 0x3c7a5a});
      w.onUpdate(t => { const u = smooth(0.8, 7.0, t); p.position.set(lerp(6.6, 2.9, u), u < 0.08 ? 0.13 : 0.0, -(zb + 12.7)); p.rotation.y = Math.PI / 2; p.userData.walk(t * 5, 1 - smooth(6.6, 7.4, t)); });
      w.hazards.push(() => [{pos: wp(p, 1.0), r: 1.0}, {pos: wp(b, 1.6).add(new THREE.Vector3(0, 0, -2)), r: 2.4, min: 76}]);
    },
  },
  'bus-departure': {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(8.3, T0 + 0.5, T0 + 3.4)});
      const zb = d.zAt(T0) + 28;
      town(w, {gaps: {left: [], right: [[zb - 9, zb + 15]]}, houseGaps: {left: [], right: []}});
      w.add(new THREE.BoxGeometry(3.0, 0.02, 24), K.MAT.road, 4.75, -0.01, zb + 3, false);
      w.add(new THREE.BoxGeometry(2.6, 0.13, 24), K.MAT.walk, 7.55, 0.065, zb + 3, false); w.add(new THREE.BoxGeometry(0.15, 0.14, 24), K.MAT.kerb, 6.2, 0.07, zb + 3, false);
      const b = K.bus(w); K.signPost(w, 6.7, zb + 13.5, K.SIGNS.bus(), {sw: 0.6, sh: 0.6, top: 2.6});
      w.onUpdate(t => { b.userData.lights.left = t >= T0; const u = smooth(T0 + 0.6, T0 + 7, t); b.position.set(lerp(4.7, 2.2, u), 0, -(zb + 3 * u * u)); b.rotation.y = 0.12 * Math.sin(Math.PI * u) ; });
      w.hazards.push(t => t >= T0 ? [{pos: wp(b, 1.6).add(new THREE.Vector3(-0.8, 0, 0)), r: 2.6}] : null);
    },
  },
  railway: {
    world: {preset: 'rural'},
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(11, T0 + 0.6, T0 + 4.0)});
      w.cockpit.label = 'Landstraße';
      const zc = d.zAt(T0) + 34;
      K.ruralRoad(w, {forest: 'none', fields: true});
      K.railway(w, {zc, lightOn: t => t >= T0});
      w.add(new THREE.BoxGeometry(5.2, 0.004, 0.5), K.MAT.line, 1.6, 0.003, zc - 6, false);
      w.hazards.push(t => t >= T0 ? [{pos: at(4.3, 2.4, zc - 4.5), r: 0.9}] : null);
    },
  },
  'left-turn': {
    build(w, {T0}) {
      const d = K.drive(w, {x: 0.9, speeds: [[0, 7.0], [T0 + 0.4, 6.0], [T0 + 3.4, 0.8], [8.5, 0]]});
      w.cockpit.blink = 'left';
      const zc = d.zAt(T0) + 20;
      town(w, {gaps: {left: sideGap(zc), right: []}});
      K.sideRoad(w, {zc, sides: 'left'});
      const m = K.motorbike(w);
      moveAlong(w, m, t => [-1.6, zc + 38 - 7 * Math.max(0, t - T0 + 0.6), Math.PI]);
      const follow = oncoming(w, d, [[0xd8d3c5, zc + 75, T0 - 0.6]], 7);
      K.place(K.car(w, 0x9aa7a6), 2.2, zc + 30);
      w.hazards.push(t => { if (t < T0) return null; if (-m.position.z > d.zAt(t) + 4) return [{pos: wp(m, 1.0), r: 1.3}]; return follow(t); });
    },
  },
  'turn-pedestrian': {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 6.0], [T0 + 0.4, 5.0], [T0 + 3.2, 0.6], [8.5, 0]]});
      w.cockpit.blink = 'right';
      const zc = d.zAt(T0) + 21;
      town(w, {gaps: {left: [], right: sideGap(zc)}});
      K.sideRoad(w, {zc, sides: 'right'});
      const p = K.person(w, {shirt: 0x6a4c93, pants: 0x2b3440});
      w.onUpdate(t => { const u = smooth(T0 - 0.5, T0 + 5.5, t); p.position.set(lerp(5.2, 4.4, u), u > 0.08 && u < 0.92 ? 0 : 0.13, -lerp(zc + 4.2, zc - 4.0, u)); p.rotation.y = Math.PI - 0.25; p.userData.walk(t * 5.2, u < 1 ? 1 : 0); });
      w.hazards.push(t => t >= T0 ? [{pos: wp(p, 1.0), r: 1.0}] : null);
    },
  },
  driveway: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(8.3, T0 + 0.6, T0 + 3.6)});
      const zc = d.zAt(T0) + 30;
      town(w, {gaps: {left: [], right: []}, hedges: false});
      const wall = new THREE.MeshStandardMaterial({color: 0xb7a99a, roughness: 0.95});
      w.add(new THREE.BoxGeometry(0.35, 1.7, 14), wall, 6.1, 0.85, zc - 9.5); w.add(new THREE.BoxGeometry(0.35, 1.7, 14), wall, 6.1, 0.85, zc + 9.5);
      w.add(new THREE.BoxGeometry(6, 0.02, 4.4), new THREE.MeshStandardMaterial({color: 0x8d8a83, roughness: 0.9}), 9.2, 0.13, zc, false);
      const c = K.car(w, 0x5f6f7a); c.userData.lights.head = true;
      moveAlong(w, c, t => [lerp(11.9, 8.2, smooth(T0 - 0.3, T0 + 3.6, t)), zc - 0.9, Math.PI / 2]);
      w.hazards.push(t => t >= T0 ? [{pos: wp(c, 0.8).add(new THREE.Vector3(-3.2, 0, 0)), r: 1.8}] : null);
    },
  },
  'stop-sign': {
    build(w) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 7.0], [3, 6.0], [10.2, 0]]});
      const zc = d.zAt(11) + 11;
      town(w, {gaps: {left: sideGap(zc), right: sideGap(zc)}});
      K.sideRoad(w, {zc, sides: 'both'});
      w.add(new THREE.BoxGeometry(3.2, 0.004, 0.5), K.MAT.line, 1.62, 0.003, zc - 3.6, false);
      K.signPost(w, 3.8, zc - 4.2, K.SIGNS.stop(), {sw: 0.75, sh: 0.75, top: 2.3});
      w.hazards.push(() => [{pos: at(3.8, 2.3, zc - 4.2), r: 0.8}]);
    },
  },
  'red-light': {
    build(w) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 7.0], [3, 6.0], [10.2, 0]]});
      const zc = d.zAt(11) + 12;
      town(w, {gaps: {left: sideGap(zc, 4), right: sideGap(zc, 4)}});
      K.sideRoad(w, {zc, width: 8, sides: 'both', centerLine: true});
      w.add(new THREE.BoxGeometry(3.2, 0.004, 0.5), K.MAT.line, 1.62, 0.003, zc - 4.6, false);
      K.trafficLight(w, 3.9, zc - 5.2, () => 'red'); K.trafficLight(w, -3.9, zc + 5.2, () => 'red');
      w.hazards.push(() => [{pos: at(3.9, 3.2, zc - 5.2), r: 0.9}]);
    },
  },
  'blocked-junction': {
    build(w) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 6.0], [3, 4.5], [10.2, 0]]});
      const zc = d.zAt(11) + 13;
      town(w, {gaps: {left: sideGap(zc, 4), right: sideGap(zc, 4)}});
      K.sideRoad(w, {zc, width: 8, sides: 'both', centerLine: true});
      w.add(new THREE.BoxGeometry(3.2, 0.004, 0.5), K.MAT.line, 1.62, 0.003, zc - 4.6, false);
      K.trafficLight(w, 3.9, zc - 5.2, () => 'green');
      const cols = [0x8a99a3, 0xd8d3c5, 0x51606b, 0x9b3b2f, 0xcbc5b8, 0x3d6f86];
      for (let i = 0; i < 6; i++) { const c = K.car(w, cols[i]); K.place(c, 1.6 + (i % 2 ? 0.25 : -0.2), zc + 4.3 + i * 5.6); c.userData.lights.brake = true; }
      w.hazards.push(() => [{pos: at(1.6, 0.9, zc + 6.2), r: 2.2}]);
    },
  },
  roadworks: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 0.9, speeds: profile(8.3, T0 + 0.6, T0 + 3.8)});
      const zw = d.zAt(T0) + 20;
      town(w, {width: 8.5});
      K.cones(w, 2.4, zw - 14, zw + 14, 2.4);
      const bake = new THREE.MeshStandardMaterial({color: 0xd01f26, roughness: 0.6});
      w.add(new THREE.BoxGeometry(1.6, 0.25, 0.06), bake, 3.4, 0.9, zw - 15.5); w.add(new THREE.BoxGeometry(0.06, 0.9, 0.06), K.MAT.pole, 2.7, 0.45, zw - 15.5); w.add(new THREE.BoxGeometry(0.06, 0.9, 0.06), K.MAT.pole, 4.1, 0.45, zw - 15.5);
      const sign = K.T.sign('works', (g, W, H) => { g.clearRect(0, 0, W, H); g.beginPath(); g.moveTo(128, 12); g.lineTo(246, 230); g.lineTo(10, 230); g.closePath(); g.fillStyle = '#c8202a'; g.fill(); g.beginPath(); g.moveTo(128, 50); g.lineTo(210, 206); g.lineTo(46, 206); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(118, 108, 12, 0, 7); g.fill(); g.fillRect(104, 122, 22, 44); g.fillRect(126, 132, 40, 8); g.fillRect(90, 170, 90, 12); });
      K.signPost(w, 3.6, zw - 19, sign, {sw: 0.8, sh: 0.8, top: 1.9});
      for (const [x, z] of [[3.6, zw - 6], [3.9, zw + 6]]) { const p = K.person(w, {vest: true, pants: 0x2d3a4a}); p.position.set(x, 0.005, -z); p.rotation.y = 1.2; }
      const wk = K.person(w, {vest: true, pants: 0x2d3a4a, tool: true});
      w.onUpdate(t => { const u = smooth(T0 - 0.3, T0 + 3.2, t); wk.position.set(lerp(3.9, 2.85, u), 0.005, -(zw + 1.6)); wk.rotation.y = 0.25; wk.userData.walk(t * 4.5, 1 - smooth(T0 + 3.0, T0 + 3.4, t)); });
      w.hazards.push(t => t >= T0 ? [{pos: wp(wk, 1.0).add(new THREE.Vector3(-0.7, 0, 0)), r: 1.4}] : null);
    },
  },
  deer: {
    world: {preset: 'rural'},
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.2, speeds: profile(13.9, T0 + 0.5, T0 + 4.2)});
      w.cockpit.label = 'Landstraße';
      const zd = d.zAt(T0) + 42;
      K.ruralRoad(w, {forest: 'both', clear: [zd - 3, zd + 3]}); // Wildwechsel: Lücke im Wald
      const r = K.deer(w);
      w.onUpdate(t => { const u = smooth(T0 - 0.4, T0 + 3.5, t); r.position.set(lerp(7.5, 3.3, u), 0, -zd); r.rotation.y = Math.PI / 2 - 0.2; r.userData.walk(t * 5, 1 - smooth(T0 + 3.3, T0 + 3.7, t)); r.userData.neck.rotation.y = smooth(T0 + 3.5, T0 + 4.5, t) * -0.9; });
      w.hazards.push(t => t >= T0 ? [{pos: wp(r, 0.9), r: 1.1}] : null);
    },
  },
  horse: {
    world: {preset: 'rural'},
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.0, speeds: [[0, 9.0], [T0 + 0.3, 8.0], [T0 + 3.6, 1.6], [12, 1.6]]});
      w.cockpit.label = 'Landstraße';
      K.ruralRoad(w, {forest: 'none', fields: true});
      const zh0 = d.zAt(T0) + 20 - 1.6 * T0;
      const h = K.horse(w); const p = K.person(w, {shirt: 0x2f6b8f, pants: 0x3a3a3a});
      w.onUpdate(t => { const z = zh0 + 1.6 * t, step = smooth(T0, T0 + 1.6, t); h.position.set(2.4 - 0.45 * step, 0, -z); h.rotation.y = 0.2 * step; h.userData.walk(t * 4.2); h.userData.neck.rotation.y = 0.5 * smooth(T0, T0 + 1.0, t) * (1 - 0.4 * smooth(T0 + 3, T0 + 5, t)); p.position.set(3.3, 0, -(z - 0.8)); p.userData.walk(t * 4.8); });
      w.hazards.push(t => t >= T0 ? [{pos: wp(h, 1.4), r: 1.6}] : null);
    },
  },
  'wet-road': {
    world: {preset: 'rain', wet: true},
    build(w) {
      const d = K.drive(w, {x: 1.2, speeds: [[0, 8.0], [3, 6.0], [10.5, 3.0]]});
      w.cockpit.label = 'Landstraße';
      K.ruralRoad(w, {forest: 'left', fields: true});
      K.rain(w);
      const zp = d.zAt(11) + 13;
      K.puddle(w, 1.4, zp, 2.2, 9);
      w.hazards.push(() => [{pos: at(1.4, 0.05, zp - 2), r: 2.4}]);
    },
  },
  fog: {
    world: {preset: 'fog'},
    build(w) {
      const d = K.drive(w, {x: 1.2, speeds: [[0, 16.0], [2.5, 14.0], [10.5, 10.0]]});
      w.cockpit.label = 'Landstraße';
      K.ruralRoad(w, {forest: 'none', fields: true});
      w.onUpdate(t => { w.scene.fog.density = lerp(0.016, 0.055, smooth(0, 9, t)); });
      w.hazards.push(t => [{pos: at(0, 1.5, d.zAt(t) + 40), r: 4, min: 76}]);
    },
  },
  'overtake-cycle': {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 5.2], [T0 + 1.0, 5.0], [T0 + 4.0, 3.8]]});
      town(w);
      const bike = K.cyclist(w, {shirt: 0x2f8f6a});
      w.onUpdate(t => { bike.position.set(2.3, 0.005, -(13 + 5.0 * t - 0.2 * Math.max(0, t - T0 - 1) ** 2)); bike.userData.pedal(t * 6); });
      const stream = oncoming(w, d, [[0xd9d4c8, d.zAt(T0) + 62, T0 - 1.2], [0x3b5f7a, d.zAt(T0) + 128, T0 - 1.2]], 7.5);
      w.hazards.push(t => t >= T0 ? stream(t) : null);
    },
  },
  reversing: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.1, speeds: profile(5.5, T0 + 0.5, T0 + 3.4)});
      const zp = d.zAt(T0) + 16;
      town(w, {gaps: {left: [], right: [[zp - 18, zp + 30]]}, houseGaps: {left: [], right: []}, hedges: false});
      w.add(new THREE.BoxGeometry(5.6, 0.02, 48), K.MAT.road, 6.05, -0.01, zp + 6, false);
      w.add(new THREE.BoxGeometry(2.5, 0.13, 48), K.MAT.walk, 10.1, 0.065, zp + 6, false);
      for (let z = zp - 17; z < zp + 30; z += 2.7) w.add(new THREE.BoxGeometry(5.2, 0.004, 0.12), K.MAT.line, 6.05, 0.003, z, false);
      const cols = [0x8a99a3, 0xd8d3c5, 0x51606b, 0x9b3b2f, 0x3d6f86, 0xcbc5b8];
      let i = 0; for (let z = zp - 15.65; z < zp + 28; z += 2.7) { if (Math.abs(z - (zp - 0.0)) < 1.5) continue; if (i % 3 !== 2) K.place(K.car(w, cols[i % cols.length]), 3.7, z, 'right'); i++; }
      const v = K.van(w, 0xf1f1ee);
      w.onUpdate(t => { const u = smooth(T0, T0 + 6, t); v.userData.lights.reverse = t >= T0; v.position.set(lerp(3.5, 2.0, u), 0, -(zp + 0.05)); v.rotation.y = -Math.PI / 2; });
      w.hazards.push(t => t >= T0 ? [{pos: wp(v, 1.1), r: 1.8}] : null);
    },
  },
  'truck-turn': {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: [[0, 7.0], [T0 + 0.6, 6.5], [T0 + 3.8, 0]]});
      const zc0 = 14 + 7 * T0 + 30;
      town(w, {gaps: {left: [], right: sideGap(zc0)}});
      K.sideRoad(w, {zc: zc0, sides: 'right'});
      const tr = K.truck(w); tr.userData.lights.right = true;
      const zt = []; { let z = 14; for (let t = 0; t <= 14; t += 0.01) { zt.push(z); const v = t < T0 ? 7 : Math.max(1.0, 7 - 2.5 * (t - T0)); z += v * 0.01; } }
      moveAlong(w, tr, t => [1.6 - 1.1 * smooth(T0, T0 + 2.5, t), zt[Math.min(zt.length - 1, Math.round(t * 100))], 0.05 * smooth(T0, T0 + 2.5, t)]);
      w.onUpdate(t => { tr.userData.lights.brake = t >= T0; });
      w.hazards.push(t => t >= T0 ? [{pos: wp(tr, 1.6).add(new THREE.Vector3(0, 0, 0.2)), r: 2.6}] : null);
    },
  },
  emergency: {
    build(w, {T0}) {
      const d = K.drive(w, {x: 1.25, speeds: profile(8.3, T0 + 0.3, T0 + 3.4)});
      const zc = d.zAt(T0) + 31;
      town(w, {gaps: {left: sideGap(zc, 4), right: sideGap(zc, 4)}});
      K.sideRoad(w, {zc, width: 8, sides: 'both', centerLine: true});
      w.add(new THREE.BoxGeometry(3.2, 0.004, 0.5), K.MAT.line, 1.62, 0.003, zc - 4.6, false);
      const a = K.van(w, 0xf6f6f3, {ambulance: true}); a.userData.lights.blue = true; a.userData.lights.head = true;
      moveAlong(w, a, t => [lerp(23, -4, Math.min(1, Math.max(0, (t - T0 + 0.8) / 9.0))), zc + 2.0, Math.PI / 2]);
      w.hazards.push(t => t >= T0 ? [{pos: wp(a, 1.2).add(new THREE.Vector3(-2.7, 0, 0)), r: 2.6}] : null);
    },
  },
};
