import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminSettingsPatch } from "./settings-payload";

test("admin settings PATCH strips database metadata from editable level rows", () => {
  const payload = buildAdminSettingsPatch({
    reason: "Automatically recorded admin action: workflow settings updated.",
    levels: [{
      id: 1,
      name: "Ignite Starter",
      description: "Begin your innovation journey",
      minimumPoints: 0,
      sortOrder: 0,
      createdAt: "2026-10-25T17:11:39.000Z",
      updatedAt: "2026-10-25T17:11:39.000Z",
    } as {
      id: number;
      name: string;
      description: string;
      minimumPoints: number;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
    }],
  });

  assert.deepEqual(payload.levels, [{
    id: 1,
    name: "Ignite Starter",
    description: "Begin your innovation journey",
    minimumPoints: 0,
    sortOrder: 0,
  }]);
});
