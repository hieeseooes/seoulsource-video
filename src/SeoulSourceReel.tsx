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
  category: "K-DRAMA INSIGHT",
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

const SingleScene: React.FC<{
  scene: Scene;
  sceneDurationFrames: number;
  index: number;
  totalScenes: number;
}> = ({ scene, sceneDurationFrames, index, totalScenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns subtle zoom & pan
  const scale = interpolate(frame, [0, sceneDurationFrames], [1.0, 1.12], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, sceneDurationFrames], [0, -15], {
    extrapolateRight: 'clamp',
  });

  // Entrance spring animation for text card
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.7, stiffness: 120 },
  });

  const cardTranslateY = interpolate(enterSpring, [0, 1], [60, 0]);
  const cardOpacity = interpolate(enterSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#090d16' }}>
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

      {/* Cinematic Vignette / Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(7,11,20,0.85) 0%, rgba(7,11,20,0.2) 30%, rgba(7,11,20,0.3) 60%, rgba(7,11,20,0.92) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Middle/Bottom Floating Caption Card (Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          bottom: '220px',
          left: '48px',
          right: '48px',
          transform: `translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          borderRadius: '24px',
          padding: '36px 40px',
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Scene Indicator & Speaker Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 10px #38bdf8',
              }}
            />
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Catatan Seola
            </span>
          </div>

          <span
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 14px',
              borderRadius: '999px',
            }}
          >
            {index + 1} / {totalScenes}
          </span>
        </div>

        {/* Main Caption */}
        {scene.caption && (
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '38px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}
          >
            {scene.caption}
          </div>
        )}

        {/* Subtext commentary */}
        {scene.subtext && (
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.4,
              color: 'rgba(241, 245, 249, 0.88)',
            }}
          >
            {scene.subtext}
          </div>
        )}
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

  // Global Progress Bar (0px to 1080px)
  const progressRatio = Math.min(1, frame / Math.max(1, durationInFrames));
  const progressBarWidth = progressRatio * 1080;

  return (
    <AbsoluteFill style={{ backgroundColor: '#070b14', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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

      {/* Top Header Branding & Headline (Global Overlay) */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '48px',
          right: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          zIndex: 50,
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
            }}
          >
            ⚡ SeoulSource
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(10px)',
              color: '#f8fafc',
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {category || 'K-DRAMA RECAP'}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '44px',
            fontWeight: 900,
            lineHeight: 1.2,
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>
      </div>

      {/* Bottom Sticky Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '48px',
          right: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50,
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          @seoulsource_
        </div>

        <div
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          Tonton & Simpan ↗
        </div>
      </div>

      {/* Sleek Bottom Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '0px',
          left: '0px',
          width: '1080px',
          height: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressBarWidth}px`,
            background: 'linear-gradient(90deg, #38bdf8 0%, #ec4899 100%)',
            boxShadow: '0 0 12px #ec4899',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
