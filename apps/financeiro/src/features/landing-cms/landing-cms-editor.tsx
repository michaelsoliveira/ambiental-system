"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Loader2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  SECTION_LABELS,
  type LandingContent,
  type LandingSectionKey,
} from "@/features/landing-cms/types";
import {
  useLandingCms,
  usePublishLanding,
  useUpdateLandingDraft,
} from "@/hooks/use-landing-cms";
import { cn } from "@/lib/utils";

type EditorTab = "layout" | "header" | "footer" | "hero" | "faq" | "ctaFinal" | "json";

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "layout", label: "Layout" },
  { id: "header", label: "Header" },
  { id: "footer", label: "Footer" },
  { id: "hero", label: "Hero" },
  { id: "faq", label: "FAQ" },
  { id: "ctaFinal", label: "CTA final" },
  { id: "json", label: "JSON completo" },
];

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

  useEffect(() => {
    if (data?.landing.draft) {
      setDraft(structuredClone(data.landing.draft));
      setJsonText(JSON.stringify(data.landing.draft, null, 2));
    }
  }, [data]);

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
  };
  const footer = draft.footer as {
    brandName: string;
    tagline: string;
    legalLine: string;
    privacyHref: string;
    privacyLabel: string;
  };
  const hero = draft.hero as {
    eyebrow: string;
    headline: string;
    subheadline: string;
    media: { kind: string; src?: string; alt?: string; motion: string };
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
          </CardHeader>
          <CardContent className="grid gap-4">
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Mídia (kind)">
                <Input
                  value={hero.media?.kind ?? "none"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: {
                        ...draft.hero,
                        media: { ...hero.media, kind: e.target.value },
                      },
                    })
                  }
                  placeholder="none | image | video"
                />
              </Field>
              <Field label="Mídia URL">
                <Input
                  value={hero.media?.src ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: {
                        ...draft.hero,
                        media: { ...hero.media, src: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Motion">
                <Input
                  value={hero.media?.motion ?? "none"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      hero: {
                        ...draft.hero,
                        media: { ...hero.media, motion: e.target.value },
                      },
                    })
                  }
                  placeholder="none | kenburns | parallax"
                />
              </Field>
            </div>
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
