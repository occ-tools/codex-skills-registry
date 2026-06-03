export interface ReleaseChange {
  title: string;
  type?: "breaking" | "feature" | "fix" | "docs" | "internal";
  pullRequest?: number;
}

export function run(changes: ReleaseChange[]) {
  const sections = {
    breaking: [] as string[],
    feature: [] as string[],
    fix: [] as string[],
    docs: [] as string[],
    internal: [] as string[]
  };

  for (const change of changes) {
    const type = change.type ?? "internal";
    const suffix = change.pullRequest ? ` (#${change.pullRequest})` : "";
    sections[type].push(`${change.title}${suffix}`);
  }

  return sections;
}
