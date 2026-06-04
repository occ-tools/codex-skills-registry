export interface RegistryRuleExplanation {
    code: string;
    title: string;
    description: string;
    remediation: string;
}
export declare function listRegistryRules(): RegistryRuleExplanation[];
export declare function explainRegistryRule(code: string): RegistryRuleExplanation | undefined;
