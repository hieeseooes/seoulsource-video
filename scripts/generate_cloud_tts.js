// ── remotion-engine/scripts/generate_cloud_tts.js ──
// Otomatis dipanggil oleh GitHub Actions sebelum "remotion render"
// Mengenerate voiceover presenter AI via Gemini TTS (1 Call / Hemat RPD) & sinkronisasi otomatis durasi scene

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Mendeteksi titik jeda hening (breath pauses) antar kalimat untuk membagi durasi scene secara presisi.
 */
function calculateSceneDurations(pcmBuf, numScenes, totalDurationSec, sceneTexts = []) {
  const sampleRate = 24000;
  const numSamples = Math.floor(pcmBuf.length / 2);
  const chunkSize = Math.floor(sampleRate * 0.1); // 100ms window

  const energies = [];
  for (let i = 0; i < numSamples - chunkSize; i += chunkSize) {
    let sumSq = 0;
    for (let j = 0; j < chunkSize; j++) {
      const sample = pcmBuf.readInt16LE((i + j) * 2);
      sumSq += sample * sample;
    }
    const rms = Math.sqrt(sumSq / chunkSize);
    energies.push({ time: i / sampleRate, rms });
  }

  // Deteksi periode hening (RMS < 600, durasi jeda >= 0.35s)
  const silences = [];
  let silenceStart = null;
  for (const { time, rms } of energies) {
    if (rms < 600) {
      if (silenceStart === null) silenceStart = time;
    } else {
      if (silenceStart !== null) {
        const dur = time - silenceStart;
        // Abaikan silence di awal (< 0.5s) atau di ujung akhir (> totalDuration - 0.5s)
        if (dur >= 0.35 && silenceStart > 0.5 && time < totalDurationSec - 0.5) {
          silences.push({ start: silenceStart, end: time, mid: (silenceStart + time) / 2, dur });
        }
        silenceStart = null;
      }
    }
  }

  console.log(`🎙️ [CloudTTS] Ditemukan ${silences.length} jeda hening untuk ${numScenes} scene:`, silences.map(s => `${s.start.toFixed(2)}s-${s.end.toFixed(2)}s (dur: ${s.dur.toFixed(2)}s)`));

  const expectedCuts = numScenes - 1;
  let cutPoints = [];

  if (silences.length === expectedCuts) {
    cutPoints = silences.map(s => s.mid);
  } else if (silences.length > expectedCuts) {
    // Ambil top jeda terpanjang dan urutkan kembali secara kronologis
    const topSilences = [...silences].sort((a, b) => b.dur - a.dur).slice(0, expectedCuts);
    topSilences.sort((a, b) => a.mid - b.mid);
    cutPoints = topSilences.map(s => s.mid);
  } else {
    // Fallback cerdas: distribusi berbobot berdasarkan karakter + tanda baca
    console.warn(`⚠️ [CloudTTS] Jumlah jeda (${silences.length}) tidak cocok dengan pemisah scene (${expectedCuts}), menggunakan distribusi proporsional berbobot.`);
    const weights = sceneTexts.map(t => {
      const s = t || "";
      return Math.max(10, s.length + (s.match(/,/g) || []).length * 8 + (s.match(/[.!?]/g) || []).length * 15);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const durations = weights.map(w => (w / totalWeight) * totalDurationSec);
    return durations.map(d => Number(d.toFixed(2)));
  }

  const durations = [];
  let prevCut = 0;
  for (let i = 0; i < cutPoints.length; i++) {
    durations.push(Number((cutPoints[i] - prevCut).toFixed(2)));
    prevCut = cutPoints[i];
  }
  durations.push(Number((totalDurationSec - prevCut).toFixed(2)));

  return durations;
}

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

  const scenes = Array.isArray(props.scenes) ? props.scenes : [];
  const sceneTexts = scenes.map((s) => s.subtext || s.caption || "").filter(Boolean);

  // Jika naskah scene tersedia, pisahkan dengan double newline agar narator memberi jeda napas
  let cleanScript = "";
  if (sceneTexts.length > 0) {
    cleanScript = sceneTexts.join("\n\n");
  } else if (props.voiceoverScript) {
    cleanScript = props.voiceoverScript;
  }

  cleanScript = cleanScript.replace(/[*_#`"]/g, "").trim();
  if (!cleanScript) {
    console.log("ℹ️ [CloudTTS] Tidak ada teks narasi untuk TTS, lewati.");
    return;
  }

  console.log(`🎙️ [CloudTTS] Menghasilkan voiceover satu putaran (1 RPD) untuk ${scenes.length} scene (${cleanScript.length} karakter)...`);

  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const voiceName = props.voiceName || "Zephyr";
  const outputPath = path.join(publicDir, "voiceover.wav");
  const tempPcmPath = path.join(publicDir, "temp_tts.pcm");

  // Director-Style Prompting Zephyr dengan instruksi jeda napas yang jelas antar paragraf
  const directedSpeechText = `[Audio Profile: Casual and composed Indonesian news narrator. Smooth cadence, clear articulation, friendly and neutral demeanor.]
[Director's Notes: Conversational delivery, steady rhythm, calm and pleasant. Take a distinct, clear pause of one second between each sentence block.]

${cleanScript}`;

  const models = [
    "gemini-2.5-flash-preview-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts",
    "gemini-3.8-flash-lite-tts",
  ];

  let success = false;
  let pcmBuffer = null;

  for (const model of models) {
    if (success) break;
    for (const apiKey of apiKeys) {
      if (success) break;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: directedSpeechText }] }],
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
          pcmBuffer = Buffer.from(inlineData.data, "base64");
          fs.writeFileSync(tempPcmPath, pcmBuffer);

          // Convert raw 24kHz PCM mono to standard WAV
          execSync(
            `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${tempPcmPath}" "${outputPath}"`,
            { stdio: "ignore" }
          );

          try { fs.unlinkSync(tempPcmPath); } catch {}

          if (fs.existsSync(outputPath)) {
            console.log(`✅ [CloudTTS] Voiceover WAV siap di ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
            success = true;
          }
        }
      } catch (err) {
        console.warn(`[CloudTTS] ⚠️ Error on ${model}:`, err.message);
      }
    }
  }

  if (success && pcmBuffer) {
    const totalDurationSec = (pcmBuffer.length / 2) / 24000;
    props.voiceoverAudio = "voiceover.wav";

    // Hitung dan kunci durasi tiap scene secara presisi dari titik jeda hening audio
    if (scenes.length > 1) {
      const sceneDurations = calculateSceneDurations(pcmBuffer, scenes.length, totalDurationSec, sceneTexts);
      console.log(`🎯 [CloudTTS] Mengunci durasi scene Remotion berdasarkan gelombang audio riil:`);
      scenes.forEach((s, idx) => {
        s.durationInSeconds = sceneDurations[idx];
        console.log(`   [Scene ${idx + 1}/${scenes.length}] Durasi: ${s.durationInSeconds}s | "${(s.caption || '').slice(0, 30)}"`);
      });
    }

    fs.writeFileSync(propsFile, JSON.stringify(props, null, 2), "utf-8");
    console.log("✅ [CloudTTS] input-props.json diperbarui dengan voiceoverAudio & durasi scene presisi (Zero Desync)!");
  } else {
    console.warn("⚠️ [CloudTTS] Gagal generate TTS di cloud, render video akan menggunakan audio background asli.");
  }
}

main().catch((e) => {
  console.error("❌ [CloudTTS] Fatal:", e);
});
