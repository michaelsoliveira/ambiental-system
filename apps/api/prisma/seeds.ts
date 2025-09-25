import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import { faker } from "@faker-js/faker";
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
            name: "AmapaCode",
            slug: "amapa-code",
            owner: {
                connect: {
                    id: user.id!
                }
            },
            domain: "amapacode.com",
            avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
            shouldAttachDomain: true,
            projects: {
                createMany: {
                    data: [
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: user.id!,
                    },
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: memberUser.id!,
                    },
                    {
                        name: "Projeto NoCode",
                        slug: "projeto-nocode",
                        description: "Descrição do Projeto Beta",
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: billingUser.id!,
                    },
                ]
                }
            }
        },
    });

    const membersData1 = [
        { user_id: user.id!, organization_id: organization1.id, role_id: admin.id! },
        { user_id: memberUser.id!, organization_id: organization1.id, role_id: member.id! },
        { user_id: billingUser.id!, organization_id: organization1.id, role_id: billing.id! },
    ];

    await Promise.all(
        membersData1.map((m) =>
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

    const organization2 = await prisma.organization.create({
        data: {
            name: "AmapaCode Member",
            slug: faker.lorem.slug(10),
            owner_id: user.id!,
            domain: "amapacode-member.com",
            avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
            shouldAttachDomain: true,
            projects: {
                createMany: {
                    data: [
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: memberUser.id!,
                    },
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: user.id!,
                    },
                    {
                        name: "Projeto NoCode",
                        slug: faker.lorem.slug(5),
                        description: "Descrição do Projeto Beta",
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: billingUser.id!,
                    },
                ]
                }
            }
        },
    });

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

    const organization3 = await prisma.organization.create({
        data: {
            name: "AmapaCode Billing",
            slug: faker.lorem.slug(10),
            owner_id: user.id!,
            domain: "amapacode-billing.com",
            avatarUrl: faker.image.urlLoremFlickr({ category: 'business' }),
            shouldAttachDomain: true,
            projects: {
                createMany: {
                    data: [
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: user.id!,
                    },
                    {
                        name: faker.lorem.words(5),
                        slug: faker.lorem.slug(5),
                        description: faker.lorem.words(20),
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: memberUser.id!,
                    },
                    {
                        name: faker.lorem.words(10),
                        slug: faker.lorem.slug(10),
                        description: "Descrição do Projeto Beta",
                        avatarUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
                        owner_id: billingUser.id!,
                    },
                ]
                }
            }
        },
    });

    const membersData3 = [
        { user_id: user.id!, organization_id: organization3.id, role_id: billing.id! },
        { user_id: memberUser.id!, organization_id: organization3.id, role_id: member.id! },
        { user_id: billingUser.id!, organization_id: organization3.id, role_id: admin.id! },
    ];

    await Promise.all(
        membersData3.map((m) =>
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
