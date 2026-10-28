import assert from "node:assert/strict";
import test from "node:test";
import { CAPABILITIES, hasCapability } from "./permissions.ts";

test("admin retains the complete admin capability set", () => {
  for (const capability of Object.values(CAPABILITIES)) {
    assert.equal(hasCapability("admin", capability), true, `admin should have ${capability}`);
  }
});

test("maintainer can review ideas but cannot administer users or settings", () => {
  assert.equal(hasCapability("maintainer", CAPABILITIES.IDEAS_READ), true);
  assert.equal(hasCapability("maintainer", CAPABILITIES.GOVERNANCE_READ), true);
  assert.equal(hasCapability("maintainer", CAPABILITIES.GOVERNANCE_MANAGE), true);
  assert.equal(hasCapability("maintainer", CAPABILITIES.USERS_MANAGE), false);
  assert.equal(hasCapability("maintainer", CAPABILITIES.SETTINGS_MANAGE), false);
  assert.equal(hasCapability("maintainer", CAPABILITIES.AI_RUNS_MANAGE), false);
});

test("employees and business owners do not have admin-only capabilities", () => {
  assert.equal(hasCapability("employee", CAPABILITIES.IDEAS_WRITE), true);
  assert.equal(hasCapability("employee", CAPABILITIES.GOVERNANCE_MANAGE), false);
  assert.equal(hasCapability("business_owner", CAPABILITIES.GOVERNANCE_MANAGE), true);
  assert.equal(hasCapability("business_owner", CAPABILITIES.USERS_MANAGE), false);
  assert.equal(hasCapability("business_owner", CAPABILITIES.SETTINGS_MANAGE), false);
});
