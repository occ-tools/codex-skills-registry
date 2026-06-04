import type { RegistryReport } from "./report.js";
import type { RegistryRuleExplanation } from "./rules.js";
export interface RegistrySiteInput {
    report: RegistryReport;
    rules: RegistryRuleExplanation[];
    generatedAt?: string;
}
export interface WriteRegistrySiteOptions extends RegistrySiteInput {
    outDir: string;
}
export interface RegistrySiteManifest {
    outDir: string;
    files: string[];
}
/**
 * Writes a static documentation site for GitHub Pages or generic artifact hosting.
 *
 * @param options - Site output directory and source report data.
 * @returns Written file manifest.
 */
export declare function writeRegistrySite(options: WriteRegistrySiteOptions): Promise<RegistrySiteManifest>;
