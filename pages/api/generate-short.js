import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generatePrompt() {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Genera un prompt ÚNICO para video lluvia (20 palabras max). Responde SOLO JSON: {"prompt": "..."}`
    }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text).prompt;
  } catch {
    return "Heavy rain storm";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const prompt = await generatePrompt();
    const { data } = await supabase.from("videos").insert([{
      title: prompt,
      status: "ready"
    }]);
    res.status(200).json({ status: "success", prompt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
