import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcrypt";
import { faker } from "@faker-js/faker";
import { ensureFrotaFinanceiroDefaults } from "./frota-financeiro-seed";
const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding database...");
    // Add your seed logic here
    await prisma.memberRole.deleteMany();
    await prisma.member.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await hash("secret", 6);
    const user = await prisma.user.create({
        data: {
            username: "admin",
            email: "michaelsoliveira@gmail.com",
            avatarUrl: faker.image.avatar(),
            password: passwordHash,
        },
    });

    const memberUser = await prisma.user.create({
    data: {
        username: faker.person.fullName(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatar(),
        password: passwordHash,
    },
    });

    const billingUser = await prisma.user.create({
    data: {
        username: faker.person.fullName(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatar(),
        password: passwordHash,
    },
    });

    const permissions: Prisma.PermissionCreateInput[] = [
      {
        name: 'modulo:monitoramento',
        description: 'Acesso ao módulo do sistema de monitoramento de condicionantes'
      },
      {
        name: 'modulo:financeiro',
        description: 'Acesso ao módulo do sistema de controle financeiro'
      },
      {
        name: 'modulo:seguranca',
        description: 'Acesso ao módulo do sistema de medicina e segurança do trabalho'
      },
      {
        name: 'modulo:manejo_florestal',
        description: 'Acesso ao módulo do sistema de manejo florestal'
      }
    ]

    // let permissionsCreated: Array<string> = []
        
      
        const [monitoramento, financeiro, seguranca, ambiental] = await prisma.permission.createMany({
          data: [
            {
              name: 'modulo:monitoramento',
              description: 'Acesso ao módulo do sistema de monitoramento de condicionantes'
            },
            {
              name: 'modulo:financeiro',
              description: 'Acesso ao módulo do sistema de controle financeiro'
            },
            {
              name: 'modulo:seguranca',
              description: 'Acesso ao módulo do sistema de medicina e segurança do trabalho'
            },
            {
              name: 'modulo:manejo_florestal',
              description: 'Acesso ao módulo do sistema de manejo florestal'
            }
          ]
        }).then(() => prisma.permission.findMany({
          where: {
              name: { in: [
                "modulo:monitoramento", 
                "modulo:financeiro", 
                "modulo:seguranca", 
                "billing", 
                "modulo:manejo_florestal"] 
              }
          }
      }));
        
      

    const [admin, owner, member, billing, guest] = await prisma.role.createMany({
        data: [
            { name: "admin", description: "Administrador com permissões elevadas" },
            { name: "owner", description: "Proprietário com controle total" },
            { name: "member", description: "Membro com permissões básicas" },
            { name: "billing", description: "Acesso apenas a informações de faturamento" },
            { name: "guest", description: "Acesso limitado, apenas leitura" },
        ],
        skipDuplicates: true,
    }).then(() => prisma.role.findMany({
        where: {
            name: { in: ["admin", "owner", "member", "billing", "guest"] }
        }
    }));

    const organization1 = await prisma.organization.create({
        data: {
            name: "Ambiental",
            slug: "ambiental-system",
            owner: {
                connect: {
                    id: user.id!
                }
            },
            domain: "ambiental.com",
            avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
            shouldAttachDomain: true,
        },
    });

    await ensureFrotaFinanceiroDefaults(prisma, organization1.id);

    const membersData1 = [
        { user_id: user.id!, organization_id: organization1.id, role_id: admin.id!, permission_id: monitoramento.id },
        { user_id: memberUser.id!, organization_id: organization1.id, role_id: member.id!, permission_id: monitoramento.id },
        { user_id: billingUser.id!, organization_id: organization1.id, role_id: billing.id!, permission_id: monitoramento.id },
    ];

    await Promise.all(
        membersData1.map((m) =>
            prisma.member.create({
            data: {
                user_id: m.user_id,
                organization_id: m.organization_id,
                members_roles: {
                create: [{ role_id: m.role_id }]
                },
                members_permissions: {
                  create: [{ permission_id: m.permission_id }]
                }
            },
            })
        ));

    const organization2 = await prisma.organization.create({
        data: {
            name: "Ambiental Member",
            slug: faker.lorem.slug(10),
            owner_id: user.id!,
            domain: "ambiental-member.com",
            avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
            shouldAttachDomain: true,
        },
    });

    await ensureFrotaFinanceiroDefaults(prisma, organization2.id);

    const membersData2 = [
        { user_id: user.id!, organization_id: organization2.id, role_id: member.id! },
        { user_id: memberUser.id!, organization_id: organization2.id, role_id: admin.id! },
        { user_id: billingUser.id!, organization_id: organization2.id, role_id: billing.id! },
    ];

    await Promise.all(
        membersData2.map((m) =>
            prisma.member.create({
            data: {
                user_id: m.user_id,
                organization_id: m.organization_id,
                members_roles: {
                create: [{ role_id: m.role_id }],
                },
            },
            })
        ));
        
        const tiposLicenca: Prisma.TipoLicencaCreateInput[] = [
          {
            nome: 'LP',
            descricao: 'Licença Prévia'
          },
          {
            nome: 'LI',
            descricao: 'Licença de Instalação'
          },
          {
            nome: 'LO',
            descricao: 'Licença de Operação'
          }
        ]
        
        const estados: Prisma.EstadoCreateInput[] = [
          {
            uf: 'AC',
            nome: 'Acre',
            ibge: 12,
            ddd: [68]
          },
          {
            uf: 'AL',
            nome: 'Alagoas',
            ibge: 27,
            ddd: [82]
          },
          {
            uf: 'AM',
            nome: 'Amazonas',
            ibge: 13,
            ddd: [97,92]
          },
          {
            uf: 'AP',
            ibge: 16,
            nome: 'Amapá',
            ddd: [96]
          },
          {
            uf: 'BA',
            nome: 'Bahia',
            ibge: 29,
            ddd: [77,75,73,74,71]
          },
          {
            uf: 'CE',
            nome: 'Ceará',
            ibge: 23,
            ddd: [88,85]
          },
          {
            uf: 'DF',
            nome: 'Distrito Federal',
            ibge: 53,
            ddd: [61]
          },
          {
            uf: 'ES',
            nome: 'Espírito Santo',
            ibge: 32,
            ddd: [28,27]
          },
          {
            uf: 'GO',
            nome: 'Goiás',
            ibge: 52,
            ddd: [62,64,61]
          },
          {
            uf: 'MA',
            nome: 'Maranhão',
            ibge: 21,
            ddd: [99,98]
          },
          {
            uf: 'MG',
            nome: 'Minas Gerais',
            ibge: 31,
            ddd: [34,37,31,33,35,38,32]
        
          },
          {
            uf: 'MS',
            nome: 'Mato Grosso do Sul',
            ibge: 50,
            ddd: [67]
          },
          {
            uf: 'MT',
            nome: 'Mato Grosso',
            ibge: 51,
            ddd: [65,66]
          },
          {
            uf: 'PA',
            nome: 'Pará',
            ibge: 15,
            ddd: [91,94,93]
          },
          {
            uf: 'PB',
            nome: 'Paraíba',
            ibge: 25,
            ddd: [83]
          },
          {
            uf: 'PE',
            nome: 'Pernambuco',
            ibge: 26,
            ddd: [81,87]
          },
          {
            uf: 'PI',
            nome: 'Piauí',
            ibge: 22,
            ddd: [89,86]
          },
          {
            uf: 'PR',
            nome: 'Paraná',
            ibge: 41,
            ddd: [43,41,42,44,45,46]
          },
          {
            uf: 'RJ',
            nome: 'Rio de Janeiro',
            ibge: 33,
            ddd: [24,22,21]
          },
          {
            uf: 'RN',
            nome: 'Rio Grande do Norte',
            ibge: 24,
            ddd: [84]
          },
          {
            uf: 'RO',
            nome: 'Rondônia',
            ibge: 11,
            ddd: [69]
          },
          {
            uf: 'RR',
            nome: 'Roraima',
            ibge: 14,
            ddd: [95]
          },
          {
            uf: 'RS',
            nome: 'Rio Grande do Sul',
            ibge: 43,
            ddd: [53,54,55,51]
          },
          {
            uf: 'SC',
            nome: 'Santa Catarina',
            ibge: 42,
            ddd: [47,48,49]
          },
          {
            uf: 'SE',
            nome: 'Sergipe',
            ibge: 28,
            ddd: [79]
          },
          {
            uf: 'SP',
            nome: 'São Paulo',
            ibge: 35,
            ddd: [11,12,13,14,15,16,17,18,19]
          },
          {
            uf: 'TO',
            nome: 'Tocantins',
            ibge: 17,
            ddd: [63]
          },
          {
            uf: 'EX',
            nome: 'Exterior',
            ibge: 99,
            ddd: []
          },
        ]
        
          for (const e of estados) {
            const estado = await prisma.estado.create({
              data: e,
            })
            console.log(`Created estado with id: ${estado.id}`)
          }
        
          for (const tipo of tiposLicenca) {
            const tipoLicenca = await prisma.tipoLicenca.create({
              data: tipo
            })
            console.log(`Created tipo licença id: ${tipoLicenca.id}`)
          }

    console.log("Database seeded successfully");
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
