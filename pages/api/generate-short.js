import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TITLES = ["Lluvia fuerte para dormir", "Dormir con lluvia", "Lluvia relajante"];

export default async function handler(req, res) {
  try {
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const { data } = await supabase.from("videos").insert([{
      id: uuidv4(),
      title: title,
      status: "ready",
    }]).select();
    res.status(200).json({ status: "success", videoId: data[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
