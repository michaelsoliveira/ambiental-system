import { Organization } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const createOrganization = async (orgData: { name: string; slug: string; ownerId?: string; domain?: string; shouldAttachDomain?: boolean; avatarUrl?: string }): Promise<Organization> => {
    const organization = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
        owner_id: orgData.ownerId,
        domain: orgData.domain,
        shouldAttachDomain: orgData.shouldAttachDomain || false,
        avatarUrl: orgData.avatarUrl || null,
      },
    });
    return organization;
  };
  
  export const getOrganizationById = async (id: string): Promise<Organization | null> => {
    return await prisma.organization.findUnique({ where: { id } });
  }
  
  export const updateOrganization = async (id: string, updateData: Partial<Organization>): Promise<Organization> => {
    return await prisma.organization.update({
      where: { id },
      data: updateData,
    });
  }
  
  export const deleteOrganization = async (id: string): Promise<Organization> => {
    return await prisma.organization.delete({
      where: { id },
    });
  }
  
  export const listOrganizations = async (): Promise<Organization[]> => {
    return await prisma.organization.findMany();
  }

  export const getOrgazationByDomain = async (domain: string): Promise<Organization | null> => {
    return await prisma.organization.findFirst({
      where: {
        domain: domain,
        shouldAttachDomain: true
      }
    })
  }