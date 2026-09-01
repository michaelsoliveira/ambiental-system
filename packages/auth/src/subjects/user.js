"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSubject = void 0;
const zod_1 = __importDefault(require("zod"));
exports.userSubject = zod_1.default.tuple([
    zod_1.default.union([
        zod_1.default.literal("manage"),
        zod_1.default.literal("get"),
        zod_1.default.literal("invite"),
        zod_1.default.literal("create"),
        zod_1.default.literal("update"),
        zod_1.default.literal("delete"),
        zod_1.default.literal("update_password"),
        zod_1.default.literal("change_password"),
        zod_1.default.literal("change_email")
    ]),
    zod_1.default.literal("User")
]);
