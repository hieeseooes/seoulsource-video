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

// Helper: Format subtext quotes with Brutalist Black Pill + Acid Green Text
const renderBrutalistSubtext = (text?: string) => {
  if (!text) return null;
  if (text.includes('"')) {
    const parts = text.split(/(".*?")/g);
    return (
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.35,
          color: '#1e293b',
          marginTop: '8px',
        }}
      >
        {parts.map((p, idx) =>
          p.startsWith('"') && p.endsWith('"') ? (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                backgroundColor: '#000000',
                color: '#ccff00',
                padding: '3px 10px',
                borderRadius: '4px',
                fontWeight: 900,
                letterSpacing: '0.01em',
                margin: '2px 0',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.3)',
              }}
            >
              {p}
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
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '24px',
        fontWeight: 600,
        lineHeight: 1.35,
        color: '#334155',
        marginTop: '8px',
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
}> = ({ scene, sceneDurationFrames, index, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snappy Ken Burns scale & pan
  const scale = interpolate(frame, [0, sceneDurationFrames], [1.0, 1.08], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, sceneDurationFrames], [0, -10], {
    extrapolateRight: 'clamp',
  });

  // Snappy Bouncy Pop-In Animation (Sticker slap overshoot!)
  const popSpring = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.5 },
  });

  const stickerScale = interpolate(popSpring, [0, 1], [0.82, 1]);
  const stickerOpacity = interpolate(popSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000000' }}>
      {/* Background Media with Raw Film Contrast */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center center',
          filter: 'contrast(1.08) saturate(1.1)',
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

      {/* Retro CRT Scanlines & Grain Subtle Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 4px, 6px 100%',
          pointerEvents: 'none',
          opacity: 0.65,
        }}
      />

      {/* Top & Bottom Cinematic Shadow (Ensures Stickers & HUD Pop) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 14%, transparent 35%, transparent 65%, rgba(0,0,0,0.5) 82%, rgba(0,0,0,0.92) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Lower-Third: Neo-Brutalist Sticker Card (Catatan Seola) */}
      {/* Positioned at bottom: 270px, right: 140px to respect TikTok safe zone */}
      <div
        style={{
          position: 'absolute',
          bottom: '270px',
          left: '54px',
          right: '140px',
          transform: `scale(${stickerScale}) rotate(1.2deg)`,
          opacity: stickerOpacity,
          transformOrigin: 'bottom left',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 40,
        }}
      >
        {/* Brutalist Label Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              backgroundColor: '#ff007f',
              color: '#ffffff',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              borderRadius: '2px',
            }}
          >
            [ SCENE {String(index + 1).padStart(2, '0')}/{String(totalScenes).padStart(2, '0')} // CATATAN SEOLA ]
          </div>
        </div>

        {/* Brutalist White Memo Card with Hard Drop Shadow */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '4px solid #000000',
            boxShadow: '8px 8px 0px #000000',
            padding: '24px 28px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Main Caption */}
          {scene.caption && (
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '34px',
                fontWeight: 800,
                lineHeight: 1.22,
                color: '#000000',
                letterSpacing: '-0.02em',
              }}
            >
              {scene.caption}
            </div>
          )}

          {/* Subtext with dialogue pill */}
          {scene.subtext && renderBrutalistSubtext(scene.subtext)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SeoulSourceReel: React.FC<ReelProps> = (props) => {
  const mergedProps = { ...defaultReelProps, ...props };
  const { title, category, scenes, audioUrl, musicUrl } = mergedProps;
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

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

  // Brutalist Progress Bar Width (0px to 1080px)
  const progressRatio = Math.min(1, frame / Math.max(1, durationInFrames));
  const progressBarWidth = progressRatio * 1080;

  // Y2K Camcorder Blinking REC indicator (blinks every 15 frames)
  const isRecVisible = Math.floor(frame / 15) % 2 === 0;

  // Current counter seconds
  const currentSec = Math.floor(frame / fps);
  const currentMilli = Math.floor(((frame % fps) / fps) * 99);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Google Fonts: Space Grotesk + Share Tech Mono + Archivo Black */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Share+Tech+Mono&family=Space+Grotesk:wght@600;700;800;900&display=swap');
        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Optional Audio Layers */}
      {musicUrl && <Audio src={musicUrl} volume={0.25} />}
      {audioUrl && <Audio src={audioUrl} volume={1.0} />}

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
          />
        </Sequence>
      ))}

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
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        {/* REC Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: isRecVisible ? '#ef4444' : 'transparent',
              boxShadow: isRecVisible ? '0 0 12px #ef4444' : 'none',
              border: '2px solid #ef4444',
            }}
          />
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.1em' }}>
            REC [00:{String(currentSec).padStart(2, '0')}:{String(currentMilli).padStart(2, '0')}]
          </span>
        </div>

        {/* SP ▶ 1080HD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.08em' }}>
            SP ▶ 1080HD
          </span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', backgroundColor: '#000000', border: '1.5px solid #ffffff', padding: '2px 8px' }}>
            BAT [▮▮▯]
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ⚡ NEO-BRUTALIST TILTED STICKER HOOK (UPPER-THIRD)           */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          left: '54px',
          right: '140px',
          transform: 'rotate(-1.8deg)',
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '10px',
          zIndex: 55,
        }}
      >
        {/* Acid Lime Green Category Badge */}
        <div
          style={{
            backgroundColor: '#ccff00',
            color: '#000000',
            border: '3.5px solid #000000',
            boxShadow: '5px 5px 0px #000000',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '18px',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '6px 18px',
            borderRadius: '2px',
          }}
        >
          ★ SEOULSOURCE // {category || 'DRAMA RECAP'} ★
        </div>

        {/* Cyber Caution Yellow Headline Sticker */}
        <div
          style={{
            backgroundColor: '#ffe600',
            color: '#000000',
            border: '4px solid #000000',
            boxShadow: '7px 7px 0px #000000',
            padding: '16px 24px',
            borderRadius: '3px',
            maxWidth: '860px',
          }}
        >
          <div
            style={{
              fontFamily: "'Archivo Black', 'Space Grotesk', sans-serif",
              fontSize: '44px',
              fontWeight: 900,
              lineHeight: 1.14,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📟 Y2K DIGITAL DATE & WATERMARK (BOTTOM-LEFT)                 */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '60px',
          zIndex: 65,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '18px',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.75)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '4px 12px',
          border: '1.5px solid rgba(255,255,255,0.3)',
          letterSpacing: '0.06em',
        }}
      >
        OCT 21, 2026 // @seoulsource_
      </div>

      {/* ============================================================ */}
      {/* 🏁 BRUTALIST CAUTION PROGRESS BAR (VERY TOP)                 */}
      {/* ============================================================ */}
      <div
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '1080px',
          height: '7px',
          backgroundColor: '#000000',
          zIndex: 100,
          borderBottom: '2px solid #000000',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressBarWidth}px`,
            backgroundColor: '#ccff00',
            borderRight: '3px solid #000000',
            boxShadow: '0 0 10px #ccff00',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
