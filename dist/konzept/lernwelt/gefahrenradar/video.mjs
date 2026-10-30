// Gefahrenradar · Videoszenen (vorgerenderte 3D-Fahrten). Fällt bei Problemen still auf die Zeichnungen zurück.
import { VIDEO_TRACKS } from './video-tracks.mjs?v=2';
const MEDIA_VERSION = 2; // bei neu gerenderten Videos erhöhen
import { hazardAt } from './core.mjs?v=6';

let disabled = false;
const saveData = () => { try { return Boolean(navigator.connection?.saveData); } catch { return false; } };
const supported = () => { try { return Boolean(document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401F"')); } catch { return false; } };

export function canUseVideo(id) { return !disabled && Boolean(VIDEO_TRACKS[id]) && supported() && !saveData(); }
export function hasPreview() { return !disabled && supported() && !saveData() && Boolean(VIDEO_TRACKS.ball); }

// Hängt die Spur an die Rundenszene. Der Gefahren-Zeitpunkt der Runde darf um ±350 ms variieren:
// Das Video startet dann entsprechend später, damit Bild und Trefferprüfung zusammenpassen.
export function attachTrack(scene) {
  const t = VIDEO_TRACKS[scene.id];
  scene.track = t;
  scene.trackOffset = scene.cueMs > 0 ? Math.max(0, Math.min(t.len - scene.durationMs, t.cue - scene.cueMs)) : 0;
  return scene;
}
export function detachTrack(scene) { delete scene.track; delete scene.trackOffset; return scene; }

const overlay = `<svg class="gr-art gr-overlay" viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g data-reveal="" visibility="hidden"><circle r="53" fill="none" stroke="#08374c" stroke-width="12"/><circle r="53" fill="none" stroke="#fff4bc" stroke-width="5"/><path d="M-10 0l8 9 17-22" fill="none" stroke="#fff4bc" stroke-width="6"/></g>
  <g data-cursor="" visibility="hidden" fill="none"><circle r="23" stroke="#102f43" stroke-width="7"/><circle r="23" stroke="#fff" stroke-width="3"/><path d="M-33 0h16m16 0h16M0-33v16m0 16v16" stroke="#fff" stroke-width="3"/></g>
</svg>`;

export function mountVideo(stage, scene, { onFail }) {
  stage.innerHTML = `<video class="gr-video" muted playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1"></video>${overlay}`;
  const video = stage.querySelector('video');
  const offset = scene.trackOffset || 0;
  let failed = false, ended = false;
  const fail = () => { if (failed) return; failed = true; disabled = true; onFail(); };
  video.muted = true; video.defaultMuted = true; video.playsInline = true;
  video.poster = `video/${scene.id}.jpg?v=${MEDIA_VERSION}`;
  video.src = `video/${scene.id}.mp4?v=${MEDIA_VERSION}#t=${(offset / 1000).toFixed(2)}`;
  video.addEventListener('error', fail);
  // Nicht jeder Browser beachtet den Startpunkt im Fragment (#t=…): dann einmalig selbst springen.
  video.addEventListener('loadedmetadata', () => { if (video.currentTime < offset / 1000 - 0.04) { try { video.currentTime = offset / 1000; } catch {} } }, { once: true });
  video.addEventListener('ended', () => { ended = true; });
  stage.dataset.loading = 'true';
  video.addEventListener('playing', () => { stage.dataset.loading = 'false'; });
  return {
    video,
    get ended() { return ended; },
    elapsed() { return failed ? null : video.currentTime * 1000 - offset; },
    play() { if (failed) return; const p = video.play(); if (p?.catch) p.catch(error => { if (error?.name !== 'AbortError') fail(); }); },
    pause() { try { video.pause(); } catch {} },
    // Ruhiger Modus: ein festes Standbild zeigen.
    showAt(ms) {
      const target = (ms + offset) / 1000;
      const set = () => { try { video.currentTime = target; } catch {} stage.dataset.loading = 'false'; };
      // Erst kurz abspielen, damit auch mobile Browser ein echtes Bild statt des Startbilds zeigen.
      const p = video.play();
      if (p?.then) p.then(() => { video.pause(); set(); }, () => { if (video.readyState >= 1) set(); else video.addEventListener('loadedmetadata', set, { once: true }); });
      else set();
    },
    destroy() { try { video.pause(); video.removeAttribute('src'); video.load(); } catch {} },
  };
}

export function paintOverlay(stage, scene, elapsed, reveal = false) {
  const at = hazardAt(scene, elapsed);
  const marker = stage.querySelector('[data-reveal]');
  if (!marker) return;
  marker.setAttribute('visibility', reveal && at.x > -100 ? 'visible' : 'hidden');
  marker.setAttribute('transform', `translate(${Math.round(at.x)} ${Math.round(at.y)})`);
}
