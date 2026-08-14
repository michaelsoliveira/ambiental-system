import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "@/http/middlewares/auth";
import { UnauthorizedError } from "@/http/routes/_errors/unauthorized-error";
import type { LandingContentPayload } from "@/lib/default-landing-content";
import { landingCmsService } from "@/services/landing-cms-service";
import { getUserPermissions } from "@/utils/get-user-permissions";

export async function updateLandingDraft(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      "/organizations/:slug/landing/draft",
      {
        schema: {
          tags: ["Landing CMS"],
          summary: "Salvar rascunho do conteúdo da landing",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: z.object({
            content: z.record(z.string(), z.unknown()),
          }),
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

        if (cannot("update", "LandingContent")) {
          throw new UnauthorizedError(
            "Você não tem permissão para editar o CMS da landing.",
          );
        }

        const site = await landingCmsService.updateDraft(
          organization.id,
          request.body.content as unknown as LandingContentPayload,
          userId,
        );

        return {
          landing: {
            id: site.id,
            updatedAt: site.updated_at,
            draft: site.draft_content,
          },
        };
      },
    );
}
