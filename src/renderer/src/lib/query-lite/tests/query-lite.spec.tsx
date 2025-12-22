// This is the file where we use the new "Browser mode" from Vitest
// To carry out the integration testing of the <TestDashboard/> component

import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { TestDashboard } from "./TestDashboard";

// Mock the sleep function to make it returns instantly
vi.mock("@/utils/sleep", () => ({
  // An object that contains the mapping of the export names to mock functions
  sleep: vi.fn(
    () =>
      new Promise((res) => {
        // Set a small timeout for Vitest to
        // capture the rendered loading state before the mock promise is resolved
        setTimeout(res, 150);
      })
  ),
}));

// In order to prove the correctness of our Query-Lite "library"
describe("Testing the Query Lite Library", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (url: URL | RequestInfo) => {
        const urlString = url.toString();

        return new Promise((resolve, reject) => {
          if (urlString === "https://jsonplaceholder.typicode.com/posts") {
            resolve({
              ok: true,
              status: 200,
              json: async () => {
                const ans = [];
                for (let idx = 1; idx < 6; idx++) {
                  ans.push({
                    id: idx,
                    title: `Vitest title ${idx}`,
                  });
                }
                return ans;
              },
            } as Response);
          } else if (
            urlString.startsWith("https://jsonplaceholder.typicode.com/posts/")
          ) {
            const postIdChar = urlString[urlString.length - 1];
            const postId = Number(postIdChar);

            resolve({
              ok: true,
              status: 200,
              json: async () => ({
                id: postId,
                title: `Vitest title ${postId}`,
                body: `Vitest body ${postId}`,
              }),
            } as Response);
          } else {
            reject(
              new Error(`Wrong API call with invalid url string ${urlString}`)
            );
          }
        });
      }
    );
    render(<TestDashboard />);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // useQuery()
  describe("Query Lite should fetch the data when Dashboard is mounted", () => {
    it("should show text 'Background updating' on mount ", async () => {
      const textElement = page.getByText("Background updating...");
      await expect.element(textElement).toBeVisible();
    });

    it("should show 'inactive' in the devtool on mount", async () => {
      const textElement = page.getByText("inactive");
      await expect.element(textElement).toBeVisible();
    });

    it("should show five posts when Query Lite is done fetching", async () => {
      const postList = page.getByRole("list");
      await expect.element(postList).toBeVisible();

      const posts = page.getByRole("listitem");
      await expect.element(posts).toHaveLength(5);
    });

    it("should show 'success' in the devtool when Query Lite is done fetching", async () => {
      const textElement = page.getByText("success");
      await expect.element(textElement).toBeVisible();
    });
  });

  // useMutation()
  describe("Query Lite should re-fetch the data when using useMutation", () => {
    it("should show 'loading' in the devtool on click of the 'create post' button", async () => {
      const repostButton = page.getByRole("button");
      await repostButton.click();

      const textElement = page.getByText("loading");
      await expect.element(textElement).toBeVisible();
    });
  });

  // background updating
  describe("Query Lite should fetch the data when switching to specific post", () => {
    beforeEach(async () => {
      const firstPost = page.getByRole("listitem").first();
      await firstPost.click();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should show 'loading' in the devtool for new post and 'inactive' for all posts on mount", async () => {
      const firstPostDevtoolsQuery = page.getByTestId("posts-1");
      await expect.element(firstPostDevtoolsQuery).toBeVisible();
      await expect.element(firstPostDevtoolsQuery).toHaveTextContent("loading");

      const allPostsDevtoolsQuery = page.getByTestId("posts");
      await expect.element(allPostsDevtoolsQuery).toBeVisible();
      await expect.element(allPostsDevtoolsQuery).toHaveTextContent("inactive");
    });

    it("should show 'success' in the devtool when fetching is done", async () => {
      const firstPostDevtoolsQuery = page.getByTestId("posts-1");
      await expect.element(firstPostDevtoolsQuery).toBeVisible();
      await expect.element(firstPostDevtoolsQuery).toHaveTextContent("success");
    });

    it("should show specific post data when fetching is done", async () => {
      const queryDataTitle = page.getByText("Vitest title 1");
      await expect.element(queryDataTitle).toBeVisible();

      const queryDataBody = page.getByText("Vitest body 1");
      await expect.element(queryDataBody).toBeVisible();
    });

    it("should show 'inactive' for post and 'loading' for posts in the devtools when back to main page", async () => {
      const queryDataTitle = page.getByText("Vitest title 1");
      await expect.element(queryDataTitle).toBeVisible();

      const backButton = page.getByText("Back", { exact: true });
      await backButton.click();

      await expect.element(page.getByText("loading")).toBeVisible();

      const firstPostDevtoolsQuery = page.getByTestId("posts-1");
      await expect.element(firstPostDevtoolsQuery).toBeVisible();
      await expect
        .element(firstPostDevtoolsQuery)
        .toHaveTextContent("inactive");
    });
  });

  // garbage collection
  describe("Query Lite should invalidate the post query after 'cacheTime' elapsed", () => {
    it("should not see the 'post-1' after 500ms", async () => {
      const firstPost = page.getByRole("listitem").first();
      await firstPost.click();

      const queryDataTitle = page.getByText("Vitest title 1");
      await expect.element(queryDataTitle).toBeVisible();

      const backButton = page.getByText("Back", { exact: true });
      await backButton.click();

      const firstPostDevtoolsQuery = page.getByText("posts-1");
      await expect.element(firstPostDevtoolsQuery).toBeVisible();
      await expect.element(page.getByText("inactive")).toBeVisible();

      await expect.element(firstPostDevtoolsQuery).not.toBeInTheDocument();
    });
  });
});
