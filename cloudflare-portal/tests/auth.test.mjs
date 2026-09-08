import test from "node:test";
import assert from "node:assert/strict";
import {createSessionToken, normalizeCode, verifySessionToken} from "../functions/_lib/auth.js";

test("normalizeCode vereinheitlicht Schreibweisen", () => {
  assert.equal(normalizeCode(" ls-abcd efgh-1234 "), "LSABCDEFGH1234");
});

test("signierte Sitzung wird akzeptiert", async () => {
  const expires = Date.now() + 60000;
  const token = await createSessionToken("a-secure-test-secret-with-enough-length", "school-1", expires, "nonce-1");
  const result = await verifySessionToken("a-secure-test-secret-with-enough-length", token);
  assert.equal(result.schoolId, "school-1");
});

test("manipulierte und abgelaufene Sitzung wird abgelehnt", async () => {
  const secret = "a-secure-test-secret-with-enough-length";
  const expires = Date.now() + 60000;
  const token = await createSessionToken(secret, "school-1", expires, "nonce-2");
  assert.equal(await verifySessionToken(secret, token.replace("school-1", "school-2")), null);
  assert.equal(await verifySessionToken(secret, token, expires + 1), null);
});
