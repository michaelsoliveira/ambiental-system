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
