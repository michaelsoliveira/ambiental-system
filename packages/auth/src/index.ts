import { 
  CreateAbility, 
  createMongoAbility, 
  MongoAbility 
} from "@casl/ability";
import type { RawRuleOf } from "@casl/ability";
import { User } from "./models/user";
import { UserSubject } from "./subjects/user";
import { OrganizationSubject } from "./subjects/organization";
import { InviteSubject } from "./subjects/invite";
import { BillingSubject } from "./subjects/billing";
import { ParceiroSubject } from "./subjects/parceiro";
import { PessoaSubject } from "./subjects/pessoa";
import { ContaBancariaSubject } from "./subjects/conta-bancaria";
import { CentroCustoSubject } from "./subjects/centro-custo";
import { CategoriaFinanceiraSubject } from "./subjects/categoria-financeira";
import { LancamentoSubject } from "./subjects/lancamento";

// Combine todos os subjects em um único union sem z.union()
type AppSubjects = 
  | UserSubject
  | OrganizationSubject
  | InviteSubject
  | ParceiroSubject
  | BillingSubject
  | ContaBancariaSubject
  | CentroCustoSubject
  | CategoriaFinanceiraSubject
  | PessoaSubject
  | LancamentoSubject
  | ['manage', 'all'];

export type AppAbility = MongoAbility<AppSubjects>;
export type AppAbilityConstructor = CreateAbility<AppAbility>;

export * from './models/organization'
export * from './models/user'
export * from './models/categoria-financeira'
export * from './models/centro-custo'
export * from './models/conta-bancaria'
export * from './models/parceiro'
export * from './models/lancamento'
export * from './roles'
export * from './models/pessoa'
export * from './models/lancamento'

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
        rules.push(
          { action: "manage", subject: "User", conditions: { organization_id: user.organization_id } },
          { action: "manage", subject: "Organization", conditions: { organization_id: user.organization_id } },
          { action: "manage", subject: "Invite", conditions: { organization_id: user.organization_id } }
        );
        break;
        
      case "manager":
        rules.push(
          { action: "create", subject: "Parceiro" },
          { action: "get", subject: "Parceiro" },
          { action: "update", subject: "Parceiro" },
          { action: "delete", subject: "Parceiro" },
          { action: "create", subject: "ContaBancaria" },
          { action: "get", subject: "ContaBancaria" },
          { action: "update", subject: "ContaBancaria" },
          { action: "delete", subject: "ContaBancaria" },
          { action: "create", subject: "CentroCusto" },
          { action: "get", subject: "CentroCusto" },
          { action: "update", subject: "CentroCusto" },
          { action: "delete", subject: "CentroCusto" },
          { action: "create", subject: "CategoriaFinanceira" },
          { action: "get", subject: "CategoriaFinanceira" },
          { action: "update", subject: "CategoriaFinanceira" },
          { action: "delete", subject: "CategoriaFinanceira" },
          { action: "create", subject: "Pessoa" },
          { action: "get", subject: "Pessoa" },
          { action: "update", subject: "Pessoa" },
          { action: "delete", subject: "Pessoa" },
          { action: "create", subject: "Lancamento" },
          { action: "get", subject: "Lancamento" },
          { action: "update", subject: "Lancamento" },
          { action: "delete", subject: "Lancamento" },
          { action: "get", subject: "User" },
          { action: "update", subject: "Organization", conditions: { owner_id: user.id } }
        );
        break;
        
      case "member":
        rules.push(
          { action: "create", subject: "Parceiro" },
          { action: "get", subject: "Parceiro" },
          { action: "update", subject: "Parceiro" },
          { action: "create", subject: "ContaBancaria" },
          { action: "get", subject: "ContaBancaria" },
          { action: "update", subject: "ContaBancaria" },
          { action: "create", subject: "CentroCusto" },
          { action: "get", subject: "CentroCusto" },
          { action: "update", subject: "CentroCusto" },
          { action: "create", subject: "CategoriaFinanceira" },
          { action: "get", subject: "CategoriaFinanceira" },
          { action: "update", subject: "CategoriaFinanceira" },
          { action: "create", subject: "Lancamento" },
          { action: "get", subject: "Lancamento" },
          { action: "update", subject: "Lancamento" },
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