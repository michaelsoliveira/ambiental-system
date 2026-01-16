import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };

// import { Prisma, PrismaClient } from '@prisma/client';

// export function getPrismaClient(organizationId: string) {
//   const prisma = new PrismaClient();

//   return prisma.$extends({
//     query: {
//       // Para cada modelo, adiciona o filtro de organização
//       $allModels: {
//         async findMany({ args, query }) {
//           args.where = { ...args.where, organization_id: organizationId };
//           return query(args);
//         },
//         async findFirst({ args, query }) {
//           args.where = { ...args.where, organization_id: organizationId };
//           return query(args);
//         },
//         async findUnique({ args, query }) {
//           args.where = { ...args.where, organization_id: organizationId };
//           return query(args);
//         },
//         async create({ args, query }) {
//           args.data = { ...args.data, organization_id: organizationId };
//           return query(args);
//         },
//         async update({ args, query }) {
//           args.where = { ...args.where, organization_id: organizationId };
//           return query(args);
//         },
//         async delete({ args, query }) {
//           args.where = { ...args.where, organization_id: organizationId };
//           return query(args);
//         },
//       },
//     },
//   });
// }
