export interface PublishPullRequestCommentOptions {
  body: string;
  token?: string;
  repository?: string;
  pullRequestNumber?: string | number;
  apiUrl?: string;
  marker?: string;
}

export interface PublishPullRequestCommentResult {
  posted: boolean;
  updated: boolean;
  skippedReason?: string;
  url?: string;
}

interface GitHubComment {
  id: number;
  body?: string;
  html_url?: string;
}

const DEFAULT_MARKER = "<!-- codex-skills-registry -->";

/**
 * Creates or updates a pull request issue comment with a stable marker.
 *
 * @param options - GitHub API and comment options.
 * @returns Publish result, including skip reasons when context is incomplete.
 */
export async function publishPullRequestComment(
  options: PublishPullRequestCommentOptions,
): Promise<PublishPullRequestCommentResult> {
  const token = options.token;
  const repository = options.repository;
  const pullRequestNumber = options.pullRequestNumber;
  const apiUrl = options.apiUrl ?? "https://api.github.com";
  const marker = normalizeCommentMarker(options.marker);

  if (!token) {
    return { posted: false, updated: false, skippedReason: "GITHUB_TOKEN is not set." };
  }
  if (!repository) {
    return { posted: false, updated: false, skippedReason: "GitHub repository is not set." };
  }
  if (!pullRequestNumber) {
    return {
      posted: false,
      updated: false,
      skippedReason: "Pull request number is not available for this event.",
    };
  }

  const body = withCommentMarker(options.body, marker);
  const commentsPath = `/repos/${repository}/issues/${pullRequestNumber}/comments`;
  const comments = await listPullRequestComments(apiUrl, commentsPath, token);
  const existing = comments.find((comment) => comment.body?.includes(marker));

  if (existing) {
    const updated = await githubRequest<GitHubComment>(
      apiUrl,
      `/repos/${repository}/issues/comments/${existing.id}`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify({ body }),
      },
    );
    return {
      posted: true,
      updated: true,
      url: updated.html_url ?? existing.html_url,
    };
  }

  const created = await githubRequest<GitHubComment>(apiUrl, commentsPath, token, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

  return {
    posted: true,
    updated: false,
    url: created.html_url,
  };
}

function withCommentMarker(body: string, marker: string): string {
  return body.includes(marker) ? body : `${marker}\n${body}`;
}

function normalizeCommentMarker(marker: string | undefined): string {
  return marker && marker.trim().length > 0 ? marker : DEFAULT_MARKER;
}

async function listPullRequestComments(
  apiUrl: string,
  commentsPath: string,
  token: string,
): Promise<GitHubComment[]> {
  const comments: GitHubComment[] = [];

  for (let page = 1; ; page += 1) {
    const pageComments = await githubRequest<GitHubComment[]>(
      apiUrl,
      `${commentsPath}?per_page=100&page=${page}`,
      token,
    );
    comments.push(...pageComments);

    if (pageComments.length < 100) {
      return comments;
    }
  }
}

async function githubRequest<T>(
  apiUrl: string,
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API request failed with ${response.status}: ${text.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}
