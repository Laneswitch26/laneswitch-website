import {createSessionToken, normalizeCode, sessionCookie, sha256Hex} from "../_lib/auth.js";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;

function json(message, status) {
  return Response.json({message}, {status, headers: {"Cache-Control": "no-store"}});
}

export async function onRequestPost({request, env}) {
  if (!env.DB || !env.CODE_PEPPER || !env.SESSION_SECRET || !env.RATE_LIMIT_SECRET) {
    return json("Der Zugang ist noch nicht vollständig eingerichtet.", 503);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin || origin !== requestUrl.origin) return json("Ungültige Anfrage.", 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json("Ungültige Anfrage.", 400);
  }

  const normalized = normalizeCode(body.code);
  if (normalized.length < 8 || normalized.length > 48) return json("Der Partnercode ist nicht gültig.", 400);

  const now = Date.now();
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const ip = request.headers.get("CF-Connecting-IP") || "local-development";
  const ipHash = await sha256Hex(`${env.RATE_LIMIT_SECRET}:${windowStart}:${ip}`);

  await env.DB.prepare(
    "INSERT INTO login_attempts (ip_hash, window_start, attempts) VALUES (?1, ?2, 1) " +
    "ON CONFLICT(ip_hash, window_start) DO UPDATE SET attempts = attempts + 1"
  ).bind(ipHash, windowStart).run();

  const attemptRow = await env.DB.prepare(
    "SELECT attempts FROM login_attempts WHERE ip_hash = ?1 AND window_start = ?2"
  ).bind(ipHash, windowStart).first();

  await env.DB.prepare("DELETE FROM login_attempts WHERE window_start < ?1").bind(now - 86400000).run();
  if (!attemptRow || Number(attemptRow.attempts) > MAX_ATTEMPTS) {
    return json("Zu viele Versuche. Bitte warte zehn Minuten.", 429);
  }

  const codeHash = await sha256Hex(`${env.CODE_PEPPER}:${normalized}`);
  const record = await env.DB.prepare(
    "SELECT ac.id AS code_id, ps.id AS school_id " +
    "FROM access_codes ac JOIN partner_schools ps ON ps.id = ac.school_id " +
    "WHERE ac.code_hash = ?1 AND ac.status = 'active' AND ps.status = 'active' " +
    "AND (ac.expires_at IS NULL OR ac.expires_at > ?2) LIMIT 1"
  ).bind(codeHash, now).first();

  if (!record) return json("Der Partnercode ist nicht gültig oder nicht mehr aktiv.", 401);

  await env.DB.prepare("UPDATE access_codes SET last_used_at = ?1 WHERE id = ?2").bind(now, record.code_id).run();
  const expiresAt = now + 12 * 60 * 60 * 1000;
  const token = await createSessionToken(env.SESSION_SECRET, record.school_id, expiresAt);

  return Response.json(
    {ok: true, redirect: "/fahrschueler/"},
    {headers: {"Set-Cookie": sessionCookie(token), "Cache-Control": "no-store"}}
  );
}

export function onRequest() {
  return json("Methode nicht erlaubt.", 405);
}
