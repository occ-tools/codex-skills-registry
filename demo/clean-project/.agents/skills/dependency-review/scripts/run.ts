export interface DependencyReviewInput {
  changedPackages: string[];
  securityAdvisories?: string[];
}

export function run(input: DependencyReviewInput) {
  return {
    changedPackages: input.changedPackages,
    securityAdvisories: input.securityAdvisories ?? [],
    risk: input.securityAdvisories?.length ? "review-required" : "low",
    nextAction: input.securityAdvisories?.length
      ? "Review advisories before merging."
      : "Proceed after routine maintainer review."
  };
}
