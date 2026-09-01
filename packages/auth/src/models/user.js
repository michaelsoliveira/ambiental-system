"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const roles_1 = require("../roles");
exports.userSchema = zod_1.default.object({
    __typename: zod_1.default.literal("User").default("User"),
    id: zod_1.default.string().uuid(),
    roles: zod_1.default.array(roles_1.roleSchema),
    organization_id: zod_1.default.string().optional()
});
