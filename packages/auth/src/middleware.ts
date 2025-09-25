import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { defineAbilitiesFor } from "./index";
import { User } from "./models/user";
export interface AuthenticatedRequest extends Request {
  user?: User;
  ability?: ReturnType<typeof defineAbilitiesFor>;
  organizationId?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Buscar usuário completo do banco de dados
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: "Usuário inativo ou não encontrado" });
    }

    // Definir habilidades baseadas no usuário
    const ability = defineAbilitiesFor(user);
    
    req.user = user;
    req.ability = ability;
    req.organizationId = user.organizationId;
    
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

export const requireAbility = (action: string, subject: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.ability || !req.ability.can(action as any, subject as any)) {
      return res.status(403).json({ 
        error: "Permissão insuficiente",
        required: { action, subject }
      });
    }
    next();
  };
};

// Middleware para verificar se o recurso pertence à empresa do usuário
export const checkTenantAccess = (resourceOrganizationId: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.roles.some(role => role === "admin")) {
      // Admins podem acessar qualquer tenant
      return next();
    }
    
    if (req.organizationId !== resourceOrganizationId) {
      return res.status(403).json({ 
        error: "Acesso negado: recurso não pertence à sua empresa" 
      });
    }
    next();
  };
};

// Função auxiliar para buscar usuário (implementar conforme seu ORM)
async function getUserById(userId: string): Promise<User | null> {
  // Implementar busca no banco de dados
  // Exemplo com Prisma:
  // return await prisma.user.findUnique({
  //   where: { id: userId },
  //   include: {
  //     roles: {
  //       include: {
  //         permissions: true
  //       }
  //     }
  //   }
  // });
  return null;
}