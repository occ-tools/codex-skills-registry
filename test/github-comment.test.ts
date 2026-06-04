import { afterEach, describe, expect, it, vi } from "vitest";
import { publishPullRequestComment } from "../src/github-comment.js";

describe("github comment publishing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes empty markers to avoid updating unrelated comments", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse({
          id: 2,
          body: String(init.body),
          html_url: "https://example.com/new",
        });
      }

      return jsonResponse([
        { id: 1, body: "unrelated comment", html_url: "https://example.com/old" },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishPullRequestComment({
      body: "summary",
      token: "token",
      repository: "owner/repo",
      pullRequestNumber: 12,
      marker: "",
    });

    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");

    expect(result.updated).toBe(false);
    expect(patchCall).toBeUndefined();
    expect(postCall).toBeDefined();
    expect(String(postCall?.[1]?.body)).toContain("<!-- codex-skills-registry -->");
  });

  it("searches paginated comments before creating a new one", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      body: "unrelated comment",
    }));
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "PATCH") {
        return jsonResponse({ id: 200, html_url: "https://example.com/updated" });
      }
      if (new URL(url).searchParams.get("page") === "1") {
        return jsonResponse(firstPage);
      }

      return jsonResponse([
        {
          id: 200,
          body: "<!-- codex-skills-registry -->\nold summary",
          html_url: "https://example.com/old",
        },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishPullRequestComment({
      body: "new summary",
      token: "token",
      repository: "owner/repo",
      pullRequestNumber: 12,
    });

    const requestedUrls = fetchMock.mock.calls.map(([input]) => String(input));
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");

    expect(requestedUrls.some((url) => url.includes("page=2"))).toBe(true);
    expect(String(patchCall?.[0])).toContain("/issues/comments/200");
    expect(result.updated).toBe(true);
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: {
      "content-type": "application/json",
    },
  });
}
