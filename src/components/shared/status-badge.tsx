import { CheckCircle2, Clock, XCircle, Archive, CalendarClock, Zap, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Translator } from "@/i18n/messages";

type TreeStatus = "PENDING" | "VERIFIED" | "REJECTED" | "ARCHIVED";
type CampaignStatus = "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

/**
 * Status is conveyed by icon + text as well as colour, so it stays readable
 * without colour perception (WCAG 1.4.1).
 */
export function TreeStatusBadge({ status, t }: { status: TreeStatus; t: Translator }) {
  const map = {
    PENDING: { variant: "warning" as const, Icon: Clock },
    VERIFIED: { variant: "success" as const, Icon: CheckCircle2 },
    REJECTED: { variant: "destructive" as const, Icon: XCircle },
    ARCHIVED: { variant: "muted" as const, Icon: Archive },
  }[status];
  const { Icon } = map;
  return (
    <Badge variant={map.variant}>
      <Icon aria-hidden="true" />
      {t(`treeStatus.${status}`)}
    </Badge>
  );
}

export function CampaignStatusBadge({ status, t }: { status: CampaignStatus; t: Translator }) {
  const map = {
    DRAFT: { variant: "muted" as const, Icon: Archive },
    UPCOMING: { variant: "info" as const, Icon: CalendarClock },
    ACTIVE: { variant: "success" as const, Icon: Zap },
    COMPLETED: { variant: "secondary" as const, Icon: CheckCircle2 },
    CANCELLED: { variant: "destructive" as const, Icon: Ban },
  }[status];
  const { Icon } = map;
  return (
    <Badge variant={map.variant}>
      <Icon aria-hidden="true" />
      {t(`campaignStatus.${status}`)}
    </Badge>
  );
}

export function ParticipantStatusBadge({
  status,
  t,
}: {
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
  t: Translator;
}) {
  const map = {
    REGISTERED: { variant: "info" as const, Icon: Clock },
    ATTENDED: { variant: "success" as const, Icon: CheckCircle2 },
    CANCELLED: { variant: "muted" as const, Icon: Ban },
  }[status];
  const { Icon } = map;
  return (
    <Badge variant={map.variant}>
      <Icon aria-hidden="true" />
      {t(`participantStatus.${status}`)}
    </Badge>
  );
}
