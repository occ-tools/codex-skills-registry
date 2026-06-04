/**
 * Creates a deterministic mock maintainer event for smoke tests and demos.
 *
 * @param skill - Skill being exercised.
 * @param options - Optional event overrides.
 * @returns Mock webhook-like event.
 */
export function createMockEvent(skill, options = {}) {
    const trigger = options.trigger ?? skill.triggers[0] ?? "manual";
    return {
        id: `mock-${trigger}-${skill.name}`,
        trigger,
        repository: options.repository ?? "example/repository",
        actor: options.actor ?? "codex-bot",
        payload: {
            title: defaultTitleForTrigger(trigger),
            number: trigger === "release" ? undefined : 42,
            ...options.payload,
        },
    };
}
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
export async function executeMockSkill(registry, skillName, options = {}) {
    const skill = registry.getSkill(skillName);
    if (!skill) {
        throw new Error(`Skill '${skillName}' is not registered.`);
    }
    if (options.trigger && !skill.triggers.includes(options.trigger)) {
        throw new Error(`Skill '${skillName}' does not accept trigger '${options.trigger}'. Supported triggers: ${skill.triggers.join(", ")}.`);
    }
    const event = createMockEvent(skill, options);
    const logs = [
        `[mock] ${skill.name} accepted a ${event.trigger} event from ${event.repository}.`,
        `[mock] actor=${event.actor} event_id=${event.id}`,
        `[mock] handler=${skill.entryPoint ?? "instruction-only SKILL.md"}`,
        `[mock] completed without executing arbitrary code.`,
    ];
    return {
        success: true,
        skill,
        event,
        logs,
    };
}
function defaultTitleForTrigger(trigger) {
    switch (trigger) {
        case "issue":
            return "Bug: intermittent test failure on Windows";
        case "pr":
            return "Add retry handling to release workflow";
        case "release":
            return "v0.1.0";
        case "security":
            return "Dependency audit requires maintainer review";
        case "dependency":
            return "Update transitive dependency policy";
        case "manual":
            return "Manual maintainer workflow run";
    }
}
//# sourceMappingURL=executor.js.map