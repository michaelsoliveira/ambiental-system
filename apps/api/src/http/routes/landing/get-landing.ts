import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { UnauthorizedError } from "@/http/routes/_errors/unauthorized-error";
import { landingCmsService } from "@/services/landing-cms-service";
import { getUserPermissions } from "@/utils/get-user-permissions";

export async function getLandingCms(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      "/organizations/:slug/landing",
      {
        schema: {
          tags: ["Landing CMS"],
          summary: "Obter rascunho e status de publicação da landing",
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

        if (cannot("get", "LandingContent")) {
          throw new UnauthorizedError(
            "Você não tem permissão para visualizar o CMS da landing.",
          );
        }

        const site = await landingCmsService.getOrCreate(organization.id, userId);

        return {
          landing: {
            id: site.id,
            organizationId: site.organization_id,
            draft: site.draft_content,
            published: site.published_content,
            publishedAt: site.published_at,
            updatedAt: site.updated_at,
            hasPublished: Boolean(site.published_content),
          },
        };
      },
    );
}
