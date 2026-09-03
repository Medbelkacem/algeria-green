import { qrCodeSvg } from "@/lib/qr";
import { CopyButton } from "./copy-button";

export async function QrPanel({
  value,
  title,
  help,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  title: string;
  help?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const svg = await qrCodeSvg(value);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div
        className="mx-auto w-fit rounded-lg bg-white p-2 [&>svg]:size-40 sm:[&>svg]:size-48"
        // The SVG is produced server-side by the qrcode library from a value we
        // control; it contains no user-supplied markup.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {help ? <p className="text-xs leading-relaxed text-muted-foreground">{help}</p> : null}
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs" dir="ltr">
          {value}
        </code>
        <CopyButton value={value} label={copyLabel} copiedLabel={copiedLabel} />
      </div>
    </div>
  );
}
