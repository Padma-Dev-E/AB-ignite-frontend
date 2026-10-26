export type AdminSettingsLevelInput = {
  id: number;
  name: string;
  description: string | null;
  minimumPoints: number;
  sortOrder: number;
};

export type AdminSettingsPointRuleInput = {
  code: string;
  points: number;
  active: boolean;
};

/** Whitelist editable settings fields so database metadata never reaches the strict API schema. */
export function buildAdminSettingsPatch(input: {
  reason: string;
  levels?: readonly AdminSettingsLevelInput[];
  pointRules?: readonly AdminSettingsPointRuleInput[];
}) {
  return {
    reason: input.reason,
    ...(input.levels ? {
      levels: input.levels.map(({ id, name, description, minimumPoints, sortOrder }) => ({ id, name, description, minimumPoints, sortOrder })),
    } : {}),
    ...(input.pointRules ? {
      pointRules: input.pointRules.map(({ code, points, active }) => ({ code, points, active })),
    } : {}),
  };
}
