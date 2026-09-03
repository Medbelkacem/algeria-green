import "server-only";
import QRCode from "qrcode";

/**
 * Renders a QR code as an inline SVG string so it needs no client JavaScript
 * and no external image request.
 */
export async function qrCodeSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#0b3d2a", light: "#ffffff" },
  });
}
