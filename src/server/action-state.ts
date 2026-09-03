/**
 * Shared shape for every server action. Messages are translation keys so the
 * client renders them in the active language.
 */
export type FieldErrors = Record<string, string>;

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  values?: Record<string, string | number>;
  fieldErrors?: FieldErrors;
  data?: Record<string, string> | null;
};

export const idleState: ActionState = { status: "idle" };

export function errorState(message: string, extra?: Partial<ActionState>): ActionState {
  return { status: "error", message, ...extra };
}

export function successState(message: string, extra?: Partial<ActionState>): ActionState {
  return { status: "success", message, ...extra };
}

type ZodLikeIssue = { path: PropertyKey[]; message: string };

/** Maps Zod issues onto field names, keeping the first error per field. */
export function fieldErrorsFrom(issues: ZodLikeIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "_form");
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
