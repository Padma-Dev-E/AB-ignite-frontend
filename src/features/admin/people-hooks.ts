"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPerson, listPeople, listPersonSessions, peopleQueryKeys, resetPersonPassword, resetPersonSignInSecurity, revokePersonSession, updatePersonActivation, updatePersonRole, type AdminRole } from "./people-api";

export function usePeopleUsers(search = "") {
  return useInfiniteQuery({ queryKey: peopleQueryKeys.search(search), queryFn: ({ pageParam }) => listPeople(pageParam, search), initialPageParam: null as number | null, getNextPageParam: (lastPage) => lastPage.nextAfter ?? undefined });
}
export function useCreatePerson() { return usePeopleMutation((input: { name: string; email: string; department: string; jobTitle?: string; role: AdminRole }) => createPerson(input)); }

export function usePersonSessions(userId: number | null) {
  return useQuery({ queryKey: userId === null ? [...peopleQueryKeys.users, "no-user"] : peopleQueryKeys.sessions(userId), queryFn: () => listPersonSessions(userId!), enabled: userId !== null });
}

function usePeopleMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: peopleQueryKeys.users }),
      client.invalidateQueries({ queryKey: ["admin", "users"] }),
      client.invalidateQueries({ queryKey: ["admin", "people", "users"] }),
    ]);
  } });
}

export function useUpdatePersonRole() {
  return usePeopleMutation(({ userId, role }: { userId: number; role: AdminRole }) => updatePersonRole(userId, role));
}

export function useUpdatePersonActivation() {
  return usePeopleMutation(({ userId, active }: { userId: number; active: boolean }) => updatePersonActivation(userId, active));
}

export function useResetPersonSignInSecurity() {
  return usePeopleMutation(({ userId }: { userId: number }) => resetPersonSignInSecurity(userId));
}
export function useResetPersonPassword() {
  return usePeopleMutation(({ userId }: { userId: number }) => resetPersonPassword(userId));
}
export function useRevokePersonSession() {
  return usePeopleMutation(({ userId, sessionId }: { userId: number; sessionId: number }) => revokePersonSession(userId, sessionId));
}
