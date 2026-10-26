import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  OffthreadVideo,
  staticFile,
} from 'remotion';

export interface Scene {
  image: string;
  caption?: string;
  subtext?: string;
  durationInSeconds?: number;
}

export interface ReelProps {
  title: string;
  category?: string;
  author?: string;
  scenes: Scene[];
  audioUrl?: string;
  musicUrl?: string;
  backgroundVideo?: string;
  voiceoverAudio?: string;
  voiceoverScript?: string;
}

export const defaultReelProps: ReelProps = {
  title: "Konfrontasi Rahasia di Sidang Terakhir",
  category: "K-DRAMA RECAP",
  author: "Seola @ SeoulSource",
  scenes: [
    {
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1080&q=80",
      caption: "Dokumen rahasia akhirnya terkuak di ruang sidang.",
      subtext: "Semua bukti pembelaan ternyata sudah dimanipulasi sejak awal.",
      durationInSeconds: 4,
    },
    {
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&q=80",
      caption: "Tatapan dingin sang jaksa mengubah jalannya perdebatan.",
      subtext: "\"Dunia luar gak sebersih ruang sidangmu, Pimpinan.\"",
      durationInSeconds: 4,
    },
    {
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80",
      caption: "Surat pengunduran diri ditaruh di meja sebelum fajar.",
      subtext: "Pilihan tersulit bukan menang sidang, tapi tetap punya nurani.",
      durationInSeconds: 4,
    },
  ],
};

// Helper: Auto-scale font size adapted from useAutoScaleText in Vue image editor
const getAutoScaleFontSize = (
  text: string = '',
  maxFontSize: number,
  minFontSize: number,
  baseLengthThreshold: number = 30,
  stepFactor: number = 0.20
): number => {
  if (!text) return maxFontSize;
  const len = text.trim().length;
  if (len <= baseLengthThreshold) return maxFontSize;
  const excess = len - baseLengthThreshold;
  const calculated = Math.round(maxFontSize - excess * stepFactor);
  return Math.max(minFontSize, Math.min(maxFontSize, calculated));
};

// Helper: Format subtext quotes with ArticleSlide styling and auto-scaled font
const renderArticleSubtext = (text?: string) => {
  if (!text) return null;
  const subtextSize = getAutoScaleFontSize(text, 24, 17, 70, 0.08);
  const quoteSize = Math.max(16, subtextSize - 2);

  if (text.includes('"')) {
    const parts = text.split(/(".*?")/g);
    return (
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: `${subtextSize}px`,
          fontWeight: 600,
          lineHeight: 1.45,
          color: '#1a1a1a',
          marginTop: '6px',
        }}
      >
        {parts.map((p, idx) =>
          p.startsWith('"') && p.endsWith('"') ? (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                backgroundColor: '#0A0A0A',
                color: '#00DC82',
                padding: '4px 12px',
                borderRadius: '4px',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: `${quoteSize}px`,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: '2px 0',
                boxShadow: '3px 3px 0px #FF6B9D',
              }}
            >
              {p.toUpperCase()}
            </span>
          ) : (
            <span key={idx}>{p}</span>
          )
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: `${subtextSize}px`,
        fontWeight: 500,
        lineHeight: 1.48,
        color: '#2a2a2a',
        marginTop: '6px',
      }}
    >
      {text}
    </div>
  );
};

const SingleScene: React.FC<{
  scene: Scene;
  sceneDurationFrames: number;
  index: number;
  totalScenes: number;
  hasGlobalBgVideo?: boolean;
}> = ({ scene, sceneDurationFrames, index, totalScenes, hasGlobalBgVideo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snappy Ken Burns scale & pan
  const scale = interpolate(frame, [0, sceneDurationFrames], [1.0, 1.08], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, sceneDurationFrames], [0, -10], {
    extrapolateRight: 'clamp',
  });

  // Dynamic Pan & Scan for Photo inside the Polaroid Frame
  // Scene Ganjil: Pan Vertikal (Atas ke Bawah) - Ideal untuk foto portrait agar wajah dan baju terlihat utuh
  // Scene Genap: Pan Horizontal (Kiri ke Kanan) - Bagus untuk foto grup/stage
  const photoPanY = interpolate(frame, [0, sceneDurationFrames], [-8, 8], {
    extrapolateRight: 'clamp',
  });
  const photoPanX = interpolate(frame, [0, sceneDurationFrames], [-6, 6], {
    extrapolateRight: 'clamp',
  });
  const photoZoom = interpolate(frame, [0, sceneDurationFrames], [1.16, 1.22], {
    extrapolateRight: 'clamp',
  });

  const photoTransform =
    index % 2 === 0
      ? `scale(${photoZoom}) translateY(${photoPanY}%)`
      : `scale(${photoZoom}) translateX(${photoPanX}%)`;

  // Snappy Bouncy Pop-In Animation (Sticker slap overshoot!)
  const popSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 210, mass: 0.5 },
  });

  const stickerScale = interpolate(popSpring, [0, 1], [0.85, 1]);
  const stickerOpacity = interpolate(popSpring, [0, 1], [0, 1]);

  // Subtle breathing float on sticker card
  const floatY = Math.sin(frame / 10) * 3;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: hasGlobalBgVideo ? 'transparent' : '#0A0A0A' }}>
      {/* Background Media with High Contrast (Only if no global background video) */}
      {!hasGlobalBgVideo && scene.image && (
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${scale}) translateY(${translateY}px)`,
            transformOrigin: 'center center',
            filter: 'contrast(1.06) saturate(1.12)',
          }}
        >
          <Img
            src={scene.image}
            style={{
              width: '1080px',
              height: '1920px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* If global video exists, render Photo as Brutalist Polaroid Evidence Card in Center */}
      {hasGlobalBgVideo && scene.image && (
        <div
          style={{
            position: 'absolute',
            top: '250px',
            left: '60px',
            right: '60px',
            height: '750px',
            backgroundColor: '#FAF9F5',
            border: '4px solid #0A0A0A',
            boxShadow: '10px 10px 0px #FF6B9D',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transform: `scale(${stickerScale}) translateY(${floatY}px) rotate(-1.2deg)`,
            opacity: stickerOpacity,
            zIndex: 35,
          }}
        >
          {/* Paper Corner Crop Ticks */}
          <div style={{ position: 'absolute', top: '6px', left: '6px', width: '12px', height: '12px', borderTop: '2px solid rgba(10,10,10,0.3)', borderLeft: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', top: '6px', right: '6px', width: '12px', height: '12px', borderTop: '2px solid rgba(10,10,10,0.3)', borderRight: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '12px', height: '12px', borderBottom: '2px solid rgba(10,10,10,0.3)', borderLeft: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '12px', height: '12px', borderBottom: '2px solid rgba(10,10,10,0.3)', borderRight: '2px solid rgba(10,10,10,0.3)' }} />

          {/* Top Tape Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#0A0A0A',
                color: '#00DC82',
                padding: '4px 10px',
                borderRadius: '3px',
                letterSpacing: '0.08em',
              }}
            >
              [ EVIDENCE PHOTO // NETIZEN ARCHIVE ]
            </span>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                color: '#0A0A0A',
              }}
            >
              FIG. 0{index + 1}
            </span>
          </div>

          {/* Photo Frame */}
          <div
            style={{
              flex: 1,
              width: '100%',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '2px solid #0A0A0A',
              position: 'relative',
            }}
          >
            <Img
              src={scene.image}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: photoTransform,
                transformOrigin: 'center center',
              }}
            />
          </div>
        </div>
      )}

      {/* Halftone Dot Grid Overlay (from ArticleSlide.vue line 99-102) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.14,
          pointerEvents: 'none',
        }}
      />

      {/* Top & Bottom Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.3) 15%, transparent 35%, transparent 62%, rgba(10,10,10,0.55) 80%, rgba(10,10,10,0.94) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Lower-Third: ArticleSlide Memo Card */}
      {/* Safe Zone: bottom: 270px, right: 140px */}
      <div
        style={{
          position: 'absolute',
          bottom: '270px',
          left: '50px',
          right: '140px',
          transform: `scale(${stickerScale}) translateY(${floatY}px) rotate(1.2deg)`,
          opacity: stickerOpacity,
          transformOrigin: 'bottom left',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 40,
        }}
      >
        {/* Tape Tag Label (Space Mono, uppercase) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              border: '3px solid #0A0A0A',
              boxShadow: '4px 4px 0px #FF6B9D',
              fontFamily: "'Space Mono', monospace",
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '6px 16px',
              borderRadius: '4px',
            }}
          >
            [ SCENE {String(index + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')} // CATATAN SEOLA ]
          </div>
        </div>

        {/* Paper Card with ArticleSlide Border & Shadow */}
        <div
          style={{
            backgroundColor: '#FAF9F5',
            border: '3.5px solid #0A0A0A',
            boxShadow: '8px 8px 0px #00DC82',
            padding: '24px 28px',
            borderRadius: '12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Paper Corner Crop Ticks (from ArticleSlide.vue line 130-133) */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', width: '12px', height: '12px', borderTop: '2px solid rgba(10,10,10,0.3)', borderLeft: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '12px', height: '12px', borderTop: '2px solid rgba(10,10,10,0.3)', borderRight: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '12px', height: '12px', borderBottom: '2px solid rgba(10,10,10,0.3)', borderLeft: '2px solid rgba(10,10,10,0.3)' }} />
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '12px', height: '12px', borderBottom: '2px solid rgba(10,10,10,0.3)', borderRight: '2px solid rgba(10,10,10,0.3)' }} />

          {/* Main Caption with AutoScale */}
          {scene.caption && (
            <div
              style={{
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontSize: `${getAutoScaleFontSize(scene.caption, 34, 22, 35, 0.22)}px`,
                fontWeight: 900,
                lineHeight: 1.22,
                color: '#0A0A0A',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {scene.caption}
            </div>
          )}

          {/* Subtext Paragraph */}
          {scene.subtext && renderArticleSubtext(scene.subtext)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SeoulSourceReel: React.FC<ReelProps> = (props) => {
  const mergedProps = { ...defaultReelProps, ...props };
  const { title, category, scenes, audioUrl, musicUrl, backgroundVideo, voiceoverAudio } = mergedProps;
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const bgVideoSrc = backgroundVideo
    ? (backgroundVideo.startsWith('http') ? backgroundVideo : staticFile(backgroundVideo))
    : null;

  const voiceoverSrc = voiceoverAudio
    ? (voiceoverAudio.startsWith('http') ? voiceoverAudio : staticFile(voiceoverAudio))
    : (audioUrl ? (audioUrl.startsWith('http') ? audioUrl : staticFile(audioUrl)) : null);

  // Calculate sequence offsets
  let accumulatedFrames = 0;
  const sceneItems = scenes.map((scene, i) => {
    const durSec = scene.durationInSeconds || 4;
    const durFrames = Math.round(durSec * fps);
    const item = {
      scene,
      from: accumulatedFrames,
      durationInFrames: durFrames,
      index: i,
    };
    accumulatedFrames += durFrames;
    return item;
  });

  // Progress Ratio (0 to 1)
  const progressRatio = Math.min(1, frame / Math.max(1, durationInFrames));
  const progressBarWidth = progressRatio * 1080;

  // -------------------------------------------------------------
  // 📹 MOVING Y2K OVERLAY LOGIC (DYNAMIC & ALIVE)
  // -------------------------------------------------------------

  // 1. Rolling VHS Horizontal Tracking Interference Bar
  const vhsRollingY = (frame * 5.2) % 2100 - 100;

  // 2. Continuous Realtime Camcorder Timecode
  const currentSec = Math.floor(frame / fps);
  const currentMilli = Math.floor(((frame % fps) / fps) * 99);
  const isRecBlinking = Math.floor(frame / 12) % 2 === 0;

  // 3. Animated Rotating Y2K Sparkle (✦)
  const starRotation = (frame * 2.5) % 360;

  // 4. Moving Diagonal Caution Stripes Pattern Offset
  const stripeOffset = (frame * 2) % 40;

  // 5. Breathing float on Upper Hook Sticker
  const hookFloatY = Math.sin(frame / 14) * 2.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        fontFamily: "'Cabinet Grotesk', 'Space Mono', sans-serif",
      }}
    >
      {/* Load Fonts: Cabinet Grotesk + Space Mono + Inter */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700;800;900&display=swap');
        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Optional Audio Layers & Voiceover (25% BGM / 90% TTS) */}
      {voiceoverSrc && <Audio src={voiceoverSrc} volume={0.90} />}
      {musicUrl && <Audio src={musicUrl} volume={voiceoverSrc ? 0.12 : 0.25} />}

      {/* Dynamic Moving Background Video (Fancam / Stage / Trailer) */}
      {bgVideoSrc && (
        <OffthreadVideo
          src={bgVideoSrc}
          style={{
            position: 'absolute',
            inset: 0,
            width: '1080px',
            height: '1920px',
            objectFit: 'cover',
            filter: 'contrast(1.08) brightness(0.68) saturate(1.15)',
          }}
          volume={(f) => {
            const baseVol = voiceoverSrc ? 0.25 : 0.70;
            const fadeOutDuration = Math.round(fps * 1.5);
            const fadeStart = durationInFrames - fadeOutDuration;
            if (f < fadeStart) return baseVol;
            return interpolate(f, [fadeStart, durationInFrames], [baseVol, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }}
        />
      )}

      {/* Render Scenes sequentially */}
      {sceneItems.map((item) => (
        <Sequence
          key={item.index}
          from={item.from}
          durationInFrames={item.durationInFrames}
        >
          <SingleScene
            scene={item.scene}
            sceneDurationFrames={item.durationInFrames}
            index={item.index}
            totalScenes={scenes.length}
            hasGlobalBgVideo={Boolean(bgVideoSrc)}
          />
        </Sequence>
      ))}

      {/* ============================================================ */}
      {/* 📺 MOVING Y2K OVERLAY: ROLLING VHS TRACKING BAR (GERAK!)     */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          top: `${vhsRollingY}px`,
          left: 0,
          right: 0,
          height: '70px',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 50%, rgba(0,220,130,0.04) 70%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 50,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      />

      {/* ============================================================ */}
      {/* 📹 Y2K RETRO CAMCORDER / VHS HUD OVERLAY (PERSISTENT)         */}
      {/* ============================================================ */}

      {/* Corner Brackets ⌜ ⌝ ⌞ ⌟ */}
      <div style={{ position: 'absolute', top: '50px', left: '44px', width: '28px', height: '28px', borderTop: '3px solid rgba(255,255,255,0.7)', borderLeft: '3px solid rgba(255,255,255,0.7)', zIndex: 60 }} />
      <div style={{ position: 'absolute', top: '50px', right: '44px', width: '28px', height: '28px', borderTop: '3px solid rgba(255,255,255,0.7)', borderRight: '3px solid rgba(255,255,255,0.7)', zIndex: 60 }} />
      <div style={{ position: 'absolute', bottom: '50px', left: '44px', width: '28px', height: '28px', borderBottom: '3px solid rgba(255,255,255,0.7)', borderLeft: '3px solid rgba(255,255,255,0.7)', zIndex: 60 }} />
      <div style={{ position: 'absolute', bottom: '50px', right: '44px', width: '28px', height: '28px', borderBottom: '3px solid rgba(255,255,255,0.7)', borderRight: '3px solid rgba(255,255,255,0.7)', zIndex: 60 }} />

      {/* Top Camcorder Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '60px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 65,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {/* Blinking REC + Live Ticking Milliseconds */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: isRecBlinking ? '#FF0055' : 'transparent',
              boxShadow: isRecBlinking ? '0 0 14px #FF0055' : 'none',
              border: '2px solid #FF0055',
            }}
          />
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            REC [00:{String(currentSec).padStart(2, '0')}:{String(currentMilli).padStart(2, '0')}]
          </span>
        </div>

        {/* SP ▶ 1080HD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#00DC82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            SP ▶ 1080HD
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#FFFFFF',
              backgroundColor: '#0A0A0A',
              border: '1.5px solid #FFFFFF',
              padding: '2px 8px',
              textTransform: 'uppercase',
            }}
          >
            BAT [▮▮▯]
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ⚡ ARTICLESLIDE TILTED STICKER HOOK (UPPER-THIRD)             */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          left: '50px',
          right: '140px',
          transform: `translateY(${hookFloatY}px) rotate(-1.5deg)`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '10px',
          zIndex: 55,
        }}
      >
        {/* Tape Sticker Label (from ArticleSlide.vue line 113-117) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: '#0A0A0A',
            border: '3px solid #0A0A0A',
            borderRadius: '4px',
            padding: '8px 22px',
            boxShadow: '4px 4px 0px #00DC82',
          }}
        >
          {/* Animated Rotating Star */}
          <span
            style={{
              display: 'inline-block',
              color: '#00DC82',
              fontSize: '22px',
              fontWeight: 900,
              transform: `rotate(${starRotation}deg)`,
            }}
          >
            ✦
          </span>

          <span
            style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontSize: '20px',
              fontWeight: 900,
              color: '#00DC82',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            SEOUL SOURCE
          </span>

          <div style={{ height: '16px', width: '2px', background: 'rgba(255,255,255,0.3)' }} />

          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '15px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {category || 'K-DRAMA RECAP'}
          </span>
        </div>

        {/* Headline Card (Cabinet Grotesk 900, UPPERCASE, Paper White + Pink Shadow) */}
        <div
          style={{
            backgroundColor: '#FAF9F5',
            color: '#0A0A0A',
            border: '3.5px solid #0A0A0A',
            boxShadow: '8px 8px 0px #FF6B9D',
            padding: '18px 24px',
            borderRadius: '4px',
            maxWidth: '860px',
          }}
        >
          <div
            style={{
              fontFamily: "'Cabinet Grotesk', sans-serif",
              fontSize: `${getAutoScaleFontSize(title, 44, 26, 30, 0.20)}px`,
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📟 Y2K DATE & WATERMARK (BOTTOM-LEFT) (UPPERCASE)             */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50px',
          zIndex: 65,
          fontFamily: "'Space Mono', monospace",
          fontSize: '16px',
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: '#0A0A0A',
          padding: '4px 14px',
          border: '1.5px solid #FFFFFF',
          boxShadow: '2px 2px 0px rgba(255,255,255,0.3)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        OCT 21, 2026 // @SEOULSOURCE_
      </div>

      {/* ============================================================ */}
      {/* 🏁 ANIMATED CAUTION STRIPES PROGRESS BAR (VERY TOP) (GERAK!) */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '1080px',
          height: '8px',
          backgroundColor: '#0A0A0A',
          zIndex: 100,
          borderBottom: '2px solid #0A0A0A',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressBarWidth}px`,
            backgroundImage:
              'repeating-linear-gradient(45deg, #00DC82, #00DC82 12px, #0A0A0A 12px, #0A0A0A 24px)',
            backgroundPosition: `${stripeOffset}px 0px`,
            borderRight: '3px solid #0A0A0A',
            boxShadow: '0 0 10px #00DC82',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
