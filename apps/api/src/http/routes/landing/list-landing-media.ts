import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { UnauthorizedError } from "@/http/routes/_errors/unauthorized-error";
import { landingMediaStorageService } from "@/services/landing-media-storage.service";
import { getUserPermissions } from "@/utils/get-user-permissions";

export async function listLandingMedia(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      "/organizations/:slug/landing/media",
      {
        schema: {
          tags: ["Landing CMS"],
          summary: "Listar mídias da landing no MinIO",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            kind: z.enum(["image", "video"]).optional(),
          }),
        },
      },
      async (request) => {
        const { slug } = request.params;
        const { kind } = request.query;
        const userId = await request.getCurrentUserId();
        const { membership } = await request.getUserMembership(slug);

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map(
            (mr: { roles: { name: string } }) => mr.roles.name,
          ),
        );

        if (cannot("get", "LandingContent") && cannot("update", "LandingContent")) {
          throw new UnauthorizedError(
            "Você não tem permissão para listar mídias da landing.",
          );
        }

        const media = await landingMediaStorageService.list(slug, kind);
        return { media };
      },
    );
}
