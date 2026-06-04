import type { IssueBaseline } from "./issues.js";
export declare function loadIssueBaselineFile(cwd: string, baselineFile: string | undefined): Promise<IssueBaseline | undefined>;
