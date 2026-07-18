import type { DomainCheckResult, GeneratedName, ReportRecord } from "@/lib/types";

export function getDomainResultsForName(
  name: GeneratedName,
  domainResults: ReportRecord["domainResults"],
) {
  return name.domainCandidates
    .map((candidate) => domainResults[candidate] as DomainCheckResult[] | undefined)
    .flat()
    .filter((result): result is DomainCheckResult => Boolean(result));
}

export function getBestPick(report: ReportRecord) {
  return report.aiOutput.names[0];
}
