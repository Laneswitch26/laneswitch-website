import {createHash, randomBytes} from "node:crypto";

const pepper = process.env.CODE_PEPPER;
if (!pepper || pepper.length < 24) {
  console.error("CODE_PEPPER muss als Umgebungsvariable mit mindestens 24 Zeichen gesetzt sein.");
  process.exit(1);
}

const raw = randomBytes(9).toString("base64url").toUpperCase();
const groups = raw.match(/.{1,4}/g);
const code = `LS-${groups.join("-")}`;
const normalized = code.replace(/[^A-Z0-9]/g, "");
const hash = createHash("sha256").update(`${pepper}:${normalized}`).digest("hex");

console.log(JSON.stringify({code, code_hash: hash}, null, 2));
