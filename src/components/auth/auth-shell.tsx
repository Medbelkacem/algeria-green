import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  locale,
  brand,
  title,
  subtitle,
  children,
  footer,
}: {
  locale: Locale;
  brand: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-hero flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href={`/${locale}`} aria-label={brand}>
            <BrandMark name={brand} />
          </Link>
        </div>
        <Card className="shadow-lg">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
          </CardContent>
        </Card>
        {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
