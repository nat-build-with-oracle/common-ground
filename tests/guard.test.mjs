import { test } from "node:test";
import assert from "node:assert/strict";
import { guard } from "../lib/guard.ts";

const request = (host, origin) => new Request("http://localhost:3300/api/send", {
  headers: { host, ...(origin ? { origin } : {}) },
});
test("API accepts loopback hosts only", () => {
  for (const host of ["localhost:3300", "127.0.0.1:3300", "[::1]:3300"]) {
    assert.equal(guard(request(host)), null);
  }
  for (const host of ["evil.example", "localhost.evil.example", "127.0.0.1.evil.example", ""]) {
    assert.equal(guard(request(host)).status, 403);
  }
});
test("writes require an exact same-origin header", () => {
  assert.equal(guard(request("localhost:3300", "http://localhost:3300"), true), null);
  assert.equal(guard(request("localhost:3300", "https://evil.example"), true).status, 403);
  assert.equal(guard(request("localhost:3300"), true).status, 403);
});
