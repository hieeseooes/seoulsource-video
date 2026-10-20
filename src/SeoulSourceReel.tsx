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

// Helper: Split title to highlight the first few hook words in vibrant golden yellow
const renderHighlightedTitle = (title: string) => {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) {
    return <span style={{ color: '#FACC15' }}>{title}</span>;
  }
  const highlightCount = Math.min(3, Math.ceil(words.length * 0.38));
  const highlighted = words.slice(0, highlightCount).join(' ');
  const remaining = words.slice(highlightCount).join(' ');

  return (
    <>
      <span style={{ color: '#FACC15', textShadow: '0 0 25px rgba(250, 204, 21, 0.45)' }}>
        {highlighted}{' '}
      </span>
      <span style={{ color: '#FFFFFF' }}>{remaining}</span>
    </>
  );
};

// Helper: Format subtext quotes nicely
const renderSubtext = (text?: string) => {
  if (!text) return null;
  // If text contains quotes, emphasize the quote in cyan
  if (text.includes('"')) {
    const parts = text.split(/(".*?")/g);
    return (
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px',
          fontWeight: 600,
          lineHeight: 1.35,
          color: '#E2E8F0',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        {parts.map((p, idx) =>
          p.startsWith('"') && p.endsWith('"') ? (
            <span
              key={idx}
              style={{
                color: '#67E8F9',
                fontStyle: 'italic',
                fontWeight: 700,
                textShadow: '0 0 15px rgba(103, 232, 249, 0.35)',
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
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '26px',
        fontWeight: 500,
        lineHeight: 1.35,
        color: '#CBD5E1',
        textShadow: '0 2px 10px rgba(0,0,0,0.9)',
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

  // Smooth cinematic Ken Burns scale & subtle pan
  const scale = interpolate(frame, [0, sceneDurationFrames], [1.0, 1.09], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, sceneDurationFrames], [0, -12], {
    extrapolateRight: 'clamp',
  });

  // Entrance spring animation for subtitle box
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.6, stiffness: 140 },
  });

  const subtitleY = interpolate(enterSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(enterSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#05070c' }}>
      {/* Background Image with Ken Burns Effect */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'center center',
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

      {/* Cinematic Top & Bottom Vignettes (Actor Face Remains Clean in Center!) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(3,5,10,0.92) 0%, rgba(3,5,10,0.55) 15%, rgba(3,5,10,0.05) 35%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(3,5,10,0.96) 0%, rgba(3,5,10,0.85) 18%, rgba(3,5,10,0.3) 34%, transparent 48%)',
          pointerEvents: 'none',
        }}
      />
      {/* Subtle corner vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.75)',
          pointerEvents: 'none',
        }}
      />

      {/* Lower-Third: Netflix / CapCut Style Subtitle Bar */}
      {/* Positioned at bottom: 270px to stay safely above TikTok bottom description zone */}
      {/* Right margin: 140px to stay safely away from TikTok like/comment/share icons */}
      <div
        style={{
          position: 'absolute',
          bottom: '270px',
          left: '60px',
          right: '140px',
          transform: `translateY(${subtitleY}px)`,
          opacity: subtitleOpacity,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Micro Scene Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '4px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Scene {String(index + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')} • Catatan Seola
            </span>
          </div>
        </div>

        {/* Cinematic Translucent Subtitle Pill Container */}
        <div
          style={{
            backgroundColor: 'rgba(5, 8, 16, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '18px',
            padding: '24px 28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Main Caption (Netflix subtitle look) */}
          {scene.caption && (
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '36px',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#ffffff',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)',
                letterSpacing: '-0.02em',
              }}
            >
              {scene.caption}
            </div>
          )}

          {/* Subtext dialogue / analysis */}
          {scene.subtext && renderSubtext(scene.subtext)}
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

  // Hairline Top Progress Bar (0px to 1080px)
  const progressRatio = Math.min(1, frame / Math.max(1, durationInFrames));
  const progressBarWidth = progressRatio * 1080;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#03050a',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Inject Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;0,900;1,500;1,600;1,700&display=swap');
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

      {/* Top Header: Upper-Third Hook Headline (Global Overlay) */}
      {/* Positioned at top: 100px, right: 140px to respect TikTok safe zone */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: '60px',
          right: '140px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 50,
        }}
      >
        {/* Micro-Brand Pill: Ultra Sleek Editorial Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#f8fafc',
              textTransform: 'uppercase',
            }}
          >
            SEOULSOURCE <span style={{ opacity: 0.35, margin: '0 6px' }}>•</span> {category || 'DRAMA INSIGHT'}
          </span>
        </div>

        {/* Viral Hook Headline with Golden Yellow Highlight */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '48px',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.98)',
            maxWidth: '860px',
          }}
        >
          {renderHighlightedTitle(title)}
        </div>
      </div>

      {/* Minimalist Watermark at Bottom Left (Safe from TikTok sound icon) */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '60px',
          zIndex: 50,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'rgba(255, 255, 255, 0.45)',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
        }}
      >
        @seoulsource_
      </div>

      {/* Sleek Hairline Top Progress Bar (Height: 5px) */}
      <div
        style={{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '1080px',
          height: '5px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressBarWidth}px`,
            background: 'linear-gradient(90deg, #FACC15 0%, #38BDF8 60%, #EC4899 100%)',
            boxShadow: '0 0 12px rgba(250, 204, 21, 0.7)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
