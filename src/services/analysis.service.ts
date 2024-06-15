import axios from "axios";
import FormData from "form-data";
import yauzl from "yauzl";
import { appConfig } from "../config/app.config";
import { FileResult } from "../types/File";

const BASE_URL = "https://www.virustotal.com/api";

export class AnalysisService {
  public static async checkFile(buffer: Buffer): Promise<FileResult | Error> {
    try {
      const formData = new FormData();
      formData.append("file", buffer, {
        filename: "file.exe",
        contentType: "application/octet-stream",
      });

      const response = await axios.post(`${BASE_URL}/v3/files`, formData, {
        headers: {
          "x-apikey": appConfig.VIRUS_TOTAL_APIKEY,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const info = await this.getFileInfo(response.data.data.self);

      return info.data.attributes.stats;
    } catch (err: any) {
      return new Error(`Error scanning the file ${err} `);
    }
  }

  private static async getFileInfo(fileId: string) {
    const response = await axios.get(`${BASE_URL}/v3/files/${fileId}`, {
      headers: {
        "x-apikey": appConfig.VIRUS_TOTAL_APIKEY,
      },
    });
    return response.data;
  }

  public static async isZipProtected(buffer: Buffer): Promise<Boolean | void> {
    yauzl.fromBuffer(buffer, (err) => {
      if (err) return true;
      return false;
    });
  }
}
