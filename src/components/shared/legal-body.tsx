import type { Locale } from "@/i18n/config";
import type { LegalSection } from "@/content/legal";

export function LegalBody({ sections, locale }: { sections: LegalSection[]; locale: Locale }) {
  return (
    <div className="mt-8 space-y-8">
      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{section.heading[locale]}</h2>
          {section.body[locale].map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
