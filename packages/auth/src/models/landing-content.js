"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.landingContentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.landingContentSchema = zod_1.default.object({
    __typename: zod_1.default.literal("LandingContent").default("LandingContent"),
    id: zod_1.default.string().uuid(),
});
