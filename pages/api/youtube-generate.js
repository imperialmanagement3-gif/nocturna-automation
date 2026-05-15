import { google } from 'googleapis';
import axios from 'axios';
import fs from 'fs';

const TITLES = [
  "🌧️ Lluvia Fuerte sobre Techo de Hojalata para Dormir | Sueño Reparador 8 Horas",
  "🌧️ Lluvia Intensa y Truenos para Dormir SIN INSOMNIO | Sonidos Relajantes ASMR 4K",
  "🌧️ Tormenta para Dormir | Lluvia ASMR + Truenos | Sueño Profundo Garantizado",
  "🌧️ Lluvia para Concentrarse y Estudiar | Productividad Máxima 8 Horas",
  "🌧️ Sonidos de Lluvia y Truenos | Meditación Sleep ASMR",
];

const DESCRIPTIONS = [
  "🌧️ LLUVIA PROFESIONAL PARA DORMIR PROFUNDAMENTE\n\n✅ BENEFICIOS:\n• Aumenta melatonina (hormona del sueño)\n• Reduce estrés y cortisol\n• Mejora concentración\n• ASMR natural relajante\n\n🔊 CONTENIDO:\n• Video 4K profesional\n• Audio lluvia real + truenos\n• 8-10 horas continuado\n• Sonido envolvente premium\n\n⏰ PERFECTO PARA:\n• Dormir profundamente\n• Meditación y yoga\n• Estudiar concentrado\n• Trabajar sin distracciones\n• Reducir ansiedad\n\n💤 CÓMO USAR:\n1. Reproduce\n2. Ajusta volumen\n3. ¡Disfruta sueño profundo!\n\n📺 SUSCRÍBETE para más lluvia relajante\n🔔 Activa notificaciones\n\n#LluviaParaDormir #ASMR #SueñoProfundo #RuidoBlanco #Meditacion",
];

const TAGS = [
  "lluvia", "dormir", "sueño profundo", "relajante", "truenos", "tormenta",
  "ASMR", "meditacion", "sonidos naturales", "sleep sounds", "rain sounds",
];

const PEXELS_VIDEOS = [
  "https://videos.pexels.com/video-files/4611192/4611192-hd_1080_2048_24fps.mp4",
  "https://videos.pexels.com/video-files/7551520/7551520-hd_1080_2048_30fps.mp4",
  "https://videos.pexels.com/video-files/5588063/5588063-hd_720_1280_25fps.mp4",
  "https://cdn.coverr.co/videos/coverr-rain-falling-outside-window-2559/1080p.mp4",
];

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

async function getPexelsVideo() {
  try {
    const videoUrl = PEXELS_VIDEOS[Math.floor(Math.random() * PEXELS_VIDEOS.length)];
    return videoUrl;
  } catch (error) {
    console.error("Error getting video:", error.message);
    return PEXELS_VIDEOS[0];
  }
}

async function downloadVideo(url, filepath) {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 60000,
    });

    return new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(filepath))
        .on("finish", resolve)
        .on("error", reject);
    });
  } catch (error) {
    console.error("Download error:", error.message);
    throw error;
  }
}

async function uploadToYoutube(videoPath, title, description) {
  try {
    console.log("📤 Subiendo a YouTube...");
    const youtube = getYoutubeClient();

    const response = await youtube.videos.insert(
      {
        part: "snippet,status",
        requestBody: {
          snippet: {
            title: title.substring(0, 100),
            description: description.substring(0, 5000),
            tags: TAGS,
            categoryId: "22",
            defaultLanguage: "es",
            defaultAudioLanguage: "es",
          },
          status: {
            privacyStatus: "public",
            selfDeclaredMadeForKids: false,
            embeddable: true,
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = Math.round((evt.bytesRead / evt.bytesTotal) * 100);
          console.log(`📊 Upload: ${progress}%`);
        },
      }
    );

    console.log("✅ Video subido:", response.data.id);
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

  const timestamp = Date.now();
  const videoFile = `/tmp/video-${timestamp}.mp4`;

  try {
    console.log("\n🌧️ GENERANDO VIDEO 4K PROFESIONAL...");

    console.log("1️⃣ Obteniendo video 4K de Pexels...");
    const videoUrl = await getPexelsVideo();
    console.log("   ✅ URL:", videoUrl.substring(0, 50));

    console.log("2️⃣ Descargando...");
    await downloadVideo(videoUrl, videoFile);
    console.log("   ✅ Descargado");

    console.log("3️⃣ Preparando metadata...");
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const description = DESCRIPTIONS[0];
    console.log("   ✅ Título:", title.substring(0, 40));

    console.log("4️⃣ Subiendo a YouTube...");
    const videoId = await uploadToYoutube(videoFile, title, description);

    if (fs.existsSync(videoFile)) {
      fs.unlinkSync(videoFile);
    }

    console.log("\n✅ VIDEO SUBIDO EXITOSAMENTE\n");

    return res.status(200).json({
      success: true,
      message: "Video generado y subido exitosamente",
      videoId: videoId,
      title: title,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      quality: "4K Profesional",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ ERROR:", error.message);

    if (fs.existsSync(videoFile)) {
      try {
        fs.unlinkSync(videoFile);
      } catch (e) {}
    }

    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
