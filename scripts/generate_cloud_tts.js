// ── remotion-engine/scripts/generate_cloud_tts.js ──
// Otomatis dipanggil oleh GitHub Actions sebelum "remotion render"
// Mengenerate voiceover presenter AI via Gemini TTS & menyimpannya di public/voiceover.wav

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

async function main() {
  console.log("🎙️ [CloudTTS] Memeriksa input props untuk voiceover...");

  const rawKeyEnv = process.env.GEMINI_API_KEY || "";
  const apiKeys = rawKeyEnv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (apiKeys.length === 0) {
    console.warn("⚠️ [CloudTTS] GEMINI_API_KEY secret tidak disetel, lewati Cloud TTS.");
    return;
  }

  const propsFile = path.resolve("input-props.json");
  if (!fs.existsSync(propsFile)) {
    console.log("ℹ️ [CloudTTS] input-props.json tidak ditemukan, lewati.");
    return;
  }

  let props;
  try {
    props = JSON.parse(fs.readFileSync(propsFile, "utf-8"));
  } catch (e) {
    console.error("❌ [CloudTTS] Gagal membaca input-props.json:", e.message);
    return;
  }

  // Ambil naskah dari voiceoverScript atau gabungkan dari seluruh subtext scene
  let text = props.voiceoverScript || "";
  if (!text && Array.isArray(props.scenes)) {
    text = props.scenes
      .map((s) => s.subtext || s.caption || "")
      .filter(Boolean)
      .join(". ");
  }

  const cleanText = text.replace(/[*_#`"]/g, "").trim();
  if (!cleanText) {
    console.log("ℹ️ [CloudTTS] Tidak ada teks narasi untuk TTS, lewati.");
    return;
  }

  console.log(`🎙️ [CloudTTS] Menghasilkan voiceover untuk (${cleanText.length} karakter, ${apiKeys.length} API keys aktif)...`);

  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const voiceName = props.voiceName || "Kore";
  const outputPath = path.join(publicDir, "voiceover.wav");
  const tempPcmPath = path.join(publicDir, "temp_tts.pcm");

  const models = [
    "gemini-2.5-flash-preview-tts",
    "gemini-3.1-flash-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.8-flash-lite-tts",
  ];

  let success = false;

  for (const model of models) {
    if (success) break;
    for (const apiKey of apiKeys) {
      if (success) break;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[CloudTTS] ⚠️ Model ${model} / key ${apiKey.slice(0, 10)}... returned HTTP ${res.status}: ${errText.slice(0, 90)}`);
          continue;
        }

        const data = await res.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (inlineData?.data) {
          const pcmBuf = Buffer.from(inlineData.data, "base64");
          fs.writeFileSync(tempPcmPath, pcmBuf);

          // Convert raw 24kHz PCM mono to standard WAV (natural gain, zero distortion)
          execSync(
            `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${tempPcmPath}" "${outputPath}"`,
            { stdio: "ignore" }
          );

          try { fs.unlinkSync(tempPcmPath); } catch {}

          if (fs.existsSync(outputPath)) {
            console.log(`✅ [CloudTTS] Voiceover WAV siap di ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB) menggunakan ${model}`);
            success = true;
          }
        }
      } catch (err) {
        console.warn(`[CloudTTS] ⚠️ Error on ${model}:`, err.message);
      }
    }
  }

  if (success) {
    props.voiceoverAudio = "voiceover.wav";
    fs.writeFileSync(propsFile, JSON.stringify(props, null, 2), "utf-8");
    console.log("✅ [CloudTTS] input-props.json diperbarui dengan voiceoverAudio = 'voiceover.wav'");
  } else {
    console.warn("⚠️ [CloudTTS] Gagal generate TTS di cloud, render video akan menggunakan audio background asli.");
  }
}

main().catch((e) => {
  console.error("❌ [CloudTTS] Fatal:", e);
});
