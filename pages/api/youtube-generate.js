import { google } from 'googleapis';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';

const TITLES = [
  "Lluvia fuerte para dormir profundamente | Sueño reparador 8 horas",
  "Dormir YA con lluvia torrencial y truenos | Sonidos relajantes",
  "Lluvia para dormir 8 horas sin insomnio",
  "Lluvia para concentrarse y estudiar | Productividad máxima",
];

const TAGS = ["lluvia", "dormir", "sueño profundo", "relajante", "truenos"];

async function getPexelsVideo() {
  try {
    const response = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query: "heavy rain", per_page: 1 },
    });
    if (response.data.videos && response.data.videos.length > 0) {
      return response.data.videos[0].video_files[0].link;
    }
  } catch (e) {
    console.log("Pexels error, using fallback");
  }
  return "https://cdn.coverr.co/videos/coverr-rain-falling-outside-window-2559/1080p.mp4";
}

function getYoutubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

async function downloadVideo(url, filepath) {
  const response = await axios.get(url, { responseType: "stream" });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(createWriteStream(filepath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function uploadToYoutube(videoPath, title) {
  try {
    const youtube = getYoutubeClient();
    const response = await youtube.videos.insert(
      {
        part: "snippet,status",
        requestBody: {
          snippet: {
            title: title.substring(0, 100),
            tags: TAGS,
            categoryId: "22",
          },
          status: {
            privacyStatus: "public",
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      },
      {
        onUploadProgress: (evt) => {
          console.log(
            `Upload ${Math.round((evt.bytesRead / evt.bytesTotal) * 100)}%`
          );
        },
      }
    );
    return response.data.id;
  } catch (error) {
    console.error("Upload error:", error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tmpFile = `/tmp/video-${Date.now()}.mp4`;

  try {
    console.log("1. Getting Pexels video...");
    const videoUrl = await getPexelsVideo();
    console.log("2. Downloading...");
    await downloadVideo(videoUrl, tmpFile);
    
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    console.log("3. Uploading to YouTube:", title);
    const videoId = await uploadToYoutube(tmpFile, title);

    // Cleanup
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      videoId: videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ERROR:", error);
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
