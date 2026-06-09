export interface XquikWorkflowInput {
  task?: string;
  privateData?: boolean;
  writes?: boolean;
  persistentResource?: boolean;
  hasApiKey?: boolean;
}

export function run(input: XquikWorkflowInput = {}) {
  const requestedTask = input.task?.trim() || "Plan an X/Twitter data workflow";
  const requiresApproval =
    input.privateData === true || input.writes === true || input.persistentResource === true;

  return {
    task: requestedTask,
    ready: input.hasApiKey === true && requiresApproval === false,
    setupChecks: [
      "Load the Xquik API key from XQUIK_API_KEY or a secure client secret store.",
      "Verify endpoint details against the public Xquik docs before execution.",
    ],
    approvalRequired: requiresApproval,
    approvalPrompt: requiresApproval
      ? "Confirm the exact target, action, payload or query, destination, and usage estimate before running."
      : undefined,
    blockedRequests: [
      "Do not request X passwords, cookies, 2FA codes, recovery codes, session tokens, or browser exports.",
      "Do not send private X content to other tools without user consent.",
    ],
  };
}
