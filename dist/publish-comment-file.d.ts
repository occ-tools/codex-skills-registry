export interface CommentArtifactPrefix {
    source: string;
    truncated: boolean;
}
export declare function readCommentArtifactPrefix(filePath: string): Promise<CommentArtifactPrefix>;
export declare function formatUntrustedCommentArtifact(source: string, options?: {
    truncated?: boolean;
}): string;
export declare function publishCommentArtifact(filePath: string, environment?: NodeJS.ProcessEnv): Promise<void>;
