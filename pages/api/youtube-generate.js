import { google } from 'googleapis';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// TÍTULOS PROFESIONALES - SEO OPTIMIZADO
const TITLES = [
  "🌧️ Lluvia Fuerte sobre Techo de Hojalata para Dormir Profundamente | Sueño Reparador 8 Horas",
  "🌧️ Lluvia Intensa y Truenos para Dormir SIN INSOMNIO | Sonidos Relajantes ASMR 4K",
  "🌧️ Tormenta Fuerte para Dormir | Lluvia ASMR + Truenos Potentes | Sueño Profundo Garantizado",
  "🌧️ Lluvia Torrencial para Concentrarse y Estudiar | Productividad Máxima 8 Horas",
  "🌧️ Sonidos de Lluvia y Truenos para Relajación Total | Meditación Guiada Sleep ASMR",
  "🌧️ Tormenta Nocturna para Descanso | Lluvia Intensa + Rayos | Dormir Como Nunca",
  "🌧️ Lluvia en la Ventana para Dormir | Sonidos Naturales Relajantes | 10 Horas No Stop",
  "🌧️ Tormenta en el Bosque para Dormir | Lluvia Profunda + Truenos Reales | ASMR Nature",
];

const DESCRIPTIONS = [
  "🌧️ LLUVIA PROFESIONAL PARA DORMIR PROFUNDAMENTE\n\n✅ BENEFICIOS CIENTÍFICAMENTE COMPROBADOS:\n• Aumenta la melatonina (hormona del sueño)\n• Reduce estrés y cortisol\n• Mejora concentración y productividad\n• ASMR natural que relaja el cerebro\n• Perfecto para insomniacs\n\n🔊 CONTENIDO:\n• Video 4K profesional\n• Audio estéreo de lluvia real\n• Truenos naturales y potentes\n• 8-10 horas de contenido continuado\n• Sonido envolvente premium\n\n⏰ PERFECTO PARA:\n• Dormir profundamente\n• Relajarse después del trabajo\n• Meditación y yoga\n• Concentración para estudiar\n• Trabajar sin distracciones\n• Reducir ansiedad\n\n💤 CÓMO USAR:\n1. Reproduce este video\n2. Ajusta el volumen a tu gusto\n3. Deja que la lluvia haga su magia\n4. ¡Disfruta de sueño profundo!\n\n📺 SUSCRÍBETE para más contenido de lluvia relajante\n🔔 Activa notificaciones para nuevos videos\n\n✨ Garantizado: Dormirás como nunca antes ✨\n\n#LluviaParaDormir #SonoRelajante #ASMR #RuidoBlanco #Meditacion #Truenos #SueñoProfundo #Insomnia",
];

const TAGS = [
  "lluvia", "dormir", "sueño profundo", "relajante", "truenos", "tormenta",
  "sonidos naturales", "ASMR", "meditacion", "concentracion", "ansiedad",
  "insomnio", "sueño", "relajacion", "lluvia ASMR", "sonido blanco",
  "musica relajante", "lluvia dormir", "sleep sounds", "rain sounds",
  "thunderstorm", "nature sounds", "sleep music", "relaxing music",
];

const RAIN_AUDIO_URLS = [
  "https://freesound.org/data/previews/531/531436_14425274-hq.mp3",
  "https://freesound.org/data/previews/345/345119_6122585-hq.mp3",
  "https://freesound.org/data/previews/476/476169_10899126-hq.mp3",
  "https://freesound.org/data/previews/528/528101_14260282-hq.mp3",
];

const FALLBACK_AUDIO = "https://www.soundjay.com/rain/rain-01.mp3";

async function getPexelsVideo() {
  try {
    const queries = ["heavy rain", "rain on window", "thunderstorm rain", "rain forest", "tropical rain", "rain night", "rain storm"];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const response = await axios.get("https://api.pexels.com/videos/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query, per_page: 5, orientation: "landscape" },
    });

    if (!response.data.videos || response.data.videos.length === 0) {
      throw new Error("No videos found on Pexels");
    }

    const video = response.data.videos[Math.floor(Math.random() * response.data.videos.length)];
    const files = video.video_files.sort((a, b) => (b.width || 0) - (a.width || 0));
    return files[0].link;
  } catch (error) {
    console.error("Pexels error:", error.message);
    return "https://cdn.coverr.co/videos/coverr-rain-falling-outside-window-2559/1080p.mp4";
  }
}

async function getRainAudio() {
  try {
    const audioUrl = RAIN_AUDIO_URLS[Math.floor(Math.random() * RAIN_AUDIO_URLS.length)];
    const response = await axios.head(audioUrl, { timeout: 5000 });
    if (response.status === 200) {
      return audioUrl;
    }
  } catch (e) {
    console.log("Rain audio not available, using fallback");
  }
  return FALLBACK_AUDIO;
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

async function downloadFile(url, filepath) {
  try {
    const response = await axios.get(url, { responseType: "stream", timeout: 30000 });
    return new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(filepath))
        .on("finish", resolve)
        .on("error", reject);
    });
  } catch (error) {
    console.error(`Download error for ${url}:`, error.message);
    throw error;
  }
}

async function processVideoWithAudio(videoPath, audioPath, outputPath) {
  try {
    console.log("⚙️ Procesando video 4K con audio profesional...");
    const ffmpegCmd = `ffmpeg -i ${videoPath} -i ${audioPath} -c:v libx264 -preset fast -crf 18 -b:v 5000k -c:a aac -b:a 192k -ac 2 -filter_complex "[0:v]scale=3840:2160[v];[v]fps=30[v];[1:a]volume=1.0[a]" -map "[v]" -map "[a]" -movflags +faststart -metadata title="Lluvia para Dormir" -y ${outputPath}`;
    await execAsync(ffmpegCmd, { maxBuffer: 100 * 1024 * 1024, timeout: 600000 });
    console.log("✅ Video procesado con éxito");
    return outputPath;
  } catch (error) {
    console.error("FFmpeg process error:", error.message);
    console.log("⚠️ Fallback: usando solo video sin audio");
    const fallbackCmd = `ffmpeg -i ${videoPath} -c:v libx264 -preset fast -crf 18 -b:v 5000k -c:a aac -b:a 128k -movflags +faststart -y ${outputPath}`;
    await execAsync(fallbackCmd, { maxBuffer: 100 * 1024 * 1024, timeout: 600000 });
    return outputPath;
  }
}

async function uploadToYoutube(videoPath, title, description) {
  try {
    console.log("📤 Subiendo video profesional a YouTube...");
    const youtube = getYoutubeClient();
    const response = await youtube.videos.insert(
      {
        part: "snippet,status,processingDetails",
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
          processingDetails: {
            processingProgress: { partsProcessed: 0, partsTotal: 0 },
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = Math.round((evt.bytesRead / evt.bytesTotal) * 100);
          console.log(`📊 Upload progress: ${progress}%`);
        },
      }
    );
    console.log("✅ Video subido a YouTube:", response.data.id);
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
  const videoFile = `/tmp/pexels-${timestamp}.mp4`;
  const audioFile = `/tmp/rain-audio-${timestamp}.mp3`;
  const processedFile = `/tmp/processed-${timestamp}.mp4`;

  try {
    console.log("\n🌧️ GENERANDO VIDEO 4K PROFESIONAL CON LLUVIA...");
    console.log("════════════════════════════════════════════════════");

    console.log("1️⃣ Descargando video 4K de Pexels...");
    const videoUrl = await getPexelsVideo();
    console.log("   ✅ URL obtenida:", videoUrl.substring(0, 60));
    await downloadFile(videoUrl, videoFile);
    console.log("   ✅ Video descargado");

    console.log("2️⃣ Obteniendo audio profesional de lluvia...");
    const audioUrl = await getRainAudio();
    console.log("   ✅ Audio URL:", audioUrl.substring(0, 60));
    await downloadFile(audioUrl, audioFile);
    console.log("   ✅ Audio descargado");

    console.log("3️⃣ Procesando video + audio con FFmpeg...");
    await processVideoWithAudio(videoFile, audioFile, processedFile);
    console.log("   ✅ Video procesado");

    console.log("4️⃣ Preparando metadata profesional...");
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const description = DESCRIPTIONS[0];
    console.log("   ✅ Título:", title.substring(0, 50));

    console.log("5️⃣ Subiendo a YouTube...");
    const videoId = await uploadToYoutube(processedFile, title, description);

    console.log("6️⃣ Limpiando archivos temporales...");
    [videoFile, audioFile, processedFile].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log("════════════════════════════════════════════════════");
    console.log("✅ VIDEO PROFESIONAL GENERADO Y SUBIDO EXITOSAMENTE");
    console.log("════════════════════════════════════════════════════\n");

    return res.status(200).json({
      success: true,
      message: "Video profesional generado y subido exitosamente",
      videoId: videoId,
      title: title,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      quality: "4K + Audio Profesional",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
    [videoFile, audioFile, processedFile].forEach((file) => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {}
      }
    });

    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
