import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "الجزائر خضراء — Algeria Green",
    short_name: "Algeria Green",
    description:
      "منصة رقمية للمساهمة في مبادرات التشجير ومتابعة أثرها في الجزائر. A digital platform for tree-planting initiatives across Algeria.",
    id: "/ar",
    start_url: "/ar",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f7fbf8",
    theme_color: "#0b5c39",
    dir: "auto",
    lang: "ar",
    categories: ["lifestyle", "utilities", "social"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "ازرع شجرة", short_name: "ازرع", url: "/ar/plant" },
      { name: "الحملات", short_name: "الحملات", url: "/ar/campaigns" },
      { name: "لوحتي", short_name: "لوحتي", url: "/ar/dashboard" },
    ],
  };
}
