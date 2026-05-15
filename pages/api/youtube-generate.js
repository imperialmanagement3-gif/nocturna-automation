import { google } from 'googleapis';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

const TITLES = [
  "Lluvia fuerte para dormir profundamente | Sueño reparador 8 horas",
  "Dormir YA con lluvia torrencial y truenos | Sonidos relajantes",
  "Lluvia para dormir 8 horas sin insomnio",
];

const TAGS = ["lluvia", "dormir", "sueño profundo", "relajante", "truenos", "tormenta", "sonidos naturales", "ASMR"];

async function getPexelsVideo() {
  try {
    const response = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query: "heavy rain", per_page: 1 },
    });
    return response.data.videos[0].video_files[0].link;
  } catch (e) {
    return "https://cdn.coverr.co/videos/coverr-rain-falling-outside-window-2559/1080p.mp4";
  }
}

function getYoutubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost"
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

async function uploadToYoutube(videoPath, title) {
  const youtube = getYoutubeClient();
  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: { title, tags: TAGS, categoryId: "22" },
      status: { privacyStatus: "public" },
    },
    media: { body: fs.createReadStream(videoPath) },
  });
  return response.data.id;
}

export default async function handler(req, res) {
  try {
    const videoUrl = await getPexelsVideo();
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const videoId = await uploadToYoutube("/tmp/video.mp4", title);
    
    return res.status(200).json({
      success: true,
      videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
