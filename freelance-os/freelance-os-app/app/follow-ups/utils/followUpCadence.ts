export function getNextFollowUpDate(lastContactedDate: string, followUpCount: number): string {
  const offsets: Record<number, number> = { 0: 2, 1: 5, 2: 10 };
  const days = offsets[followUpCount] ?? 10;
  const base = new Date(lastContactedDate);
  base.setDate(base.getDate() + days);
  return base.toISOString().split("T")[0];
}
