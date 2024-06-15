import axios from "axios";
import FormData from "form-data";
import { appConfig } from "../config/app.config";
import fs from "fs";
import temp from "temp";
import { FileResult } from "../types/File";

const BASE_URL = "https://www.virustotal.com/api";

export class AnalysisService {
  public static async checkFile(buffer: Buffer): Promise<FileResult | Error> {
    try {
      const tempFilePath = temp.path({ suffix: ".tmp" });
      fs.writeFileSync(tempFilePath, buffer);

      const readStream = fs.createReadStream(tempFilePath);

      const formData = new FormData();
      formData.append("file", readStream);

      const response = await axios.post(`${BASE_URL}/v3/files`, formData, {
        headers: {
          "x-apikey": appConfig.VIRUS_TOTAL_APIKEY,
          ...formData.getHeaders(),
        },
      });

      const info = await this.getFileInfo(response.data.data.links.self);

      fs.unlinkSync(tempFilePath);

      return info.data.attributes.stats;
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
