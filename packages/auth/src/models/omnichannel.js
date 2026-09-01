"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.omnichannelSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.omnichannelSchema = zod_1.default.object({
    __typename: zod_1.default.literal("Omnichannel").default("Omnichannel"),
    id: zod_1.default.string().uuid(),
});
