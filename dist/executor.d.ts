import type { SkillsRegistry } from "./registry.js";
import type { CodexSkill, TriggerType } from "./schema.js";
export interface MockExecutionOptions {
    trigger?: TriggerType;
    repository?: string;
    actor?: string;
    payload?: Record<string, unknown>;
}
export interface MockWebhookEvent {
    id: string;
    trigger: TriggerType;
    repository: string;
    actor: string;
    payload: Record<string, unknown>;
}
export interface MockExecutionResult {
    success: boolean;
    skill: CodexSkill;
    event: MockWebhookEvent;
    logs: string[];
}
/**
 * Creates a deterministic mock maintainer event for smoke tests and demos.
 *
 * @param skill - Skill being exercised.
 * @param options - Optional event overrides.
 * @returns Mock webhook-like event.
 */
export declare function createMockEvent(skill: CodexSkill, options?: MockExecutionOptions): MockWebhookEvent;
/**
 * Simulates execution of a skill without invoking arbitrary local code. The
 * mock executor proves routing and metadata are correct while staying safe for
 * CI and untrusted community contributions.
 *
 * @param registry - Registry containing the target skill.
 * @param skillName - Skill to simulate.
 * @param options - Mock event overrides.
 * @returns Execution result with terminal-friendly logs.
 */
export declare function executeMockSkill(registry: SkillsRegistry, skillName: string, options?: MockExecutionOptions): Promise<MockExecutionResult>;
