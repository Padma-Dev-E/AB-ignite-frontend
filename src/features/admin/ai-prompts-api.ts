import { apiFetch } from "../../lib/api/client";

export type AiPromptVersion = {
  id: number;
  jobKey: string;
  version: number;
  systemPrompt: string;
  contentHash: string;
  createdBy: number | null;
  isDefault: boolean;
  schemaVersion: string;
  createdAt: string;
};

export type AiPromptUsage = {
  page: string;
  action: string;
};

export type AiPromptEntry = {
  jobKey: string;
  name: string;
  description: string;
  usage: AiPromptUsage[];
  activeVersion: number;
  systemPrompt: string;
  contentHash: string;
  updatedAt: string;
  versions: Array<Pick<AiPromptVersion, "version" | "schemaVersion" | "isDefault" | "createdAt">>;
};

export type AiPromptDetail = Omit<AiPromptEntry, "systemPrompt" | "contentHash" | "versions"> & {
  versions: AiPromptVersion[];
};

export function listAiPrompts() {
  return apiFetch<{ items: AiPromptEntry[] }>("/api/admin/ai-prompts");
}

export function getAiPrompt(jobKey: string) {
  return apiFetch<AiPromptDetail>(`/api/admin/ai-prompts/${encodeURIComponent(jobKey)}`);
}

export function updateAiPrompt(jobKey: string, input: { expectedVersion: number; systemPrompt: string }) {
  return apiFetch<{ jobKey: string; version: number; contentHash: string; activated: true }>(`/api/admin/ai-prompts/${encodeURIComponent(jobKey)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...input, reason: "Automatically recorded admin action: AI prompt updated." }),
  });
}
