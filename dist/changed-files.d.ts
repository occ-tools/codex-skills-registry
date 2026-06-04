import type { ValidationIssue } from "./schema.js";
export interface ChangedFilesOptions {
    cwd?: string;
    changedFilesFile?: string;
}
export declare function loadChangedFiles(options: ChangedFilesOptions): Promise<Set<string> | undefined>;
export declare function filterIssuesByChangedFiles(issues: ValidationIssue[], options: ChangedFilesOptions, changedFiles: Set<string> | undefined): ValidationIssue[];
