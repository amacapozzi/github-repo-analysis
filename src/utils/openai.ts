import { GROQ_BASE_API_URL } from "@app/constants/api";
import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: GROQ_BASE_API_URL,
});
