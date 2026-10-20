import React from 'react';
import { Composition } from 'remotion';
import { SeoulSourceReel, ReelProps, defaultReelProps } from './SeoulSourceReel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<ReelProps>
        id="SeoulSourceReel"
        component={SeoulSourceReel}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultReelProps}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const scenes = props.scenes || defaultReelProps.scenes;
          const totalSeconds = scenes.reduce(
            (sum, s) => sum + (s.durationInSeconds || 4),
            0
          );
          return {
            durationInFrames: Math.max(fps * 3, Math.round(totalSeconds * fps)),
            props,
          };
        }}
      />
    </>
  );
};
