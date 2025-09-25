import { getUserByEmail } from "@/services/user-service";
import { compare } from "bcrypt";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function authenticateWithPassword(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/sessions/password', 
        {
            schema: {
                tags: ['Auth'],
                summary: 'Authenticate with email',
                body: z.object({
                    email: z.string().email(),
                    password: z.string()
                }),
                response: {
                    200: z.object({
                        token: z.string()
                    }),
                    400: z.object({ error: z.string() }),
                },
            },
        },
        async (request, reply) => {
            const { email, password } = request.body

            const user = await getUserByEmail(email)
            if (!user) {
                return reply.status(400).send({ error: 'Invalid Credentials' });
            }

            const isValidPassword = await compare(password, user.password!)

            if (!isValidPassword) {
                return reply.status(400).send({ error: 'Invalid Credentials' });
            }

            const token = await reply.jwtSign({
                sub: user.id,
                sign: {
                    expiresIn: '1d'
                }
            })

            return reply.status(200).send({ token });
        }
    )
}