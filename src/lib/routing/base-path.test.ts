import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBasePath, stripBasePath, withBasePath } from "./base-path";

test("normalizes an optional deployment prefix", () => {
  assert.equal(normalizeBasePath(""), "");
  assert.equal(normalizeBasePath("ignite/"), "/ignite");
  assert.equal(normalizeBasePath("/internal/ignite/"), "/internal/ignite");
  assert.throws(() => normalizeBasePath("/ignite?view=home"));
});

test("adds a prefix once and strips it for route authorization", () => {
  assert.equal(withBasePath("/api/profile", "/ignite"), "/ignite/api/profile");
  assert.equal(withBasePath("/ignite/api/profile", "/ignite"), "/ignite/api/profile");
  assert.equal(stripBasePath("/ignite/private/admin", "/ignite"), "/private/admin");
  assert.equal(stripBasePath("/ignite", "/ignite"), "/");
  assert.equal(stripBasePath("/private", "/ignite"), "/private");
});
