export function calculateOvercommitment(
  totalMinutes: number,
  thresholdMinutes: number,
): { isOvercommitted: boolean; overcommittedByMinutes: number } {
  const isOvercommitted = totalMinutes > thresholdMinutes;
  return {
    isOvercommitted,
    overcommittedByMinutes: isOvercommitted ? totalMinutes - thresholdMinutes : 0,
  };
}
