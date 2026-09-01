"use client";

import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LandingGalleryFieldEditor } from "@/features/landing-cms/landing-gallery-field";
import { LANDING_CONTENT_ICONS } from "@/features/landing-cms/landing-icon-map";
import { LandingImageFieldEditor } from "@/features/landing-cms/landing-image-field";
import { LandingMediaFieldEditor } from "@/features/landing-cms/landing-media-field";
import {
  ICON_KEYS,
  type LandingContent,
  type LandingMediaField,
  type LandingSectionKey,
  SECTION_LABELS,
} from "@/features/landing-cms/types";
import {
  useLandingCms,
  usePublishLanding,
  useUpdateLandingDraft,
} from "@/hooks/use-landing-cms";
import { cn } from "@/lib/utils";

type EditorTab =
  | "layout"
  | "header"
  | "footer"
  | "hero"
  | "provaSocial"
  | "solucoes"
  | "projetos"
  | "faq"
  | "ctaFinal"
  | "json";

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "layout", label: "Layout" },
  { id: "header", label: "Header" },
  { id: "footer", label: "Footer" },
  { id: "hero", label: "Hero" },
  { id: "provaSocial", label: "Prova social" },
  { id: "solucoes", label: "Serviços" },
  { id: "projetos", label: "Projetos" },
  { id: "faq", label: "FAQ" },
  { id: "ctaFinal", label: "CTA final" },
  { id: "json", label: "JSON completo" },
];

type SolucaoItem = {
  id: string;
  iconKey: string;
  titulo: string;
  descricao: string;
  descricaoLonga?: string;
  colSpan: string;
  servicoParam: string;
  /** Id do serviço pai (hierarquia). Vazio = topo. */
  parentId?: string;
  imagem?: { url: string; alt?: string };
};

type ProjetoItem = {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  imagens: Array<{ url: string; alt?: string }>;
};

type LogoClienteItem = {
  id: string;
  nome: string;
  imageUrl?: string;
  isPlaceholder?: boolean;
};

type HeroSlideItem = {
  id: string;
  eyebrow?: string;
  headline: string;
  highlight?: string;
  accentText?: string;
  subheadline?: string;
  ctas: Array<{ label: string; href: string; variant: string }>;
  media: LandingMediaField;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function LandingCmsEditor() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useLandingCms(slug!);
  const saveDraft = useUpdateLandingDraft(slug!);
  const publish = usePublishLanding(slug!);

  const [tab, setTab] = useState<EditorTab>("layout");
  const [draft, setDraft] = useState<LandingContent | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const serverUpdatedAt = data?.landing.updatedAt;

  useEffect(() => {
    if (!data?.landing.draft) return;
    setDraft(structuredClone(data.landing.draft));
    setJsonText(JSON.stringify(data.landing.draft, null, 2));
    // Só re-hidrata quando o servidor confirma nova versão (evita apagar edição local)
  }, [serverUpdatedAt]);

  function updateHeroMedia(media: LandingMediaField) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        hero: { ...prev.hero, media },
      };
      saveDraft.mutate(next);
      return next;
    });
  }

  const landingUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    return base;
  }, []);

  const previewUrl = useMemo(() => {
    const secret = process.env.NEXT_PUBLIC_LANDING_PREVIEW_SECRET;
    if (!secret) return null;
    return `${landingUrl}/api/preview?secret=${encodeURIComponent(secret)}`;
  }, [landingUrl]);

  if (isLoading || !draft) {
    return (
      <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando CMS da landing…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 text-sm text-destructive">
        Erro ao carregar CMS: {(error as Error).message}
      </div>
    );
  }

  const sortedSections = [...draft.layout.sections].sort(
    (a, b) => a.order - b.order,
  );

  function moveSection(key: LandingSectionKey, direction: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev;
      const sections = [...prev.layout.sections].sort(
        (a, b) => a.order - b.order,
      );
      const index = sections.findIndex((s) => s.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sections.length) return prev;
      const swapped = [...sections];
      const tmp = swapped[index]!;
      swapped[index] = swapped[target]!;
      swapped[target] = tmp;
      return {
        ...prev,
        layout: {
          sections: swapped.map((s, i) => ({ ...s, order: i + 1 })),
        },
      };
    });
  }

  function toggleVisible(key: LandingSectionKey, visible: boolean) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        layout: {
          sections: prev.layout.sections.map((s) =>
            s.key === key ? { ...s, visible } : s,
          ),
        },
      };
    });
  }

  function handleSave() {
    let content = draft!;
    if (tab === "json") {
      try {
        content = JSON.parse(jsonText) as LandingContent;
        setJsonError(null);
        setDraft(content);
      } catch {
        setJsonError("JSON inválido");
        return;
      }
    }
    saveDraft.mutate(content);
  }

  function handlePublish() {
    saveDraft.mutate(draft!, {
      onSuccess: () => publish.mutate(),
    });
  }

  const header = draft.header as {
    brandName: string;
    portalUrl: string;
    primaryCta: { label: string; href: string };
    portalCta: { label: string };
    topBar?: { phone: string; email: string; location: string };
  };
  const footer = draft.footer as {
    brandName: string;
    tagline: string;
    legalLine: string;
    privacyHref: string;
    privacyLabel: string;
  };
  const hero = draft.hero as {
    layout?: "split" | "immersive";
    eyebrow: string;
    headline: string;
    subheadline: string;
    media: LandingMediaField;
    carousel?: {
      enabled: boolean;
      autoplay: boolean;
      intervalMs: number;
      loop: boolean;
    };
    wave?: { enabled: boolean };
    slides?: HeroSlideItem[];
  };
  const heroMedia: LandingMediaField = {
    kind: hero.media?.kind ?? "none",
    src: hero.media?.src,
    alt: hero.media?.alt,
    poster: hero.media?.poster,
    motion: hero.media?.motion ?? "none",
  };
  const faq = draft.faq as {
    eyebrow: string;
    title: string;
    items: Array<{ id: string; pergunta: string; resposta: string }>;
  };
  const ctaFinal = draft.ctaFinal as {
    eyebrow: string;
    title: string;
    description: string;
  };
  const solucoes = draft.solucoes as {
    eyebrow: string;
    title: string;
    items: SolucaoItem[];
  };
  const provaSocial = draft.provaSocial as {
    metrics: Array<{
      id: string;
      valor: number;
      sufixo?: string;
      label: string;
    }>;
    logosEyebrow: string;
    logos: LogoClienteItem[];
    logosCarousel?: {
      enabled: boolean;
      autoplay: boolean;
      intervalMs: number;
      loop: boolean;
    };
  };
  const logosCarousel = provaSocial.logosCarousel ?? {
    enabled: true,
    autoplay: true,
    intervalMs: 5000,
    loop: true,
  };
  const projetosContent = (draft.projetos ?? {
    eyebrow: "Nosso trabalho",
    title: "Projetos",
    description: "",
    items: [],
  }) as {
    eyebrow: string;
    title: string;
    description: string;
    items: ProjetoItem[];
  };

  function updateHeroSlide(index: number, patch: Partial<HeroSlideItem>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.hero as { slides?: HeroSlideItem[] };
      const slides = [...(current.slides ?? [])];
      slides[index] = { ...slides[index]!, ...patch };
      return { ...prev, hero: { ...prev.hero, slides } };
    });
  }

  function addHeroSlide() {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.hero as { slides?: HeroSlideItem[] };
      const slides = [...(current.slides ?? [])];
      slides.push({
        id: `slide-${slides.length + 1}`,
        headline: "Novo slide",
        ctas: [],
        media: { kind: "none", motion: "none" },
      });
      return { ...prev, hero: { ...prev.hero, slides, layout: "immersive" } };
    });
  }

  function removeHeroSlide(index: number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.hero as { slides?: HeroSlideItem[] };
      const slides = (current.slides ?? []).filter((_, i) => i !== index);
      return { ...prev, hero: { ...prev.hero, slides } };
    });
  }

  function moveHeroSlide(index: number, dir: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.hero as { slides?: HeroSlideItem[] };
      const slides = [...(current.slides ?? [])];
      const target = index + dir;
      if (target < 0 || target >= slides.length) return prev;
      [slides[index], slides[target]] = [slides[target]!, slides[index]!];
      return { ...prev, hero: { ...prev.hero, slides } };
    });
  }

  const heroSlides = hero.slides ?? [];
  const heroCarousel = hero.carousel ?? {
    enabled: true,
    autoplay: true,
    intervalMs: 6500,
    loop: true,
  };

  function updateSolucaoItem(index: number, patch: Partial<SolucaoItem>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.solucoes as { items: SolucaoItem[] };
      const items = [...current.items];
      items[index] = { ...items[index]!, ...patch };
      return { ...prev, solucoes: { ...prev.solucoes, items } };
    });
  }

  function addSolucao() {
    const novo: SolucaoItem = {
      id: "",
      iconKey: ICON_KEYS[0],
      titulo: "",
      descricao: "",
      descricaoLonga: "",
      colSpan: "lg:col-span-4",
      servicoParam: "",
      parentId: "",
    };
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.solucoes as { items: SolucaoItem[] };
      return {
        ...prev,
        solucoes: { ...prev.solucoes, items: [...current.items, novo] },
      };
    });
  }

  function removeSolucao(index: number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.solucoes as { items: SolucaoItem[] };
      return {
        ...prev,
        solucoes: {
          ...prev.solucoes,
          items: current.items.filter((_, i) => i !== index),
        },
      };
    });
  }

  function updateProvaSocial(patch: Partial<typeof provaSocial>) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        provaSocial: { ...prev.provaSocial, ...patch },
      };
    });
  }

  function updateLogoItem(index: number, patch: Partial<LogoClienteItem>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.provaSocial as { logos: LogoClienteItem[] };
      const logos = [...current.logos];
      logos[index] = { ...logos[index]!, ...patch };
      return { ...prev, provaSocial: { ...prev.provaSocial, logos } };
    });
  }

  function addLogoItem() {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.provaSocial as { logos: LogoClienteItem[] };
      const n = current.logos.length + 1;
      return {
        ...prev,
        provaSocial: {
          ...prev.provaSocial,
          logos: [
            ...current.logos,
            {
              id: `logo-${n}`,
              nome: "Nome da empresa",
              isPlaceholder: true,
            },
          ],
        },
      };
    });
  }

  function removeLogoItem(index: number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.provaSocial as { logos: LogoClienteItem[] };
      return {
        ...prev,
        provaSocial: {
          ...prev.provaSocial,
          logos: current.logos.filter((_, i) => i !== index),
        },
      };
    });
  }

  function moveLogoItem(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev.provaSocial as { logos: LogoClienteItem[] };
      const logos = [...current.logos];
      const target = index + direction;
      if (target < 0 || target >= logos.length) return prev;
      const tmp = logos[index]!;
      logos[index] = logos[target]!;
      logos[target] = tmp;
      return { ...prev, provaSocial: { ...prev.provaSocial, logos } };
    });
  }

  function updateProjetos(next: Partial<typeof projetosContent>) {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, projetos: { ...projetosContent, ...next } };
    });
  }

  function updateProjetoItem(index: number, patch: Partial<ProjetoItem>) {
    const items = [...projetosContent.items];
    items[index] = { ...items[index]!, ...patch };
    updateProjetos({ items });
  }

  function addProjeto() {
    const novo: ProjetoItem = {
      id: `projeto-${Date.now()}`,
      categoria: solucoes.items[0]?.id ?? "",
      titulo: "",
      descricao: "",
      imagens: [],
    };
    updateProjetos({ items: [...projetosContent.items, novo] });
  }

  function removeProjeto(index: number) {
    updateProjetos({ items: projetosContent.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">CMS da Landing</h1>
          <p className="text-sm text-muted-foreground">
            Edite o conteúdo, salve o rascunho e clique em{" "}
            <strong>Publicar</strong> para atualizar o site. Só o conteúdo
            publicado aparece na landing (salvo em modo preview).
          </p>
          {data?.landing.hasPublished && data.landing.publishedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Última publicação:{" "}
              {new Date(data.landing.publishedAt).toLocaleString("pt-BR")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-600">
              Ainda não há versão publicada.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={landingUrl} target="_blank" rel="noreferrer">
              Abrir site
              <ExternalLink className="size-4" />
            </a>
          </Button>
          {previewUrl ? (
            <Button variant="outline" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Preview draft
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={saveDraft.isPending}
          >
            {saveDraft.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Salvar rascunho
          </Button>
          <Button onClick={handlePublish} disabled={publish.isPending}>
            {publish.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Publicar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => {
              if (item.id === "json" && draft) {
                setJsonText(JSON.stringify(draft, null, 2));
              }
              setTab(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "layout" && (
        <Card>
          <CardHeader>
            <CardTitle>Ordem e visibilidade</CardTitle>
            <CardDescription>
              Controle quais seções aparecem e em qual ordem na home.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedSections.map((section, index) => (
              <div
                key={section.key}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">
                    {SECTION_LABELS[section.key]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={section.visible}
                    onCheckedChange={(v) => toggleVisible(section.key, v)}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => moveSection(section.key, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => moveSection(section.key, 1)}
                    disabled={index === sortedSections.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "header" && (
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Marca">
              <Input
                value={header.brandName}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    header: { ...draft.header, brandName: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="URL do portal">
              <Input
                value={header.portalUrl}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    header: { ...draft.header, portalUrl: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="CTA principal">
              <Input
                value={header.primaryCta.label}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    header: {
                      ...draft.header,
                      primaryCta: {
                        ...header.primaryCta,
                        label: e.target.value,
                      },
                    },
                  })
                }
              />
            </Field>
            <Field label="CTA portal">
              <Input
                value={header.portalCta.label}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    header: {
                      ...draft.header,
                      portalCta: {
                        ...header.portalCta,
                        label: e.target.value,
                      },
                    },
                  })
                }
              />
            </Field>
            <div className="md:col-span-2 border-t pt-4">
              <p className="mb-3 text-sm font-medium">Tarja superior (contato)</p>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Telefone">
                  <Input
                    value={header.topBar?.phone ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        header: {
                          ...draft.header,
                          topBar: {
                            phone: e.target.value,
                            email: header.topBar?.email ?? "",
                            location: header.topBar?.location ?? "",
                          },
                        },
                      })
                    }
                    placeholder="(96) 98113-9394"
                  />
                </Field>
                <Field label="E-mail">
                  <Input
                    value={header.topBar?.email ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        header: {
                          ...draft.header,
                          topBar: {
                            phone: header.topBar?.phone ?? "",
                            email: e.target.value,
                            location: header.topBar?.location ?? "",
                          },
                        },
                      })
                    }
                    placeholder="contato@empresa.com.br"
                  />
                </Field>
                <Field label="Localização">
                  <Input
                    value={header.topBar?.location ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        header: {
                          ...draft.header,
                          topBar: {
                            phone: header.topBar?.phone ?? "",
                            email: header.topBar?.email ?? "",
                            location: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Macapá — AP"
                  />
                </Field>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "footer" && (
        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Marca">
              <Input
                value={footer.brandName}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    footer: { ...draft.footer, brandName: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Tagline">
              <Textarea
                value={footer.tagline}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    footer: { ...draft.footer, tagline: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Linha legal">
              <Input
                value={footer.legalLine}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    footer: { ...draft.footer, legalLine: e.target.value },
                  })
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Label privacidade">
                <Input
                  value={footer.privacyLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        privacyLabel: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Href privacidade">
                <Input
                  value={footer.privacyHref}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footer: {
                        ...draft.footer,
                        privacyHref: e.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "hero" && (
        <Card>
          <CardHeader>
            <CardTitle>Hero</CardTitle>
            <CardDescription>
              Layout imersivo com carrossel full-bleed (imagem/vídeo), textos em
              overlay e curvas decorativas. Métricas de confiança vêm do bloco
              legado abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Layout">
                <Select
                  value={hero.layout ?? "split"}
                  onValueChange={(v) =>
                    setDraft({
                      ...draft,
                      hero: { ...draft.hero, layout: v },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immersive">Imersivo (full-bleed + carrossel)</SelectItem>
                    <SelectItem value="split">Split (texto + card lateral)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Curvas decorativas">
                <div className="flex h-9 items-center gap-2">
                  <Switch
                    checked={hero.wave?.enabled ?? true}
                    onCheckedChange={(enabled) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, wave: { enabled } },
                      })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Faixas onduladas transparentes integradas ao vídeo
                  </span>
                </div>
              </Field>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium">Carrossel</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Ativo">
                  <Switch
                    checked={heroCarousel.enabled}
                    onCheckedChange={(enabled) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          carousel: { ...heroCarousel, enabled },
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Autoplay">
                  <Switch
                    checked={heroCarousel.autoplay}
                    onCheckedChange={(autoplay) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          carousel: { ...heroCarousel, autoplay },
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Intervalo (ms)">
                  <Input
                    type="number"
                    min={3000}
                    max={15000}
                    step={500}
                    value={heroCarousel.intervalMs}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          carousel: {
                            ...heroCarousel,
                            intervalMs: Number(e.target.value) || 6500,
                          },
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Loop">
                  <Switch
                    checked={heroCarousel.loop}
                    onCheckedChange={(loop) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          carousel: { ...heroCarousel, loop },
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Slides ({heroSlides.length})</p>
                <Button type="button" variant="outline" size="sm" onClick={addHeroSlide}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar slide
                </Button>
              </div>

              {heroSlides.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum slide — a landing usa o conteúdo legado (headline única).
                  Adicione slides ou publique o default atualizado.
                </p>
              )}

              {heroSlides.map((slide, index) => (
                <div key={slide.id || index} className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Slide {index + 1}</p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveHeroSlide(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === heroSlides.length - 1}
                        onClick={() => moveHeroSlide(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHeroSlide(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="ID (único)">
                      <Input
                        value={slide.id}
                        onChange={(e) => updateHeroSlide(index, { id: e.target.value })}
                      />
                    </Field>
                    <Field label="Eyebrow">
                      <Input
                        value={slide.eyebrow ?? ""}
                        onChange={(e) => updateHeroSlide(index, { eyebrow: e.target.value })}
                      />
                    </Field>
                    <Field label="Headline">
                      <Textarea
                        value={slide.headline}
                        onChange={(e) => updateHeroSlide(index, { headline: e.target.value })}
                      />
                    </Field>
                    <Field label="Destaque (highlight)">
                      <Input
                        value={slide.highlight ?? ""}
                        onChange={(e) => updateHeroSlide(index, { highlight: e.target.value })}
                        placeholder="Palavra curta (faixa verde) ou frase (faixa glass)"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Até 28 caracteres → faixa verde sólida. Mais longo → faixa
                        glass com borda verde (melhor legibilidade).
                      </p>
                    </Field>
                    <Field label="Texto decorativo (direita)">
                      <Input
                        value={slide.accentText ?? ""}
                        onChange={(e) =>
                          updateHeroSlide(index, { accentText: e.target.value })
                        }
                        placeholder="ex.: SST, ESG, NR-1"
                      />
                    </Field>
                  </div>
                  <Field label="Subheadline">
                    <Textarea
                      value={slide.subheadline ?? ""}
                      onChange={(e) => updateHeroSlide(index, { subheadline: e.target.value })}
                    />
                  </Field>
                  <LandingMediaFieldEditor
                    org={slug!}
                    value={slide.media}
                    onChange={(media) => updateHeroSlide(index, { media })}
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Conteúdo legado (fallback split / slide único)
              </p>
              <div className="grid gap-4">
                <Field label="Eyebrow">
                  <Input
                    value={hero.eyebrow}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, eyebrow: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Headline">
                  <Textarea
                    value={hero.headline}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, headline: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Subheadline">
                  <Textarea
                    value={hero.subheadline}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, subheadline: e.target.value },
                      })
                    }
                  />
                </Field>
                <LandingMediaFieldEditor
                  org={slug!}
                  value={heroMedia}
                  onChange={updateHeroMedia}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Salve o rascunho e clique em <strong>Publicar</strong> para refletir na
              landing pública.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === "provaSocial" && (
        <Card>
          <CardHeader>
            <CardTitle>Prova social</CardTitle>
            <CardDescription>
              Métricas e logos de empresas parceiras. Até 6 logos aparecem por vez;
              se houver mais, a landing exibe carrossel automático.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field label="Título da faixa de logos">
              <Input
                value={provaSocial.logosEyebrow}
                onChange={(e) => updateProvaSocial({ logosEyebrow: e.target.value })}
                placeholder="Confiado por empresas de diferentes setores"
              />
            </Field>

            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Carrossel de logos</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Ativo quando há mais de 6 logos cadastrados.
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={logosCarousel.enabled}
                    onCheckedChange={(enabled) =>
                      updateProvaSocial({
                        logosCarousel: { ...logosCarousel, enabled },
                      })
                    }
                  />
                  <span className="text-sm">Habilitado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={logosCarousel.autoplay}
                    onCheckedChange={(autoplay) =>
                      updateProvaSocial({
                        logosCarousel: { ...logosCarousel, autoplay },
                      })
                    }
                  />
                  <span className="text-sm">Autoplay</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={logosCarousel.loop}
                    onCheckedChange={(loop) =>
                      updateProvaSocial({
                        logosCarousel: { ...logosCarousel, loop },
                      })
                    }
                  />
                  <span className="text-sm">Loop</span>
                </div>
                <Field label="Intervalo (ms)">
                  <Input
                    type="number"
                    min={2000}
                    step={500}
                    className="w-28"
                    value={logosCarousel.intervalMs}
                    onChange={(e) =>
                      updateProvaSocial({
                        logosCarousel: {
                          ...logosCarousel,
                          intervalMs: Number(e.target.value) || 5000,
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Logos ({provaSocial.logos.length})
                </p>
                <Button type="button" size="sm" variant="secondary" onClick={addLogoItem}>
                  <Plus className="size-4" />
                  Adicionar logo
                </Button>
              </div>

              {provaSocial.logos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum logo — adicione empresas parceiras com upload de imagem PNG/SVG.
                </p>
              )}

              {provaSocial.logos.map((logo, index) => (
                <div key={`${logo.id}-${index}`} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Logo {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveLogoItem(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={index === provaSocial.logos.length - 1}
                        onClick={() => moveLogoItem(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeLogoItem(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="ID (único)">
                      <Input
                        value={logo.id}
                        onChange={(e) => updateLogoItem(index, { id: e.target.value })}
                        placeholder="ex.: amcel"
                      />
                    </Field>
                    <Field label="Nome da empresa">
                      <Input
                        value={logo.nome}
                        onChange={(e) => updateLogoItem(index, { nome: e.target.value })}
                      />
                    </Field>
                  </div>
                  <LandingImageFieldEditor
                    org={slug!}
                    value={
                      logo.imageUrl
                        ? { url: logo.imageUrl, alt: logo.nome }
                        : undefined
                    }
                    onChange={(img) =>
                      updateLogoItem(index, {
                        imageUrl: img?.url,
                        isPlaceholder: !img?.url,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "solucoes" && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços (página /servicos, dropdown do menu e bloco Soluções da home)</CardTitle>
            <CardDescription>
              Crie, edite e remova os serviços oferecidos. O ID e o servicoParam
              precisam ser únicos e sem espaços — são usados como âncora
              (/servicos#id) e no formulário de contato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eyebrow">
                <Input
                  value={solucoes.eyebrow}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      solucoes: { ...draft.solucoes, eyebrow: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Título">
                <Input
                  value={solucoes.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      solucoes: { ...draft.solucoes, title: e.target.value },
                    })
                  }
                />
              </Field>
            </div>

            {solucoes.items.map((item, index) => {
              const idDup =
                Boolean(item.id) &&
                solucoes.items.some((other, j) => j !== index && other.id === item.id)
              return (
              <div key={index} className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="ID / âncora (ex.: seguranca)">
                    <Input
                      value={item.id}
                      onChange={(e) => updateSolucaoItem(index, { id: e.target.value })}
                      className={idDup ? "border-destructive" : undefined}
                    />
                    {idDup ? (
                      <p className="mt-1 text-xs text-destructive">
                        Id duplicado — use um valor único (ex.: pgr).
                      </p>
                    ) : null}
                  </Field>
                  <Field label="servicoParam (formulário de contato)">
                    <Input
                      value={item.servicoParam}
                      onChange={(e) =>
                        updateSolucaoItem(index, { servicoParam: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="Serviço pai (hierarquia)">
                  <Select
                    value={item.parentId || "__root__"}
                    onValueChange={(v) =>
                      updateSolucaoItem(index, {
                        parentId: v === "__root__" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Nenhum (serviço de topo)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">
                        Nenhum (serviço de topo)
                      </SelectItem>
                      {solucoes.items
                        .filter((other) => other.id && other.id !== item.id)
                        .map((other) => (
                          <SelectItem key={other.id} value={other.id}>
                            {other.titulo || other.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ex.: PGR com pai &quot;seguranca&quot; aparece sob Segurança do
                    Trabalho.
                  </p>
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Título do serviço">
                    <Input
                      value={item.titulo}
                      onChange={(e) => updateSolucaoItem(index, { titulo: e.target.value })}
                    />
                  </Field>
                  <Field label="Ícone">
                    <Select
                      value={item.iconKey}
                      onValueChange={(v) => updateSolucaoItem(index, { iconKey: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ícone" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_KEYS.map((key) => {
                          const Icon = LANDING_CONTENT_ICONS[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span>{key}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Descrição curta (card)">
                  <Textarea
                    value={item.descricao}
                    onChange={(e) => updateSolucaoItem(index, { descricao: e.target.value })}
                  />
                </Field>
                <Field label="Descrição estendida (página /servicos)">
                  <Textarea
                    value={item.descricaoLonga ?? ""}
                    onChange={(e) =>
                      updateSolucaoItem(index, { descricaoLonga: e.target.value })
                    }
                    placeholder="Se vazio, a página /servicos usa a descrição curta"
                  />
                </Field>
                <Field label="Largura do card na home (colSpan Tailwind)">
                  <Input
                    value={item.colSpan}
                    onChange={(e) => updateSolucaoItem(index, { colSpan: e.target.value })}
                    placeholder="ex.: lg:col-span-4"
                  />
                </Field>
                <LandingImageFieldEditor
                  org={slug!}
                  value={item.imagem}
                  onChange={(imagem) => updateSolucaoItem(index, { imagem })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeSolucao(index)}
                >
                  <Trash2 className="size-4" />
                  Remover serviço
                </Button>
              </div>
              )
            })}

            <Button type="button" variant="secondary" onClick={addSolucao}>
              <Plus className="size-4" />
              Adicionar serviço
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "projetos" && (
        <Card>
          <CardHeader>
            <CardTitle>Projetos (página /projetos)</CardTitle>
            <CardDescription>
              Cada projeto tem uma categoria (mesmo serviço prestado), descrição e
              uma galeria de fotos com upload direto para o MinIO.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eyebrow">
                <Input
                  value={projetosContent.eyebrow}
                  onChange={(e) => updateProjetos({ eyebrow: e.target.value })}
                />
              </Field>
              <Field label="Título">
                <Input
                  value={projetosContent.title}
                  onChange={(e) => updateProjetos({ title: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                value={projetosContent.description}
                onChange={(e) => updateProjetos({ description: e.target.value })}
              />
            </Field>

            {projetosContent.items.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Título do projeto">
                    <Input
                      value={item.titulo}
                      onChange={(e) => updateProjetoItem(index, { titulo: e.target.value })}
                    />
                  </Field>
                  <Field label="Categoria (serviço)">
                    <Select
                      value={item.categoria}
                      onValueChange={(v) => updateProjetoItem(index, { categoria: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {solucoes.items.map((svc) => (
                          <SelectItem key={svc.id} value={svc.id}>
                            {svc.titulo || svc.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Descrição">
                  <Textarea
                    value={item.descricao}
                    onChange={(e) => updateProjetoItem(index, { descricao: e.target.value })}
                  />
                </Field>
                <LandingGalleryFieldEditor
                  org={slug!}
                  value={item.imagens ?? []}
                  onChange={(imagens) => updateProjetoItem(index, { imagens })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeProjeto(index)}
                >
                  <Trash2 className="size-4" />
                  Remover projeto
                </Button>
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addProjeto}>
              <Plus className="size-4" />
              Adicionar projeto
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "faq" && (
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>
              Edite títulos e respostas. Para incluir/remover itens use a aba
              JSON completo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Eyebrow">
              <Input
                value={faq.eyebrow}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    faq: { ...draft.faq, eyebrow: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Título">
              <Input
                value={faq.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    faq: { ...draft.faq, title: e.target.value },
                  })
                }
              />
            </Field>
            {faq.items.map((item, index) => (
              <div
                key={item.id}
                className="space-y-2 rounded-md border p-3"
              >
                <Field label={`Pergunta ${index + 1}`}>
                  <Input
                    value={item.pergunta}
                    onChange={(e) => {
                      const items = [...faq.items];
                      items[index] = {
                        ...item,
                        pergunta: e.target.value,
                      };
                      setDraft({
                        ...draft,
                        faq: { ...draft.faq, items },
                      });
                    }}
                  />
                </Field>
                <Field label="Resposta">
                  <Textarea
                    value={item.resposta}
                    onChange={(e) => {
                      const items = [...faq.items];
                      items[index] = {
                        ...item,
                        resposta: e.target.value,
                      };
                      setDraft({
                        ...draft,
                        faq: { ...draft.faq, items },
                      });
                    }}
                  />
                </Field>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "ctaFinal" && (
        <Card>
          <CardHeader>
            <CardTitle>CTA final / Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Eyebrow">
              <Input
                value={ctaFinal.eyebrow}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ctaFinal: { ...draft.ctaFinal, eyebrow: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Título">
              <Input
                value={ctaFinal.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ctaFinal: { ...draft.ctaFinal, title: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                value={ctaFinal.description}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ctaFinal: {
                      ...draft.ctaFinal,
                      description: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {tab === "json" && (
        <Card>
          <CardHeader>
            <CardTitle>JSON completo</CardTitle>
            <CardDescription>
              Edição avançada de todas as seções (pilares, soluções, depoimentos,
              etc.).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              className={cn(
                "min-h-[480px] font-mono text-xs",
                jsonError && "border-destructive",
              )}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
            />
            {jsonError ? (
              <p className="text-sm text-destructive">{jsonError}</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
