"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const app_config_1 = require("../config/app.config");
const BASE_URL = "https://www.virustotal.com/api";
class AnalysisService {
    static checkFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("fetching data.");
                const formData = new form_data_1.default();
                formData.append("file", fs_1.default.createReadStream("xy_extractor_reworked.exe"));
                const response = yield axios_1.default.post(`${BASE_URL}/v3/files`, formData, {
                    headers: {
                        "x-apikey": app_config_1.appConfig.VIRUS_TOTAL_APIKEY,
                        "content-type": "multipart/form-data",
                    },
                });
                console.log(response.data);
                return response.data;
            }
            catch (err) {
                console.log(err);
                return new Error("Error to scan file");
            }
        });
    }
}
exports.AnalysisService = AnalysisService;
