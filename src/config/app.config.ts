import "dotenv/config";

export const appConfig = {
  VIRUS_TOTAL_APIKEY: process.env.VIRUS_TOTAL_API_KEY ?? "",
  GITHUB_SECRET: process.env.GITHUB_SECRET ?? "",
};
