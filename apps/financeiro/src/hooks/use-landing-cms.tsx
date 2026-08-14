import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LandingContent } from "@/features/landing-cms/types";
import {
  getLandingCms,
  publishLandingCms,
  updateLandingDraft,
} from "@/http/landing-cms";

async function revalidateLandingSite() {
  const base = process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, "");
  const secret = process.env.NEXT_PUBLIC_LANDING_PREVIEW_SECRET;
  if (!base || !secret) return;

  try {
    await fetch(
      `${base}/api/revalidate?secret=${encodeURIComponent(secret)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
  } catch {
    // landing offline — publish no CMS já ocorreu
  }
}

export function useLandingCms(org: string) {
  return useQuery({
    queryKey: ["landing-cms", org],
    queryFn: () => getLandingCms(org),
    enabled: !!org,
  });
}

export function useUpdateLandingDraft(org: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: LandingContent) => updateLandingDraft(org, content),
    onSuccess: () => {
      toast.success("Rascunho salvo (ainda não está no site público)");
      queryClient.invalidateQueries({ queryKey: ["landing-cms", org] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar rascunho");
    },
  });
}

export function usePublishLanding(org: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishLandingCms(org),
    onSuccess: async () => {
      await revalidateLandingSite();
      toast.success("Landing publicada — site atualizado");
      queryClient.invalidateQueries({ queryKey: ["landing-cms", org] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao publicar");
    },
  });
}
