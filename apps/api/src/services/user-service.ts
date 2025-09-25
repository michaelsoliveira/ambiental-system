import { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

export const createUser = async (userData: Partial<User>, autoJoin: any): Promise<User> => {
  const { username, email, password } = userData;
  if (!username || !email || !password) {
    throw new Error("Missing required fields: username, email, or password");
  }
  const passwordHash = await hash(password, 6);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: passwordHash,
      member_on: autoJoin
      ? {
        create: {
          organization_id: autoJoin.id
        }
      } : undefined
    },
  });
  return user;
};
  
  export const getUserByEmail = async (email: string): Promise<User | null> => {
    return await prisma.user.findUnique({ where: { email } });
  }

  export const getUserById = async (id: string): Promise<User | null> => {
    return await prisma.user.findUnique({ where: { id } });
  }

  export const updateUser = async (id: string, updateData: Partial<User>): Promise<User> => {
    return await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  export const deleteUser = async (id: string): Promise<User> => {
    return await prisma.user.delete({
      where: { id },
    });
  }

  export const listUsers = async (): Promise<User[]> => {
    return await prisma.user.findMany();
  }