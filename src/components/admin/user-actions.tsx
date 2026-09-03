"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setUserRoleAction, setUserStatusAction } from "@/server/actions/user.actions";
import { idleState, type ActionState } from "@/server/action-state";

type Role = "USER" | "ASSOCIATION" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export function UserActions({
  userId,
  status,
  role,
  locale,
  canChangeRole,
  assignableRoles,
  isSelf,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
  role: Role;
  locale: Locale;
  canChangeRole: boolean;
  assignableRoles: Role[];
  isSelf: boolean;
}) {
  const t = useTranslator(locale);
  const router = useRouter();
  const [statusState, statusAction] = useActionState<ActionState, FormData>(setUserStatusAction, idleState);
  const [roleState, roleAction] = useActionState<ActionState, FormData>(setUserRoleAction, idleState);
  const statusFormRef = React.useRef<HTMLFormElement>(null);
  const roleFormRef = React.useRef<HTMLFormElement>(null);
  const [nextRole, setNextRole] = React.useState<Role>(role);

  React.useEffect(() => {
    for (const state of [statusState, roleState]) {
      if (state.status === "success") {
        toast.success(t(state.message ?? "actions.confirm"));
        router.refresh();
      } else if (state.status === "error") {
        toast.error(t(state.message ?? "errors.generic", state.values));
      }
    }
  }, [statusState, roleState, router, t]);

  // An account may never act on itself here — the server enforces this too.
  if (isSelf) {
    return <span className="text-xs text-muted-foreground">{t("misc.none")}</span>;
  }

  return (
    <>
      <form ref={statusFormRef} action={statusAction} className="hidden">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="status" value={status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
      </form>
      <form ref={roleFormRef} action={roleAction} className="hidden">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="role" value={nextRole} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("admin.action")}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuLabel>{t("admin.userStatus")}</DropdownMenuLabel>
          <DropdownMenuItem
            variant={status === "ACTIVE" ? "destructive" : "default"}
            onSelect={() => statusFormRef.current?.requestSubmit()}
          >
            {status === "ACTIVE" ? <UserX /> : <UserCheck />}
            {status === "ACTIVE" ? t("actions.suspend") : t("actions.reactivate")}
          </DropdownMenuItem>

          {canChangeRole && assignableRoles.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t("admin.role")}</DropdownMenuLabel>
              {assignableRoles.map((option) => (
                <DropdownMenuItem
                  key={option}
                  disabled={option === role}
                  onSelect={() => {
                    setNextRole(option);
                    requestAnimationFrame(() => roleFormRef.current?.requestSubmit());
                  }}
                >
                  <ShieldCheck />
                  {t(`role.${option}`)}
                </DropdownMenuItem>
              ))}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
