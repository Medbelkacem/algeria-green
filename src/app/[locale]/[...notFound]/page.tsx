import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths inside a locale. Without it Next falls back to
 * the bare root 404, which has none of the site chrome and no translation.
 * More specific routes always win over a catch-all, so this only ever runs for
 * genuinely unknown URLs.
 */
export default function LocaleCatchAll(): never {
  notFound();
}
