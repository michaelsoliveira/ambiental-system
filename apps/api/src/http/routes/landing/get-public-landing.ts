import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { BadRequestError } from "@/http/routes/_errors/bad-request-error";
import { landingCmsService } from "@/services/landing-cms-service";

/**
 * Leitura pública do conteúdo publicado — consumida pela ambiental-landing.
 */
export async function getPublicLanding(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/public/landing/:slug",
    {
      schema: {
        tags: ["Landing CMS"],
        summary: "Conteúdo publicado da landing (público)",
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          draft: z.enum(["0", "1"]).optional(),
          secret: z.string().optional(),
        }),
      },
    },
    async (request) => {
      const { slug } = request.params;
      const { draft, secret } = request.query;

      if (draft === "1") {
        const expected = process.env.LANDING_PREVIEW_SECRET?.trim();
        if (!expected || secret !== expected) {
          throw new BadRequestError("Preview não autorizado.");
        }
        const preview = await landingCmsService.getDraftBySlug(slug);
        if (!preview) {
          throw new BadRequestError("Organização não encontrada.");
        }
        return {
          content: {
            ...preview.content,
            meta: {
              ...preview.content.meta,
              source: "mixed" as const,
              preview: true,
            },
          },
          publishedAt: preview.publishedAt,
          preview: true,
        };
      }

      const published = await landingCmsService.getPublishedBySlug(slug);
      if (!published) {
        throw new BadRequestError(
          "Landing ainda não publicada para esta organização.",
        );
      }

      return {
        content: published.content,
        publishedAt: published.publishedAt,
        preview: false,
      };
    },
  );
}
