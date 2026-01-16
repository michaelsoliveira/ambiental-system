import { prisma } from "@/lib/prisma";

export const createMember = async (data: { userId: string, organizationId: string, role: string }) => {
    const role = await prisma.role.findFirst({
      where: { name: data.role },
    });
    const member = await prisma.member.create({
      data: {
        user_id: data.userId,
        organization_id: data.organizationId,
        members_roles: {
          create: {
            role_id: role?.id!,
          }
        }
      },
    });
    return member;
  }    

export const getMemberById = async (id: string) => {
    return await prisma.member.findUnique({ where: { id } });
  }

export const updateMember = async (id: string, updateData: any) => {
    return await prisma.member.update({
      where: { id },
      data: updateData,
    });
  }

export const deleteMember = async (id: string) => {
    return await prisma.member.delete({
      where: { id },
    });
  }

export const listMembers = async (organizationId: string) => {
    return await prisma.member.findMany({ where: { organization_id: organizationId } });
  }

export const getMemberByUserIdAndOrganizationId = async (userId: string, organizationId: string) => {
    return await prisma.member.findFirst({ where: { user_id: userId, organization_id: organizationId } });
  }

export const listMembersByRole = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({ where: { organization_id: organizationId, members_roles: { some: {
      roles: {
        is: {
          name: role
        }
      }
    } } } });
  }

export const countMembersInOrganization = async (organizationId: string) => {
    return await prisma.member.count({ where: { organization_id: organizationId } });
  }

export const changeMemberRole = async (memberId: string, newRole: string) => {
  // Primeiro pega o roleId do novo papel
  const role = await prisma.role.findFirst({
    where: { name: newRole },
  });

  if (!role) {
    throw new Error(`Role "${newRole}" not found`);
  }

  // Atualiza a associação do membro com o novo papel
  return await prisma.memberRole.updateMany({
    where: { member_id: memberId }, // aqui só precisa do member_id
    data: { role_id: role.id },
  });
};

export const removeMemberFromOrganization = async (memberId: string) => {
    return await prisma.member.delete({
      where: { id: memberId },
    });
  }

export const getMembersWithUserDetails = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId },
      include: { user: true },
    });
  }

export const getMemberWithPermissions = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { members_permissions: true },
    });
  }

export const addPermissionToMember = async (memberId: string, permission: string) => {
    return await prisma.memberPermission.create({
      data: {
        member_id: memberId,
        permission_id: permission,
      },
    });
  }

export const removePermissionFromMember = async (memberId: string, permission: string) => {
    return await prisma.memberPermission.deleteMany({
      where: {
        member_id: memberId,
        permission_id: permission,
      },
    });
  }

export const listMemberPermissions = async (memberId: string) => {
    return await prisma.memberPermission.findMany({
      where: { member_id: memberId },
    });
  }

export const clearMemberPermissions = async (memberId: string) => {
    return await prisma.memberPermission.deleteMany({
      where: { member_id: memberId },
    });
  }

export const isUserInOrganization = async (userId: string, organizationId: string) => {
    const member = await prisma.member.findFirst({
      where: { user_id: userId, organization_id: organizationId },
    });
    return !!member;
  }

export const getOrganizationOwners = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: "OWNER"
            }
          }
        } 
      } 
    },
      include: { user: true },
    });
  }

export const transferOrganizationOwnership = async (organizationId: string, newOwnerUserId: string) => {
    const updatedMember = await prisma.member.updateMany({
      data: {
        organization_id: organizationId,
        user_id: newOwnerUserId
      },
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: "OWNER"
            }
          }
        } 
      } 
    },
    });
  
    return updatedMember;
  }

export const getMembersByUserId = async (userId: string) => {
    return await prisma.member.findMany({
      where: { user_id: userId },
      include: { organization: true },
    });
  }

export const getMemberByIdWithDetails = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true, organization: true, members_permissions: true },
    });
  }

export const countMembersByRole = async (organizationId: string, role: string) => {
    return await prisma.member.count({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: role
            }
          }
        } 
      } 
    },
    });
  }

export const getMemberByEmail = async (email: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: {
        organization_id: organizationId,
        user: {
          email,
        },
      },
      include: { user: true },
    });
  }

export const listAllMembers = async () => {
    return await prisma.member.findMany({
      include: { user: true, organization: true },
    });
  }

export const updateMemberLastActive = async (memberId: string) => {
    return await prisma.member.update({
      where: { id: memberId },
      data: { updated_at: new Date() },
    });
  }

export const getActiveMembers = async (organizationId: string, since: Date) => {
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        updated_at: {
          gte: since,
        },
      },
      include: { user: true },
    });
  }

export const searchMembers = async (organizationId: string, query: string) => {
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        user: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      include: { user: true },
    });
  }

export const getMemberByUserId = async (userId: string) => {
    return await prisma.member.findFirst({
      where: { user_id: userId },
      include: { organization: true },
    });
  }

export const getMembersByOrganizationIds = async (organizationIds: string[]) => {
    return await prisma.organization.findMany({
      where: { members: { some: {
        id: { in: organizationIds }
      } } },
      include: { members: true, owner: true},
    });
  }

export const getMemberCountByOrganization = async () => {
    return await prisma.member.groupBy({
      by: ["organization_id"],
      _count: {
        organization_id: true,
      },
    });
  }

export const getMembersWithRole = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: role
            }
          }
        } 
      } 
    },
      include: { user: true },
    });
  }

export const getMemberRoles = async (memberId: string) => {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { members_roles: true },
    });
    return member ? member.members_roles : null;
  }

  export const isMemberAdmin = async (memberId: string) => {
    // Busca o papel ADMIN
    const adminRole = await prisma.role.findFirst({
      where: { name: "ADMIN" },
    });

    if (!adminRole) return false; // se não existir o papel ADMIN, retorna false

    // Busca o membro com seus papéis
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { members_roles: true },
    });

    if (!member) return false;

    // Verifica se o membro possui o papel ADMIN
    return member.members_roles.some(
      (mr) => mr.role_id === adminRole.id
    );
  };

export const isMemberOwner = async (memberId: string) => {
    // Busca o papel ADMIN
    const adminRole = await prisma.role.findFirst({
      where: { name: "OWNER" },
    });

    if (!adminRole) return false; // se não existir o papel ADMIN, retorna false

    // Busca o membro com seus papéis
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { members_roles: true },
    });

    if (!member) return false;

    // Verifica se o membro possui o papel ADMIN
    return member.members_roles.some(
      (mr) => mr.role_id === adminRole.id
    );
  };

export const getMembersByRoleInOrganization = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: role
            }
          }
        } 
      } 
    },
      include: { user: true },
    });
  }

export const getMemberByIdAndOrganizationId = async (memberId: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: { id: memberId, organization_id: organizationId },
      include: { user: true },
    });
  }

export const getMemberByUserIdWithPermissions = async (userId: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: { user_id: userId, organization_id: organizationId },
      include: { members_permissions: true },
    });
  }

export const getMembersWithSpecificPermission = async (organizationId: string, permission: string) => {
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        members_permissions: {
          some: {
            permissions: {
              is: {
                name: permission
              }
            },
          },
        },
      },
      include: { user: true, members_permissions: true },
    });
  }

export const getMemberByEmailOnly = async (email: string) => {
    return await prisma.member.findFirst({
      where: {
        user: {
          email,
        },
      },
      include: { user: true },
    });
  }

export const getMembersWithNoPermissions = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        members_permissions: {
          none: {},
        },
      },
      include: { user: true },
    });
  }

export const getMembersByMultipleRoles = async (organizationId: string, roles: string[]) => {
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        members_roles: { some: {
          roles: { is: { name: { in: roles }
        } },
      }}},
      include: { user: true },
    });
  }

export const getMemberByIdAndUserId = async (memberId: string, userId: string) => {
    return await prisma.member.findFirst({
      where: { id: memberId, user_id: userId },
      include: { organization: true },
    });
  }

export const getMembersWithRecentActivity = async (organizationId: string, days: number) => {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
  
    return await prisma.member.findMany({
      where: {
        organization_id: organizationId,
        updated_at: {
          gte: sinceDate,
        },
      },
      include: { user: true },
    });
  }

export const getMemberByUserIdInOrganization = async (userId: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: { user_id: userId, organization_id: organizationId },
      include: { user: true },
    });
  }

export const getMembersWithRoleCount = async (organizationId: string) => {
    const roles = ["OWNER", "ADMIN", "MEMBER", "GUEST", "BILLING"];
    const counts: any = {};
  
    for (const role of roles) {
      counts[role] = await prisma.member.count({
        where: { organization_id: organizationId, members_roles: { 
          some: {
            roles: {
              is: {
                name: role
              }
            }
          } 
        } 
      },
      });
    }
  
    return counts;
  }

export const getMemberByIdWithUser = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
  }

export const getMembersByOrganizationIdWithUser = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId },
      include: { user: true },
    });
  }

export const getMemberByUserEmailAndOrganization = async (email: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: {
        organization_id: organizationId,
        user: {
          email,
        },
      },
      include: { user: true },
    });
  }

export const getMembersByRoleWithUser = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: role
            }
          }
        } 
      } 
    },
      include: { user: true },
    });
  }

export const getMemberByIdWithOrganization = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { organization: true },
    });
  }

export const getMembersByOrganizationIdWithPermissions = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId },
      include: { members_permissions: true },
    });
  }

export const getMemberByUserIdWithOrganization = async (userId: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: { user_id: userId, organization_id: organizationId },
      include: { organization: true },
    });
  }

export const getMembersByRoleAndOrganization = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId, members_roles: { 
        some: {
          roles: {
            is: {
              name: role
            }
          }
        } 
      } 
    },
      include: { user: true },
    });
  }

export const getMemberByIdWithAllDetails = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true, organization: true, members_permissions: true },
    });
  }

export const getMembersByUserIdWithOrganizations = async (userId: string) => {
    return await prisma.member.findMany({
      where: { user_id: userId },
      include: { organization: true },
    });
  }

export const getMemberByEmailAndRole = async (email: string, organizationId: string, role: string) => {
    return await prisma.member.findFirst({
      where: { 
        organization_id: organizationId, 
        user: {
          email
        },
        members_roles: { 
          some: {
            roles: {
              is: {
                name: role
              }
            }
          } 
        } 
      },
      include: { user: true },
    });
  }

export const getMembersByOrganizationIdWithUserAndPermissions = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId },
      include: { user: true, members_permissions: true },
    });
  }

export const getMemberByUserIdWithAllDetails = async (userId: string, organizationId: string) => {
    return await prisma.member.findFirst({
      where: { user_id: userId, organization_id: organizationId },
      include: { user: true, organization: true, members_permissions: true },
    });
  }

export const getMembersByRoleWithPermissions = async (organizationId: string, role: string) => {
    return await prisma.member.findMany({
      where: { 
        organization_id: organizationId, 
        members_roles: { 
          some: {
            roles: {
              is: {
                name: role
              }
            }
          } 
        } 
      },
      include: { user: true, members_permissions: true },
    });
  }

export const getMemberByIdWithUserAndPermissions = async (memberId: string) => {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true, members_permissions: true },
    });
  }

export const getMembersByOrganizationIdWithUserAndRole = async (organizationId: string) => {
    return await prisma.member.findMany({
      where: { organization_id: organizationId },
      include: { user: true }
    });
  }