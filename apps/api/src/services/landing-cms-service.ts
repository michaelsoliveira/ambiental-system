import type { Prisma } from "@prisma/client";

import {
  getDefaultLandingContent,
  type LandingContentPayload,
} from "@/lib/default-landing-content";
import { prisma } from "@/lib/prisma";

function asContent(value: unknown): LandingContentPayload {
  return value as LandingContentPayload;
}

export class LandingCmsService {
  async getOrCreate(organizationId: string, userId?: string) {
    const existing = await prisma.landingSite.findUnique({
      where: { organization_id: organizationId },
    });

    if (existing) return existing;

    const draft = getDefaultLandingContent();

    return prisma.landingSite.create({
      data: {
        organization_id: organizationId,
        draft_content: draft as unknown as Prisma.InputJsonValue,
        updated_by_user_id: userId,
      },
    });
  }

  async updateDraft(
    organizationId: string,
    content: LandingContentPayload,
    userId?: string,
  ) {
    await this.getOrCreate(organizationId, userId);

    const next = {
      ...content,
      meta: {
        ...content.meta,
        updatedAt: new Date().toISOString(),
        source: "mixed" as const,
      },
    };

    return prisma.landingSite.update({
      where: { organization_id: organizationId },
      data: {
        draft_content: next as unknown as Prisma.InputJsonValue,
        updated_by_user_id: userId,
      },
    });
  }

  async publish(organizationId: string, userId?: string) {
    const site = await this.getOrCreate(organizationId, userId);
    const draft = asContent(site.draft_content);
    const published = {
      ...draft,
      meta: {
        ...draft.meta,
        updatedAt: new Date().toISOString(),
        source: "mixed" as const,
        preview: false,
      },
    };

    return prisma.landingSite.update({
      where: { organization_id: organizationId },
      data: {
        published_content: published as unknown as Prisma.InputJsonValue,
        published_at: new Date(),
        updated_by_user_id: userId,
      },
    });
  }

  async getPublishedBySlug(slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });
    if (!org) return null;

    const site = await prisma.landingSite.findUnique({
      where: { organization_id: org.id },
    });
    if (!site?.published_content) return null;

    return {
      organization: org,
      content: asContent(site.published_content),
      publishedAt: site.published_at,
    };
  }

  async getDraftBySlug(slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });
    if (!org) return null;

    const site = await this.getOrCreate(org.id);
    return {
      organization: org,
      content: asContent(site.draft_content),
      publishedAt: site.published_at,
      hasPublished: Boolean(site.published_content),
    };
  }
}

export const landingCmsService = new LandingCmsService();
