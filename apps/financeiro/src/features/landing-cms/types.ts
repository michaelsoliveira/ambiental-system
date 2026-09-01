export type LandingSectionKey =
  | "hero"
  | "provaSocial"
  | "pilares"
  | "solucoes"
  | "portalCliente"
  | "segmentos"
  | "diferenciais"
  | "depoimentos"
  | "abrangencia"
  | "comoFunciona"
  | "faq"
  | "ctaFinal";

export type MediaKind = "none" | "image" | "video";
export type MediaMotion = "none" | "kenburns" | "parallax";

export type LandingMediaField = {
  kind: MediaKind;
  src?: string;
  alt?: string;
  poster?: string;
  motion: MediaMotion;
};

export type LandingMediaLibraryItem = {
  key: string;
  url: string;
  kind: "image" | "video";
  size: number;
  lastModified: string | null;
  etag?: string;
};

export type LandingContent = {
  meta?: {
    updatedAt?: string;
    source?: string;
    preview?: boolean;
  };
  layout: {
    sections: Array<{
      key: LandingSectionKey;
      visible: boolean;
      order: number;
    }>;
  };
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  hero: Record<string, unknown>;
  provaSocial: Record<string, unknown>;
  pilares: Record<string, unknown>;
  solucoes: Record<string, unknown>;
  portalCliente: Record<string, unknown>;
  segmentos: Record<string, unknown>;
  diferenciais: Record<string, unknown>;
  depoimentos: Record<string, unknown>;
  abrangencia: Record<string, unknown>;
  comoFunciona: Record<string, unknown>;
  faq: Record<string, unknown>;
  ctaFinal: Record<string, unknown>;
  /** Página /projetos — não é uma seção da home, por isso fora de `layout.sections`. */
  projetos?: Record<string, unknown>;
};

export type LandingCmsResponse = {
  landing: {
    id: string;
    organizationId: string;
    draft: LandingContent;
    published: LandingContent | null;
    publishedAt: string | null;
    updatedAt: string;
    hasPublished: boolean;
  };
};

export const SECTION_LABELS: Record<LandingSectionKey, string> = {
  hero: "Hero",
  provaSocial: "Prova social",
  pilares: "Pilares",
  solucoes: "Soluções",
  portalCliente: "Portal do cliente",
  segmentos: "Segmentos",
  diferenciais: "Diferenciais",
  depoimentos: "Depoimentos",
  abrangencia: "Abrangência",
  comoFunciona: "Como funciona",
  faq: "FAQ",
  ctaFinal: "CTA final",
};

export const MEDIA_KIND_OPTIONS: Array<{
  value: MediaKind;
  label: string;
  hint: string;
}> = [
  { value: "none", label: "Nenhuma", hint: "Mockup padrão do portal" },
  { value: "image", label: "Imagem", hint: "Foto ou ilustração" },
  { value: "video", label: "Vídeo", hint: "MP4 / WebM em loop" },
];

export const MEDIA_MOTION_OPTIONS: Array<{
  value: MediaMotion;
  label: string;
  hint: string;
}> = [
  { value: "none", label: "Estático", hint: "Sem animação" },
  { value: "kenburns", label: "Ken Burns", hint: "Zoom suave na imagem" },
  { value: "parallax", label: "Parallax", hint: "Deslocamento ao scroll" },
];

/** Mesmo conjunto de chaves Lucide aceitas pela ambiental-landing (contentIconKeySchema). */
export const ICON_KEYS = [
  "FileCheck2",
  "ClipboardCheck",
  "ShieldCheck",
  "Recycle",
  "HardHat",
  "Siren",
  "BarChart3",
  "Activity",
  "Factory",
  "Sprout",
  "Building2",
  "Truck",
  "Mountain",
  "Zap",
  "Users",
  "LayoutDashboard",
  "Globe2",
  "AlertTriangle",
  "Clock",
  "Headset",
  "Leaf",
  "Plane",
  "Gauge",
  "Flame",
] as const;

/** Mesmo espaço de ids de `solucoes.items[].id` — categoria do projeto = serviço prestado. */
export const PROJETO_CATEGORIAS = [
  "seguranca",
  "meio-ambiente",
  "aerolevantamento",
  "sismografia",
  "hidrossemeadura",
  "logistica",
  "monitoramento",
  "incendio",
  "mineracao",
] as const;
