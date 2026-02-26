"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TeamType } from "@/app/admin/content/team/types";

type ReorderItemType = { id: string; order_index: number };

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch(
        "/api/teams?sortField=order_index&sortDir=asc&pageSize=100",
        {
          credentials: "include",
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to fetch teams");
      return result.data.data as TeamType[];
    },
  });
}

export function useReorderTeams() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: ["teams", "reorder"],
    mutationFn: async (items: ReorderItemType[]) => {
      const response = await fetch("/api/teams/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to reorder teams");
      }

      return response.json();
    },
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousTeams = queryClient.getQueryData<TeamType[]>(["teams"]);

      if (previousTeams) {
        const orderMap = new Map(items.map((i) => [i.id, i.order_index]));
        const updated = previousTeams
          .map((team) => ({
            ...team,
            order_index: orderMap.get(team.team_id) ?? team.order_index,
          }))
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        queryClient.setQueryData(["teams"], updated);
      }

      return { previousTeams };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to reorder teams",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team order updated successfully",
        variant: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
