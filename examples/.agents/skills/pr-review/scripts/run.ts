export interface PullRequestReviewInput {
  title: string;
  changedFiles: string[];
  testSummary?: string;
}

export function run(input: PullRequestReviewInput) {
  const touchesTests = input.changedFiles.some((file) => /(^|\/)(test|tests)\//.test(file));
  const touchesReleaseSurface = input.changedFiles.some((file) =>
    /package\.json|action\.yml|src\/cli\.ts/.test(file)
  );

  return {
    title: input.title,
    checks: [
      {
        name: "tests",
        status: touchesTests || input.testSummary ? "covered" : "needs-review"
      },
      {
        name: "release-risk",
        status: touchesReleaseSurface ? "review-required" : "low"
      }
    ],
    findings: [],
    summary: "No blocking findings from the template review. Human review still required."
  };
}
