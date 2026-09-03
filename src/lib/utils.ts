import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Percentage of a target reached, clamped to 0–100 and never dividing by zero. */
export function progressPercent(achieved: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const safeAchieved = Number.isFinite(achieved) && achieved > 0 ? achieved : 0;
  return Math.min(100, Math.round((safeAchieved / target) * 100));
}

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "campaign";
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
