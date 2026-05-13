import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TITLES = [
  "Lluvia fuerte para dormir profundamente | Sueño reparador",
  "Dormir YA con lluvia torrencial y truenos",
  "Lluvia para dormir 8 horas | Sueño profundo",
  "Sonidos de lluvia relajante | Estrés adiós",
  "Lluvia para concentrarse y estudiar",
  "Meditación con lluvia natural",
  "Lluvia para trabajar sin distracciones",
];

const DESCRIPTIONS = [
  "Lluvia real para dormir profundamente. Sonidos naturales de lluvia, truenos y tormenta. Perfecto para sueño reparador, meditación, relajación y concentración.",
  "Sonidos de lluvia natural para sueño profundo. Este vídeo de lluvia real es perfecto para dormir sin insomnio, meditar con paz, y relajarse totalmente.",
];

const TAGS = [
  "lluvia", "dormir", "sueño profundo", "relajante", "truenos", "tormenta", "sonidos naturales"
];

async function getVideo() {
  try {
    const response = await axios.get(
      "https://api.pexels.com/videos/search",
      {
        headers: { Authorization: process.env.PEXELS_API_KEY },
        params: { query: "rain", per_page: 1 },
      }
    );
    return response.data.videos?.[0]?.video_files?.[0]?.link || "rain-video";
  } catch {
    return "rain-video";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  try {
    const video = await getVideo();
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const desc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    
    const { data } = await supabase.from("videos").insert([{
      id: uuidv4(),
      title: title,
      file_path: video,
      status: "ready",
    }]).select();

    res.status(200).json({
      status: "success",
      title: title,
      description: desc,
      tags: TAGS,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
