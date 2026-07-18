export type FollowUpPriority = "overdue" | "today" | "upcoming";

export function getPriority(nextFollowUpDate: string): FollowUpPriority {
  const today = new Date().toISOString().split("T")[0];
  const compareDate = nextFollowUpDate.split("T")[0];
  if (compareDate < today) return "overdue";
  if (compareDate === today) return "today";
  return "upcoming";
}
