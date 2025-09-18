import { useQuery } from "@tanstack/react-query";
import type { paths } from "@/types/ideaboard-api";
import { client } from "@/lib/apiClient";

type ListPostsQuery = NonNullable<paths["/api/v1/posts"]["get"]["parameters"]["query"]>;
type ListPostsResponse = paths["/api/v1/posts"]["get"]["responses"][200]["content"]["application/json"];

export function usePosts(params: ListPostsQuery) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/posts", { params: { query: params } });
      if (error) throw error;
      return data as ListPostsResponse;
    },
  });
}


