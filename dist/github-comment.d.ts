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
/**
 * Creates or updates a pull request issue comment with a stable marker.
 *
 * @param options - GitHub API and comment options.
 * @returns Publish result, including skip reasons when context is incomplete.
 */
export declare function publishPullRequestComment(options: PublishPullRequestCommentOptions): Promise<PublishPullRequestCommentResult>;
