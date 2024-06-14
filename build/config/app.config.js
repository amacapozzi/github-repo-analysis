"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
require("dotenv/config");
exports.appConfig = {
    VIRUS_TOTAL_APIKEY: (_a = process.env.VIRUS_TOTAL_API_KEY) !== null && _a !== void 0 ? _a : "",
    GITHUB_SECRET: (_b = process.env.GITHUB_SECRET) !== null && _b !== void 0 ? _b : "",
};
