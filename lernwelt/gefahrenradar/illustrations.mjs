import { hazardAt } from './core.mjs';
// All vectors are original, local markup. No image services, fonts or trackers.
const windows = (x, y, columns, rows, step = 40) => Array.from({length: columns * rows}, (_, i) => `<g transform="translate(${x + (i % columns) * step} ${y + Math.floor(i / columns) * 47})"><rect width="17" height="25" rx="2" fill="#527d8c"/><path d="M8.5 0v25M0 12h17" stroke="#dce7e5" stroke-width="2"/></g>`).join('');
const house = (x,y,w,h,color) => `<g><path d="M${x-9} ${y}l${w/2+9} -33 ${w/2+9} 33" fill="#426372"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>${windows(x+14,y+17,Math.max(1,Math.floor((w-16)/40)),Math.max(1,Math.floor((h-10)/47)))}<path d="M${x} ${y+h}h${w}" stroke="#8eacae" stroke-width="6"/></g>`;
const tree = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0v-67" stroke="#66776c" stroke-width="9"/><ellipse cy="-95" rx="36" ry="47" fill="#7faaa0"/><ellipse cx="-13" cy="-106" rx="24" ry="33" fill="#a3c4af"/></g>`;
const car = (x,y,s,color='#477e93') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="7" rx="67" ry="13" fill="#173e50" opacity=".18"/><rect x="-57" y="-37" width="18" height="44" rx="6" fill="#263f4d"/><rect x="39" y="-37" width="18" height="44" rx="6" fill="#263f4d"/><path d="M-56-14v-42l12-46q4-9 14-9h60q10 0 14 9l12 46v42q0 9-10 9h-92q-10 0-10-9" fill="${color}" stroke="#31566b" stroke-width="3"/><path d="M-34-97h68l10 38h-88z" fill="#204659"/><path d="M-29-92h57l7 24h-72z" fill="#8fb9c5" opacity=".65"/><path d="M-50-48h100M-43-15h86" stroke="#d0e0e2" opacity=".55" stroke-width="3"/><rect x="-48" y="-41" width="23" height="12" rx="3" fill="#e8837b"/><rect x="25" y="-41" width="23" height="12" rx="3" fill="#e8837b"/><rect x="-18" y="-24" width="36" height="10" rx="2" fill="#eaf1ec"/></g>`;
const person = `<g><ellipse cy="48" rx="22" ry="6" fill="#264856" opacity=".15"/><path d="M-4 14l-7 32M6 14l13 31" fill="none" stroke="#28485f" stroke-width="9" stroke-linecap="round"/><path d="M-12-22q12-7 23 1l3 37h-29z" fill="#d7974d"/><path d="M-12-15l-11 26M11-15l12 21" fill="none" stroke="#d7974d" stroke-width="8" stroke-linecap="round"/><circle cy="-39" r="12" fill="#b88064"/><path d="M-12-40q-1-18 16-11l9 7" fill="#263e4e"/></g>`;
const cyclist = `<g><g fill="none" stroke="#244653" stroke-width="4"><ellipse cx="-7" cy="44" rx="16" ry="28"/><ellipse cx="11" cy="-1" rx="11" ry="20"/><path d="M-7 44l-4-37 22-8-8 29-10 16M-11 7h-9M11-1l5-12"/></g><path d="M-14-9l21 13-7 28M4-14l-13 27 10 15" fill="none" stroke="#23465d" stroke-width="9" stroke-linecap="round"/><path d="M-15-40q11-7 25 0l-5 29h-23z" fill="#d78049"/><path d="M-13-32l-12 19 21 4M8-32l15 17-7 2" fill="none" stroke="#ce9677" stroke-width="7" stroke-linecap="round"/><circle cx="-1" cy="-57" r="11" fill="#c38b6e"/><path d="M-13-58q0-17 17-12l10 12z" fill="#eef2df"/><path d="M-8-64h16" stroke="#668895" stroke-width="3"/></g>`;
const sideCar = `<g><ellipse cy="28" rx="63" ry="7" fill="#264856" opacity=".18"/><path d="M-65 14v-20l21-8 14-24h42l25 23 28 6v25z" fill="#558eae" stroke="#2a5268" stroke-width="3"/><path d="M-22-32h30l18 17h-60z" fill="#b5d7dc"/><path d="M-4-32v17" stroke="#2a5268" stroke-width="3"/><circle cx="-38" cy="15" r="13" fill="#284655"/><circle cx="42" cy="15" r="13" fill="#284655"/><circle cx="-38" cy="15" r="6" fill="#b1c4ca"/><circle cx="42" cy="15" r="6" fill="#b1c4ca"/><path d="M-63-2h8" stroke="#fff3cc" stroke-width="6"/></g>`;
const zebra = () => Array.from({length:9},(_,i)=>{const x=181+i*43;return `<path d="M${x+24} 349h23l13 33h-31z" fill="#f5f3e5"/>`;}).join('');
const crossingSign = `<g transform="translate(704 270)"><path d="M0 0v95" stroke="#748d92" stroke-width="5"/><rect x="-25" y="-50" width="50" height="50" rx="3" fill="#246384" stroke="#eef5f1" stroke-width="3"/><path d="M0-44l22 37h-44z" fill="#fff"/><circle cy="-30" r="3" fill="#214555"/><path d="M0-27l-3 7 7 8M-2-21l-7 8M-2-25l8 5M-15-9h30" fill="none" stroke="#214555" stroke-width="2.5"/></g>`;
export function illustration(scene) {
  const cross = ['cycle','junction'].includes(scene.id);
  return `<svg class="gr-art" viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><linearGradient id="gr-sky" x2="0" y2="1"><stop stop-color="#b9dbe2"/><stop offset="1" stop-color="#edf2e7"/></linearGradient><linearGradient id="gr-road" x2="0" y2="1"><stop stop-color="#879a9f"/><stop offset="1" stop-color="#566c78"/></linearGradient><linearGradient id="gr-dash" x2="0" y2="1"><stop stop-color="#284856"/><stop offset="1" stop-color="#102f43"/></linearGradient></defs>
  <rect width="800" height="560" fill="url(#gr-sky)"/><circle cx="642" cy="82" r="39" fill="#f6f3d9" opacity=".8"/>
  <path d="M0 218q160-55 297-3t256-8 247 5v100H0z" fill="#b5c8bc"/>
  ${house(260,173,57,88,'#d6dfd6')}${house(381,177,51,80,'#c2d6d0')}
  ${house(0,100,150,223,'#e8e1d0')}${house(169,161,79,135,'#cedbd6')}${house(546,126,139,195,'#e9e5d8')}${house(698,78,125,255,'#c9dad5')}
  ${tree(282,270,.48)}${tree(486,274,.5)}${tree(38,359,1)}
  <path d="M307 237h86l407 323H0z" fill="#c0ccc7"/><path d="M317 237h66l367 323H34z" fill="url(#gr-road)"/>
  <path d="M314 237L40 532M387 237l355 296" stroke="#e1e6df" stroke-width="5"/>
  <path d="M350 244l-1 13m-1 16-2 21m-2 21-3 34m-3 33-4 51m-4 40-5 56" stroke="#eeeede" stroke-width="5"/>
  ${cross ? `<path d="M0 285h800v55H0z" fill="#819398"/><path d="M0 280h284m169 0h347M0 343h224m328 0h248" stroke="#dce3db" stroke-width="6"/>` : ''}
  ${scene.id==='cycle' ? '<path d="M431 258l369 277" stroke="#b2cac8" stroke-width="34"/><path d="M424 257l371 279" stroke="#edf2e4" stroke-width="3" stroke-dasharray="12 10"/>' : ''}
  ${scene.id==='crossing' ? zebra()+crossingSign : ''}
  ${scene.id==='ball' ? car(213,395,.94,'#7c9a9a')+car(275,308,.48,'#c8b69a') : ''}
  ${scene.id==='door' ? car(602,441,1.15,'#4d999e')+car(500,318,.46,'#a1b4b1') : ''}
  ${['cycle','crossing'].includes(scene.id) ? car(221,326,.47,'#a0b2ad') : ''}
  ${scene.id==='junction' ? '<path d="M674 240h126v120H674z" fill="#9eafa1"/><path d="M670 243q30-40 62-17 35-36 68-12v105H670z" fill="#668f7f"/>' : ''}
  <g data-moving="" visibility="hidden">
    ${scene.id==='ball' ? '<ellipse cy="16" rx="23" ry="7" fill="#173e50" opacity=".2"/><g data-ball=""><circle r="19" fill="#f09d46" stroke="#8c5639" stroke-width="2"/><path d="M-16-10q26 9 25 27M-12 15q1-23 26-27" fill="none" stroke="#fff1c2" stroke-width="4"/></g>' : ''}
    ${scene.id==='cycle' ? cyclist : ''}${scene.id==='junction' ? sideCar : ''}${scene.id==='crossing' ? person : ''}
  </g>
  ${scene.id==='door' ? '<g data-door="" visibility="hidden"><path data-door-panel="" fill="#61a9ad" stroke="#2a5268" stroke-width="3"/><path data-door-window="" fill="#b5d2d4" stroke="#2a5268" stroke-width="3"/><circle cx="563" cy="334" r="10" fill="#c38b6e"/><path d="M554 349q9-6 17 1v17h-17z" fill="#34586d"/></g>' : ''}
  <g data-reveal="" visibility="hidden"><circle r="53" fill="none" stroke="#08374c" stroke-width="12"/><circle r="53" fill="none" stroke="#fff4bc" stroke-width="5"/><path d="M-10 0l8 9 17-22" fill="none" stroke="#fff4bc" stroke-width="6"/></g>
  <g data-cursor="" visibility="hidden" fill="none"><circle r="23" stroke="#102f43" stroke-width="7"/><circle r="23" stroke="#fff" stroke-width="3"/><path d="M-33 0h16m16 0h16M0-33v16m0 16v16" stroke="#fff" stroke-width="3"/></g>
  <path d="M0 0h17l37 441-31 57H0zM800 0h-17l-37 441 31 57h23z" fill="#183e50" opacity=".95"/>
  <path d="M0 523q400-94 800 0v37H0z" fill="url(#gr-dash)"/><path d="M100 538q305-64 600 0" fill="none" stroke="#52717b" stroke-width="2"/>
  <path d="M305 560a104 104 0 0 1 201 0" fill="none" stroke="#0b2535" stroke-width="25"/><path d="M311 559a98 98 0 0 1 189 0" fill="none" stroke="#45616e" stroke-width="3"/>
  ${scene.id==='cycle' ? '<path d="M455 519h30m-10-8 10 8-10 8" stroke="#64e3c6" stroke-width="5" fill="none"/>' : ''}
  </svg>`;
}
export function paint(stage, scene, elapsed, reveal = false) {
  const at = hazardAt(scene, elapsed);
  const visible = elapsed >= scene.cueMs;
  const moving = stage.querySelector('[data-moving]');
  moving.setAttribute('visibility', visible ? 'visible' : 'hidden');
  moving.setAttribute('transform', `translate(${at.x} ${at.y})`);
  const ball = stage.querySelector('[data-ball]');
  if (ball) ball.setAttribute('transform', `rotate(${at.progress*240})`);
  const door = stage.querySelector('[data-door]');
  if (door) {
    door.setAttribute('visibility', visible ? 'visible' : 'hidden');
    const edge = 542 - at.progress*62;
    stage.querySelector('[data-door-panel]').setAttribute('d', `M553 346L${edge} 331v87l63 ${-10}z`);
    stage.querySelector('[data-door-window]').setAttribute('d', `M550 349L${edge+5} 340v32l${545-edge} 9z`);
  }
  const marker = stage.querySelector('[data-reveal]');
  marker.setAttribute('visibility', reveal ? 'visible' : 'hidden');
  marker.setAttribute('transform', `translate(${at.x} ${at.y})`);
}
