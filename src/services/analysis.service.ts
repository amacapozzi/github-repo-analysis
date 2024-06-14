import axios from "axios";
import FormData from "form-data";
import { appConfig } from "../config/app.config";
import fs from "fs";

const BASE_URL = "https://www.virustotal.com/api";

export class AnalysisService {
  public static async checkFile(filePath: string) {
    try {
      const formData = new FormData();
      formData.append("file", await fs.createReadStream(filePath));

      const response = await axios.post(`${BASE_URL}/v3/files`, formData, {
        headers: {
          "x-apikey": appConfig.VIRUS_TOTAL_APIKEY,
          "content-type": "multipart/form-data",
        },
      });

      console.log(response.data);

      const info = await this.getFileInfo(response.data.data.links.self);

      console.log(info.data.attributes);

      return response.data;
    } catch (err) {
      console.log(err);
      return new Error("Error to scan file");
    }
  }
  private static async getFileInfo(self: string) {
    const response = await axios.get(self, {
      headers: {
        "x-apikey": appConfig.VIRUS_TOTAL_APIKEY,
      },
    });
    return response.data;
  }
}
