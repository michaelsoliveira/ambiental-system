import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { BadRequestError } from "@/http/routes/_errors/bad-request-error";
import { UnauthorizedError } from "@/http/routes/_errors/unauthorized-error";
import { landingMediaStorageService } from "@/services/landing-media-storage.service";
import { getUserPermissions } from "@/utils/get-user-permissions";

export async function uploadLandingMedia(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      "/organizations/:slug/landing/media",
      {
        schema: {
          tags: ["Landing CMS"],
          summary: "Upload de mídia da landing para o MinIO",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          consumes: ["multipart/form-data"],
        },
      },
      async (request) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(slug);

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map(
            (mr: { roles: { name: string } }) => mr.roles.name,
          ),
        );

        if (cannot("update", "LandingContent")) {
          throw new UnauthorizedError(
            "Você não tem permissão para enviar mídia da landing.",
          );
        }

        const file = await request.file();
        if (!file) {
          throw new BadRequestError("Nenhum arquivo enviado (campo file).");
        }

        const buffer = await file.toBuffer();
        const media = await landingMediaStorageService.upload({
          orgSlug: slug,
          filename: file.filename,
          mimetype: file.mimetype,
          buffer,
        });

        return { media };
      },
    );
}
