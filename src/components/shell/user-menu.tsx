"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, Shield, TreePine, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions/auth.actions";
import { clearCachedPages } from "@/components/pwa/service-worker-registrar";
import type { Locale } from "@/i18n/config";

export type UserMenuLabels = {
  dashboard: string;
  trees: string;
  settings: string;
  admin: string;
  signOut: string;
  profile: string;
};

export function UserMenu({
  locale,
  name,
  email,
  avatarUrl,
  canAccessAdmin,
  labels,
}: {
  locale: Locale;
  name: string;
  email: string;
  avatarUrl: string | null;
  canAccessAdmin: boolean;
  labels: UserMenuLabels;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={labels.profile}>
          <Avatar className="size-9 border-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials || <UserIcon className="size-4" />}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="py-2">
          <span className="block truncate text-sm font-medium text-foreground">{name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard`}>
            <LayoutDashboard />
            {labels.dashboard}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/trees`}>
            <TreePine />
            {labels.trees}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/settings`}>
            <Settings />
            {labels.settings}
          </Link>
        </DropdownMenuItem>
        {canAccessAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/admin`}>
                <Shield />
                {labels.admin}
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await clearCachedPages();
              await signOutAction(locale);
              router.refresh();
            });
          }}
        >
          <LogOut />
          {labels.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
