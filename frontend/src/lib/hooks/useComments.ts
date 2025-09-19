import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client, withAuthHeaders } from "@/lib/apiClient";
import type { components } from "@/types/ideaboard-api";

type PaginatedComments = components["schemas"]["PaginatedComments"];

export function useComments(postId: string, params: { page: number; page_size: number }) {
  return useQuery({
    queryKey: ["comments", postId, params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/posts/{postId}/comments", {
        params: { path: { postId }, query: params },
      });
      if (error) throw error;
      return data as PaginatedComments;
    },
    enabled: Boolean(postId),
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body }: { body: string }) => {
      const headers = await withAuthHeaders();
      const { data, error, response } = await client.POST("/api/v1/posts/{postId}/comments", {
        params: { path: { postId } },
        body: { body },
        headers,
      });
      if (error) {
        const err: any = new Error("Failed to add comment");
        (err.response = response);
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}


