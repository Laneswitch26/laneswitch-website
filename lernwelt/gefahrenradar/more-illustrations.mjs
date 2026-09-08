// Local SVG components: each case adds its own observable cue and road context.
const pole = (x,y,sign) => `<g transform="translate(${x} ${y})"><path d="M0 0v110" stroke="#728b91" stroke-width="6"/>${sign}</g>`;
const stop = '<path d="M-15-33h30l20 20v30L15 37h-30l-20-20v-30z" fill="#b33d40" stroke="#fff" stroke-width="4"/><text y="9" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="22" font-weight="700">STOP</text>';
const lights = (active) => `<rect x="-22" y="-49" width="44" height="112" rx="9" fill="#203c4c" stroke="#a9bdbd" stroke-width="3"/>${['#ff6159','#ffd275','#72dcbb'].map((color,i)=>`<circle cy="${-30+i*36}" r="12" fill="${i===active?color:'#52636b'}"/>`).join('')}`;
const bus = (signal='') => `<g><rect x="-58" y="-119" width="116" height="152" rx="12" fill="#d7bd77" stroke="#335668" stroke-width="4"/><rect x="-46" y="-89" width="92" height="68" rx="5" fill="#386072"/><path d="M0-89v68" stroke="#a6c5c7" stroke-width="3"/><rect x="-39" y="-110" width="78" height="13" rx="3" fill="#294e60"/><text y="-100" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="10">LINIE 12</text><path d="M-47 27v15M47 27v15" stroke="#243e4e" stroke-width="16"/><rect x="-47" y="1" width="18" height="12" fill="${signal?'#ffbc45':'#b78666'}"/><rect x="29" y="1" width="18" height="12" fill="${signal==='both'?'#ffbc45':'#b78666'}"/><rect x="-18" y="16" width="36" height="9" rx="2" fill="#eef0df"/>${signal?'<path d="M-62-2l-9-4m9 14-10 2" stroke="#ffc64f" stroke-width="4"/>':''}${signal==='both'?'<path d="M62-2l9-4m-9 14 10 2" stroke="#ffc64f" stroke-width="4"/>':''}</g>`;
const van = (reverse=false) => `<g><rect x="-60" y="-109" width="120" height="130" rx="9" fill="#e0e5db" stroke="#3e6170" stroke-width="4"/><rect x="-49" y="-95" width="98" height="43" rx="4" fill="#557b8c"/><path d="M0-100v113M-45 27v-10M45 27v-10" stroke="#345160" stroke-width="5"/><rect x="-51" y="-13" width="19" height="14" fill="${reverse?'#fffbdc':'#bd7466'}"/><rect x="32" y="-13" width="19" height="14" fill="${reverse?'#fffbdc':'#bd7466'}"/><path d="M-15-28h8m15 0h8" stroke="#345160" stroke-width="4"/></g>`;
const cone = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-17 0 0-44 17 0z" fill="#d97c44" stroke="#864f3d" stroke-width="2"/><path d="M-10-19h20l4 10h-28z" fill="#fff3db"/><path d="M-23 1h46" stroke="#355665" stroke-width="7"/></g>`;
const deer = `<g fill="#ad8060" stroke="#674d3e" stroke-width="3" stroke-linejoin="round"><ellipse rx="37" ry="18"/><path d="M-22 10l-9 35m24-35-7 35m31-34 6 34m3-43 12 36" fill="none" stroke-width="5"/><path d="M-32 0l-17-32 5-14 18 28M-49-31l-20 4-5-10 22-8z"/><path d="M-53-44l-6-17 14 10M-41-40l4-18 7 14"/><circle cx="-60" cy="-37" r="2" fill="#263e45"/></g>`;
const horse = `<g fill="#9c755b" stroke="#584e46" stroke-width="3"><ellipse cy="-4" rx="49" ry="26"/><path d="M-35 10l-6 49m26-43-3 43m40-43 5 43m10-47 9 47" fill="none" stroke-width="8"/><path d="M-40-8l-9-50-13-12-10 4-5 30 12 3 10-11 6 43z"/><path d="M-65-68l-4-15 12 12M44-15q28 11 15 46" fill="none" stroke-width="6"/><circle cx="-67" cy="-54" r="2" fill="#203d46"/></g>`;
const motorcycle = `<g><ellipse cy="35" rx="12" ry="25" fill="#294854"/><path d="M-21-15h42l-6 35h-30z" fill="#789bac" stroke="#284756" stroke-width="3"/><circle cy="-8" r="12" fill="#fff1bf"/><path d="M-24-15l-13-4m61 4 13-4M-11-35l-13 20M11-35l13 20" stroke="#284756" stroke-width="7" stroke-linecap="round"/><rect x="-14" y="-48" width="28" height="29" rx="8" fill="#b88153"/><circle cy="-62" r="15" fill="#dbe8e2" stroke="#294854" stroke-width="3"/><path d="M-12-65h24v8h-24z" fill="#34596b"/></g>`;
const ambulance = `<g><rect x="-82" y="-52" width="123" height="73" rx="6" fill="#ecede0" stroke="#325669" stroke-width="3"/><path d="M41-28h28l22 25v24H41z" fill="#eceee3" stroke="#325669" stroke-width="3"/><path d="M49-22h15L80-4H49z" fill="#83b4c4"/><path d="M-79-2H88" stroke="#de7e46" stroke-width="15"/><path d="M-32-43v30m-15-15h30" stroke="#cc644c" stroke-width="8"/><path d="M50-36h15M-63-59h20" stroke="#3fa4ec" stroke-width="10"/><path d="M-57-72v-8m-18 12-7-5M58-48v-9m14 14 9-5" stroke="#3fa4ec" stroke-width="4"/><circle cx="-54" cy="22" r="15" fill="#274452"/><circle cx="62" cy="22" r="15" fill="#274452"/></g>`;
const move = (x,y,art,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${art}</g>`;
const haltLine = '<path d="M343 369h229l13 12H342z" fill="#f3f0dc"/>';
const stopMarker = pole(698,246,'<circle r="25" fill="#e9d976" stroke="#437969" stroke-width="4"/><text y="10" text-anchor="middle" font-family="sans-serif" font-size="29" font-weight="bold" fill="#396b56">H</text>');
export function additionalArt(scene, {car, person, cyclist, sideCar, tree}) {
  let context='', moving='', before='';
  const frontCar=(x,y,s=1)=>car(x,y,s,'#dbe5dd').replaceAll('#e8837b','#fff3be');
  switch(scene.id) {
    case 'braking':
      before=car(436,344,.78);
      moving=car(0,0,.78)+'<path d="M-36-26h15m42 0h15M-12-47h24" stroke="#ff6251" stroke-width="9"/>';break;
    case 'obstacle':context=move(492,357,van(),.85);moving=frontCar(0,0,.8);break;
    case 'bus-warning':context=stopMarker+move(589,357,bus('both'));moving=person;break;
    case 'bus-departure':context=stopMarker;before=move(565,367,bus());moving=bus('left');break;
    case 'railway':
      context='<path d="M0 333h800M0 350h800" stroke="#36515e" stroke-width="7"/><path d="M0 330h800M0 347h800" stroke="#d0d6ce" stroke-width="2"/>'+Array.from({length:16},(_,i)=>`<path d="M${i*51} 325l13 35" stroke="#627570" stroke-width="5"/>`).join('')+pole(628,238,'<path d="M-28-28 28 28M28-28-28 28" stroke="#fff4e5" stroke-width="14"/><path d="M-28-28 28 28M28-28-28 28" stroke="#b9544e" stroke-width="7"/>')+'<path d="M690 344V198" stroke="#f5eddc" stroke-width="10"/><path d="M690 333v-24m0-23v-24m0-24v-24" stroke="#bf5a50" stroke-width="10"/><rect x="610" y="266" width="36" height="38" rx="7" fill="#274452"/>';
      moving='<circle r="12" fill="#ff6159"/>';break;
    case 'left-turn':moving=motorcycle;break;
    case 'turn-pedestrian':moving=person;break;
    case 'driveway':context='<path d="M573 325h227v55H573z" fill="#c4c6b9"/><path d="M663 234h137v93H663z" fill="#b8c5bb"/><path d="M665 239h135M665 277h135" stroke="#91a8a1" stroke-width="3"/>';moving=sideCar;break;
    case 'stop-sign':context=haltLine;moving=pole(0,0,stop);break;
    case 'red-light':context=haltLine;moving=pole(0,0,lights(0));break;
    case 'blocked-junction':context=pole(632,265,lights(2))+car(387,254,.25)+car(400,269,.32);moving=car(0,0,.44);break;
    case 'roadworks':context=cone(552,319,.6)+cone(596,358,.8)+cone(651,402)+'<path d="M587 313l120 101 36-10-120-91z" fill="#a39477"/>';moving=person.replaceAll('#d7974d','#e68f43')+'<path d="M-21 4l-48 25" stroke="#6a6b57" stroke-width="6"/><path d="M-69 27l-10 10 18 5 4-14z" fill="#526a71"/><path d="M-11-10h22M-11 4h22" stroke="#fff1c9" stroke-width="5"/>';break;
    case 'deer':moving=deer;break;
    case 'horse':moving=horse+move(53,-3,person,.8)+'<path d="M-69-36Q-25-56 41-8" fill="none" stroke="#4b5e59" stroke-width="2"/>';break;
    case 'wet-road':context=Array.from({length:32},(_,i)=>`<path d="M${35+i*24} ${85+(i%5)*39}l-12 25" stroke="#6c99ac" stroke-width="3" opacity=".6"/>`).join('');moving='<path d="M-51-20q62-35 100 4l55 40q-70 30-168 4z" fill="#8dbcc8" stroke="#b9d8d9" stroke-width="3"/><path d="M-30-2h64m-79 21h101" stroke="#d3e5df" stroke-width="4"/>';break;
    case 'fog':moving='<ellipse cy="-24" rx="235" ry="88" fill="#e3e9e5" opacity=".93"/><ellipse cx="-80" cy="-55" rx="190" ry="60" fill="#edf0e9" opacity=".7"/><path d="M-145-9q92-22 176-5m-95 30h140" stroke="#cad8d3" stroke-width="6" fill="none" opacity=".7"/>';break;
    case 'overtake-cycle':context=move(523,370,cyclist,.85);moving=frontCar(0,0,.8);break;
    case 'reversing':context='<path d="M574 335h226v86H574z" fill="#a2b2b1"/><path d="M614 340l-25 69m64-69-24 69m65-69-24 69m65-69-24 69" stroke="#e7eadd" stroke-width="4"/>';before=move(640,362,van());moving=van(true);break;
    case 'truck-turn':moving='<path d="M-61-127h110v131H-61z" fill="#a4b9b7" stroke="#355968" stroke-width="4"/><path d="M-57-116h102M-57-91h102M-57-66h102M-57-41h102M-5-127V4" stroke="#d4dfd7" stroke-width="3"/><path d="M-41 8v22m75-22v22" stroke="#294754" stroke-width="15"/><rect x="27" y="-8" width="17" height="10" fill="#ffc45a"/><path d="M56-9l14-4m-13 15 14 3" stroke="#ffc45a" stroke-width="4"/>';break;
    case 'emergency':moving=ambulance;break;
  }
  return {context,moving,before};
}
