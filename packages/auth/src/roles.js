"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.roleSchema = zod_1.default.union([
    zod_1.default.literal("admin"),
    zod_1.default.literal("owner"),
    zod_1.default.literal("manager"),
    zod_1.default.literal("billing"),
    zod_1.default.literal("guest"),
    zod_1.default.literal("member")
]);
