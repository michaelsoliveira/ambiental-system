import { 
  CreateAbility, 
  createMongoAbility, 
  ForcedSubject, 
  MongoAbility 
} from "@casl/ability";
import type { RawRuleOf } from "@casl/ability";
import { User } from "./models/user";
import { userSubject } from "./subjects/user";
import { projectSubject } from "./subjects/project";
import { organizationSubject } from "./subjects/organization";
import z from "zod";
import { inviteSubject } from "./subjects/invite";
import { billingSubject } from "./subjects/billing";

const appAbilitiesSchema = z.union([
  userSubject,
  projectSubject,
  organizationSubject,
  inviteSubject,
  billingSubject,
  z.tuple([z.literal("manage"), z.literal("all")])
]);
type AppSubjects = z.infer<typeof appAbilitiesSchema>;

export type AppAbility = MongoAbility<AppSubjects>;
export type AppAbilityConstructor = CreateAbility<AppAbility>;

export * from './models/organization'
export * from './models/project'
export * from './models/user'
export * from './roles'

export function defineAbilitiesFor(user: User): AppAbility {
  const rules: RawRuleOf<AppAbility>[] = [];

  // Regras baseadas nas roles do usuário
  user.roles.forEach(role => {
    switch (role) {
      case "admin":
        rules.push({ action: "manage", subject: "all" });
        rules.push(
          { action: ["transfer_ownership", "update"], subject: "Organization", conditions: { owner_id: user.id } }
        );
        break;
        
      case "owner":
        // Owner da Project pode gerenciar tudo dentro da sua Project
        rules.push(
          { action: "manage", subject: "Project", conditions: { owner_id: user.id } },
          { action: "manage", subject: "User", conditions: { organization_id: user.organization_id } },
          { action: "manage", subject: "Organization", conditions: { organization_id: user.organization_id } },
          { action: "manage", subject: "Invite", conditions: { organization_id: user.organization_id } }
        );
        break;
        
      case "manager":
        rules.push(
          { action: "create", subject: "Project" },
          { action: "delete", subject: "Project", conditions: { owner_id: user.id } },
          { action: "get", subject: "User" },

          { action: "update", subject: "Organization", conditions: { owner_id: user.id } }
        );
        break;
        
      case "member":
        rules.push(
          { action: "create", subject: "Project" },
          { action: "get", subject: "Project" },
          { action: "update", subject: "Project", conditions: { owner_id: user.id } },
          { action: "delete", subject: "Project", conditions: { owner_id: user.id } },
          { action: "get", subject: "User" }
        );
        break;

      case "billing":
        rules.push(
          { action: "manage", subject: "Billing"},
        );
        break;
        
      case "guest":
        rules.push(
          { action: "get", subject: "Project", conditions: { id: user.organization_id } },
          { action: "get", subject: "User", conditions: { assignedTo: user.id, organization_id: user.organization_id } }
        );
        break;
    }
    
  });
  
  // Regras universais para todos os usuários
  rules.push(
    { action: "update_password", subject: "User", conditions: { id: user.id } },
    { action: "change_password", subject: "User", conditions: { id: user.id } },
    { action: "change_email", subject: "User", conditions: { id: user.id } }
  );
  
    const ability = createMongoAbility<AppAbility>(rules, {
     detectSubjectType: (subject: any) => {
      if (subject && typeof subject === 'object' && '__typename' in subject) {
        return subject.__typename;
      }
      return subject;
    }
    });
    ability.can = ability.can.bind(ability)
    ability.cannot = ability.cannot.bind(ability)
    
    return ability
}