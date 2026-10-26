"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiPrompt, listAiPrompts, updateAiPrompt } from "./ai-prompts-api";

export const aiPromptQueryKeys = {
  all: ["admin", "ai-prompts"] as const,
  detail: (jobKey: string) => ["admin", "ai-prompts", jobKey] as const,
};

export function useAdminAiPrompts() {
  return useQuery({ queryKey: aiPromptQueryKeys.all, queryFn: listAiPrompts });
}

export function useAdminAiPrompt(jobKey: string | null) {
  return useQuery({ queryKey: aiPromptQueryKeys.detail(jobKey ?? ""), queryFn: () => getAiPrompt(jobKey!), enabled: Boolean(jobKey) });
}

export function useUpdateAdminAiPrompt() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ jobKey, ...input }: { jobKey: string; expectedVersion: number; systemPrompt: string }) => updateAiPrompt(jobKey, input),
    onSuccess: (_result, variables) => {
      void client.invalidateQueries({ queryKey: aiPromptQueryKeys.all });
      void client.invalidateQueries({ queryKey: aiPromptQueryKeys.detail(variables.jobKey) });
    },
  });
}
