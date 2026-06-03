export interface IssueTriageInput {
  title: string;
  body?: string;
  labels?: string[];
}

export function run(input: IssueTriageInput) {
  const body = input.body ?? "";
  const text = `${input.title}\n${body}`.toLowerCase();
  const classification = text.includes("error") || text.includes("crash") ? "bug" : "unclear";
  const missingDetails = [
    body.includes("reproduce") ? undefined : "reproduction steps",
    body.includes("version") ? undefined : "affected version"
  ].filter(Boolean);

  return {
    classification,
    suggestedLabels: [...new Set([...(input.labels ?? []), classification])],
    missingDetails,
    nextAction:
      missingDetails.length > 0
        ? "Ask the reporter for the missing reproduction details."
        : "Route to a maintainer for confirmation.",
    responseDraft:
      missingDetails.length > 0
        ? `Thanks for the report. Could you add ${missingDetails.join(" and ")}?`
        : "Thanks for the clear report. A maintainer can review the next action."
  };
}
