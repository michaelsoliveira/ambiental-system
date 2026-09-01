"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteSubject = void 0;
const zod_1 = __importDefault(require("zod"));
exports.inviteSubject = zod_1.default.tuple([
    zod_1.default.union([
        zod_1.default.literal("manage"),
        zod_1.default.literal("get"),
        zod_1.default.literal("create"),
        zod_1.default.literal("delete"),
    ]),
    zod_1.default.literal("Invite")
]);
