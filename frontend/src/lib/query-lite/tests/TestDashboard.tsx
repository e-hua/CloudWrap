import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useMutation,
  useQuery,
  QueryLiteDevtools,
} from "@/lib/query-lite";
import { useState } from "react";

import { sleep } from "@/utils/sleep";

const queryClient = new QueryClient();

function TestDashboard() {
  const [postId, setPostId] = useState(-1);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full flex flex-col justify-between">
        <div className="p-4">
          {postId > -1 ? (
            <Post postId={postId} setPostId={setPostId} />
          ) : (
            <Posts setPostId={setPostId} />
          )}
        </div>
        <QueryLiteDevtools />
      </div>
    </QueryClientProvider>
  );
}

// testing useQuery()
// Fetching five posts
function usePosts() {
  return useQuery({
    queryKey: "posts",
    queryFunction: async () => {
      await sleep(1000);
      const data = await (
        await fetch("https://jsonplaceholder.typicode.com/posts", {
          method: "GET",
        })
      ).json();
      return data.slice(0, 5);
    },
  });
}

// testing useQuery()
// Fetching single post
function usePost(postId: number) {
  return useQuery({
    queryKey: `posts-${postId}`,
    queryFunction: async () => {
      await sleep(1000);
      const data = await (
        await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
          method: "GET",
        })
      ).json();
      return data;
    },
  });
}

// testing useMutation
function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFunction: async (postId: number) => {
      // Just a dummy function to trigger the re-fetching
    },
    onSuccess: () => queryClient.invalidateQuery("posts"),
  });
}

function Posts({ setPostId }: { setPostId: (postId: number) => void }) {
  const postsQuery = usePosts();
  const updatePostMutation = useUpdatePost();

  return (
    <div>
      <h1>Posts</h1>
      <button
        onClick={() => updatePostMutation.mutate(1)}
        disabled={updatePostMutation.isPending}
        className="my-2 p-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {updatePostMutation.isPending ? "Creating..." : "Create Post"}
      </button>
      <div className="mt-2">
        {postsQuery.status === "idle" ? (
          <div className="text-blue-400 font-bold">Initializing</div>
        ) : postsQuery.status === "error" ? (
          <div className="text-red-500">Error: {postsQuery.error}</div>
        ) : (
          <div>
            {/* This is to remove the placeholder before any list item */}
            <ul className="list-none">
              {postsQuery.data &&
                postsQuery.data?.map((post: any) => (
                  <li
                    key={post.id}
                    onClick={() => setPostId(post.id)}
                    className="p-1 cursor-pointer"
                  >
                    {post.title}
                  </li>
                ))}
            </ul>
            <div className="mt-4 italic text-green-600 font-bold">
              {postsQuery.status === "loading"
                ? "Background updating..."
                : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Post({
  postId,
  setPostId,
}: {
  postId: number;
  setPostId: (postId: number) => void;
}) {
  const postQuery = usePost(postId);

  return (
    <div>
      <div
        className="px-2 py-1 text-lg font-bold bg-blue-500 text-white"
        onClick={() => setPostId(-1)}
      >
        &lt &lt == Back
      </div>
      <div className="mt-2">
        {postQuery.status === "idle" ? (
          <div className="text-blue-400 font-bold">Initializing</div>
        ) : postQuery.status === "error" ? (
          <div className="text-red-500">Error: {postQuery.error}</div>
        ) : (
          <div>
            {/* This is to remove the placeholder before any list item */}
            <h1>{postQuery?.data?.title}</h1>
            <div className="mt-4">
              <p>{postQuery?.data?.body}</p>
            </div>
            <div className="mt-4 italic text-green-600 font-bold">
              {postQuery.status === "loading" ? "Background updating..." : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { TestDashboard };
