import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { UnauthorizedError } from "@/http/routes/_errors/unauthorized-error";
import { landingCmsService } from "@/services/landing-cms-service";
import { getUserPermissions } from "@/utils/get-user-permissions";

export async function publishLanding(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      "/organizations/:slug/landing/publish",
      {
        schema: {
          tags: ["Landing CMS"],
          summary: "Publicar rascunho da landing",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
        },
      },
      async (request) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } =
          await request.getUserMembership(slug);

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: { roles: { name: string } }) => mr.roles.name),
        );

        if (
          cannot("publish", "LandingContent") &&
          cannot("manage", "LandingContent")
        ) {
          throw new UnauthorizedError(
            "Você não tem permissão para publicar a landing.",
          );
        }

        const site = await landingCmsService.publish(organization.id, userId);

        return {
          landing: {
            id: site.id,
            publishedAt: site.published_at,
            published: site.published_content,
          },
        };
      },
    );
}
