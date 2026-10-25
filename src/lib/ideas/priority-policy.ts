import type { IdeaPriorityPolicy } from "../../features/ideas/types";

type PriorityMetricKey = "turnaround" | "volume" | "value";
export type PriorityMetrics = Record<PriorityMetricKey, number>;

/** UI preview only. Fastify validates policy settings and recomputes every submitted score. */
export function scorePriority(metrics: PriorityMetrics, policy: IdeaPriorityPolicy) {
  for (const key of Object.keys(metrics) as PriorityMetricKey[]) {
    if (!Number.isFinite(metrics[key]) || metrics[key] < 0 || metrics[key] > 3) {
      throw new Error(`Invalid ${key} priority answer`);
    }
  }
  const breakdown = policy.kpis.map(({ key, question, hint, weight }) => ({
    key, question, hint, score: metrics[key], weight,
    contribution: Math.round(metrics[key] * weight * 100) / 100,
  }));
  const score = Math.round(policy.kpis.reduce((sum, kpi) => sum + metrics[kpi.key] * kpi.weight, 0) * 100) / 100;
  const band = [...policy.bands].reverse().find((entry) => score >= entry.minimum)?.name;
  if (!band) throw new Error("No priority band matches the calculated score");
  return { score, band, breakdown };
}
