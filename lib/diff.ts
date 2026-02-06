import type { Diff, Task } from "@/types";

export function diffTask(before: Task | null, after: Task | null): Diff {
  const diff: Diff = {};
  if (!before && after) {
    Object.entries(after).forEach(([key, value]) => {
      diff[key] = { before: null, after: value };
    });
    return diff;
  }
  if (before && !after) {
    Object.entries(before).forEach(([key, value]) => {
      diff[key] = { before: value, after: null };
    });
    return diff;
  }
  if (!before || !after) return diff;

  (Object.keys(after) as (keyof Task)[]).forEach((key) => {
    const beforeValue = before[key];
    const afterValue = after[key];
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      diff[key] = { before: beforeValue ?? null, after: afterValue ?? null };
    }
  });
  return diff;
}

