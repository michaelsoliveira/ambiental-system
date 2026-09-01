"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineAbilitiesFor = defineAbilitiesFor;
const ability_1 = require("@casl/ability");
__exportStar(require("./models/organization"), exports);
__exportStar(require("./models/user"), exports);
__exportStar(require("./models/categoria-financeira"), exports);
__exportStar(require("./models/centro-custo"), exports);
__exportStar(require("./models/conta-bancaria"), exports);
__exportStar(require("./models/parceiro"), exports);
__exportStar(require("./models/lancamento"), exports);
__exportStar(require("./models/patrimonio"), exports);
__exportStar(require("./models/landing-content"), exports);
__exportStar(require("./models/omnichannel"), exports);
__exportStar(require("./roles"), exports);
__exportStar(require("./models/pessoa"), exports);
__exportStar(require("./models/lancamento"), exports);
function defineAbilitiesFor(user) {
    const rules = [];
    // Regras baseadas nas roles do usuário
    user.roles.forEach(role => {
        switch (role) {
            case "admin":
                rules.push({ action: "manage", subject: "all" });
                rules.push({ action: ["transfer_ownership", "update"], subject: "Organization", conditions: { owner_id: user.id } });
                break;
            case "owner":
                rules.push({ action: "manage", subject: "User", conditions: { organization_id: user.organization_id } }, { action: "manage", subject: "Organization", conditions: { organization_id: user.organization_id } }, { action: "manage", subject: "Invite", conditions: { organization_id: user.organization_id } }, { action: "manage", subject: "LandingContent" }, { action: "manage", subject: "Omnichannel" });
                break;
            case "manager":
                rules.push({ action: "create", subject: "Parceiro" }, { action: "get", subject: "Parceiro" }, { action: "update", subject: "Parceiro" }, { action: "delete", subject: "Parceiro" }, { action: "create", subject: "ContaBancaria" }, { action: "get", subject: "ContaBancaria" }, { action: "update", subject: "ContaBancaria" }, { action: "delete", subject: "ContaBancaria" }, { action: "create", subject: "CentroCusto" }, { action: "get", subject: "CentroCusto" }, { action: "update", subject: "CentroCusto" }, { action: "delete", subject: "CentroCusto" }, { action: "create", subject: "CategoriaFinanceira" }, { action: "get", subject: "CategoriaFinanceira" }, { action: "update", subject: "CategoriaFinanceira" }, { action: "delete", subject: "CategoriaFinanceira" }, { action: "create", subject: "Pessoa" }, { action: "get", subject: "Pessoa" }, { action: "update", subject: "Pessoa" }, { action: "delete", subject: "Pessoa" }, { action: "create", subject: "Lancamento" }, { action: "get", subject: "Lancamento" }, { action: "update", subject: "Lancamento" }, { action: "delete", subject: "Lancamento" }, { action: "create", subject: "Patrimonio" }, { action: "get", subject: "Patrimonio" }, { action: "update", subject: "Patrimonio" }, { action: "delete", subject: "Patrimonio" }, { action: "get", subject: "LandingContent" }, { action: "update", subject: "LandingContent" }, { action: "publish", subject: "LandingContent" }, { action: "get", subject: "Omnichannel" }, { action: "create", subject: "Omnichannel" }, { action: "update", subject: "Omnichannel" }, { action: "delete", subject: "Omnichannel" }, { action: "get", subject: "User" }, { action: "update", subject: "Organization", conditions: { owner_id: user.id } });
                break;
            case "member":
                rules.push({ action: "create", subject: "Parceiro" }, { action: "get", subject: "Parceiro" }, { action: "update", subject: "Parceiro" }, { action: "create", subject: "ContaBancaria" }, { action: "get", subject: "ContaBancaria" }, { action: "update", subject: "ContaBancaria" }, { action: "create", subject: "CentroCusto" }, { action: "get", subject: "CentroCusto" }, { action: "update", subject: "CentroCusto" }, { action: "create", subject: "CategoriaFinanceira" }, { action: "get", subject: "CategoriaFinanceira" }, { action: "update", subject: "CategoriaFinanceira" }, { action: "create", subject: "Lancamento" }, { action: "get", subject: "Lancamento" }, { action: "update", subject: "Lancamento" }, { action: "create", subject: "Patrimonio" }, { action: "get", subject: "Patrimonio" }, { action: "update", subject: "Patrimonio" }, { action: "get", subject: "Omnichannel" }, { action: "create", subject: "Omnichannel" }, { action: "update", subject: "Omnichannel" }, { action: "delete", subject: "Omnichannel" }, { action: "get", subject: "User" });
                break;
            case "billing":
                rules.push({ action: "manage", subject: "Billing" });
                break;
            case "guest":
                rules.push({ action: "get", subject: "User", conditions: { assignedTo: user.id, organization_id: user.organization_id } });
                break;
        }
    });
    // Regras universais para todos os usuários
    rules.push({ action: "update_password", subject: "User", conditions: { id: user.id } }, { action: "change_password", subject: "User", conditions: { id: user.id } }, { action: "change_email", subject: "User", conditions: { id: user.id } });
    const ability = (0, ability_1.createMongoAbility)(rules, {
        detectSubjectType: (subject) => {
            if (subject && typeof subject === 'object' && '__typename' in subject) {
                return subject.__typename;
            }
            return subject;
        }
    });
    ability.can = ability.can.bind(ability);
    ability.cannot = ability.cannot.bind(ability);
    return ability;
}
