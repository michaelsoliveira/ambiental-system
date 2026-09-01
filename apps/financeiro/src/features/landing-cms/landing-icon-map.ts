import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Clock,
  Factory,
  FileCheck2,
  Flame,
  Gauge,
  Globe2,
  HardHat,
  Headset,
  LayoutDashboard,
  Leaf,
  Mountain,
  Plane,
  Recycle,
  ShieldCheck,
  Siren,
  Sprout,
  Truck,
  Users,
  Zap,
} from "lucide-react";

import { ICON_KEYS } from "@/features/landing-cms/types";

export type LandingIconKey = (typeof ICON_KEYS)[number];

/** Mesmo mapa de `ambiental-landing/src/lib/content/icon-map.ts`. */
export const LANDING_CONTENT_ICONS: Record<LandingIconKey, LucideIcon> = {
  FileCheck2,
  ClipboardCheck,
  ShieldCheck,
  Recycle,
  HardHat,
  Siren,
  BarChart3,
  Activity,
  Factory,
  Sprout,
  Building2,
  Truck,
  Mountain,
  Zap,
  Users,
  LayoutDashboard,
  Globe2,
  AlertTriangle,
  Clock,
  Headset,
  Leaf,
  Plane,
  Gauge,
  Flame,
};
