const encoder = new TextEncoder();

export function normalizeCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(secret, usage) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), {name: "HMAC", hash: "SHA-256"}, false, [usage]);
}

export async function createSessionToken(secret, schoolId, expiresAt, nonce = crypto.randomUUID()) {
  const payload = `v1.${schoolId}.${expiresAt}.${nonce}`;
  const key = await hmacKey(secret, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(secret, token, now = Date.now()) {
  const parts = String(token || "").split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return null;
  const [version, schoolId, expiresRaw, nonce, signatureRaw] = parts;
  const expiresAt = Number(expiresRaw);
  if (!schoolId || !nonce || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  try {
    const key = await hmacKey(secret, "verify");
    const payload = `${version}.${schoolId}.${expiresRaw}.${nonce}`;
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signatureRaw), encoder.encode(payload));
    return valid ? {schoolId, expiresAt} : null;
  } catch {
    return null;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export function sessionCookie(token, maxAgeSeconds = 43200) {
  return `ls_student=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return "ls_student=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax";
}
