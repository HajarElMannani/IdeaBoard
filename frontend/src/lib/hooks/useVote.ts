import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, withAuthHeaders } from "@/lib/apiClient";
import type { components } from "@/types/ideaboard-api";

type PaginatedPosts = components["schemas"]["PaginatedPosts"];

type VoteArgs = { postId: string; value: -1 | 1 };

export function useVote() {
  const queryClient = useQueryClient();

  function applyOptimisticUpdate(postId: string, deltaUp: number, deltaDown: number) {
    const queries = queryClient.getQueriesData<PaginatedPosts>({ queryKey: ["posts"] });
    queries.forEach(([key, oldData]) => {
      if (!oldData) return;
      const newItems = oldData.items.map(post =>
        post.id === postId
          ? { ...post, up_count: post.up_count + deltaUp, down_count: post.down_count + deltaDown }
          : post
      );
      const newData: PaginatedPosts = { ...oldData, items: newItems };
      queryClient.setQueryData(key, newData);
    });
  }

  const mutation = useMutation({
    mutationFn: async ({ postId, value }: VoteArgs) => {
      const headers = await withAuthHeaders();
      const { error, response } = await client.POST("/api/v1/votes", {
        body: { post_id: postId, value },
        headers,
      });
      if (error) {
        const err = new Error("Vote failed");
        (err as unknown as { response?: Response }).response = response as unknown as Response;
        throw err;
      }
      return { postId, value } as VoteArgs;
    },
    onMutate: async (variables) => {
      const { postId, value } = variables;
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const snapshots = queryClient.getQueriesData<PaginatedPosts>({ queryKey: ["posts"] }).map(([key, data]) => ({ key, data }));
      if (value === 1) {
        applyOptimisticUpdate(postId, 1, 0);
      } else {
        applyOptimisticUpdate(postId, 0, 1);
      }
      return { snapshots } as { snapshots: { key: unknown; data: PaginatedPosts | undefined }[] };
    },
    onError: (error: unknown, _vars, context) => {
      // rollback
      const snapshots = (context as { snapshots?: { key: unknown; data: PaginatedPosts | undefined }[] } | undefined)?.snapshots;
      if (snapshots) {
        snapshots.forEach(({ key, data }) => queryClient.setQueryData(key, data));
      }
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if (status === 401) alert("Please sign in to vote.");
      else if (status === 403) alert("You do not have permission to vote.");
      else alert("Failed to register vote.");
    },
    onSettled: () => {
      // Optionally refetch to sync counts with server
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  function upvote(postId: string) {
    mutation.mutate({ postId, value: 1 });
  }

  function downvote(postId: string) {
    mutation.mutate({ postId, value: -1 });
  }

  return {
    upvote,
    downvote,
    isPending: mutation.isPending,
  };
}


