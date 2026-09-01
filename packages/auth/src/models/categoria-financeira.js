"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriaFinanceiraSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.categoriaFinanceiraSchema = zod_1.default.object({
    __typename: zod_1.default.literal('CategoriaFinanceira').default('CategoriaFinanceira'),
    id: zod_1.default.string().uuid(),
});
