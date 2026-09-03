import { Home, Sprout, TentTree, BarChart3, Map, LayoutGrid } from "lucide-react";

export const PRIMARY_NAV = [
  { key: "home", href: "", icon: Home },
  { key: "campaigns", href: "/campaigns", icon: TentTree },
  { key: "plant", href: "/plant", icon: Sprout },
  { key: "impact", href: "/impact", icon: BarChart3 },
  { key: "map", href: "/map", icon: Map },
  { key: "wilayas", href: "/wilayas", icon: LayoutGrid },
] as const;

/** The five destinations shown in the mobile tab bar. */
export const MOBILE_NAV = ["home", "campaigns", "plant", "impact", "profile"] as const;
