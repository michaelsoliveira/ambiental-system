import { api } from "@/http/api-client";

import type {
  LandingCmsResponse,
  LandingContent,
  LandingMediaLibraryItem,
} from "@/features/landing-cms/types";

export async function getLandingCms(org: string) {
  return api
    .get(`organizations/${org}/landing`)
    .json<LandingCmsResponse>();
}

export async function updateLandingDraft(org: string, content: LandingContent) {
  return api
    .put(`organizations/${org}/landing/draft`, {
      json: { content },
    })
    .json<{ landing: { id: string; updatedAt: string; draft: LandingContent } }>();
}

export async function publishLandingCms(org: string) {
  return api
    .post(`organizations/${org}/landing/publish`)
    .json<{
      landing: {
        id: string;
        publishedAt: string | null;
        published: LandingContent;
      };
    }>();
}

export async function listLandingMedia(
  org: string,
  kind?: "image" | "video",
) {
  const searchParams = kind ? { kind } : undefined;
  return api
    .get(`organizations/${org}/landing/media`, { searchParams })
    .json<{ media: LandingMediaLibraryItem[] }>();
}

export async function uploadLandingMedia(org: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return api
    .post(`organizations/${org}/landing/media`, {
      body,
      timeout: 300_000,
    })
    .json<{ media: LandingMediaLibraryItem }>();
}
