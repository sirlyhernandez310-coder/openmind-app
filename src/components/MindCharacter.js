// src/components/MindCharacter.js
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Ellipse, Path, Circle, Line } from 'react-native-svg';

const MOODS = {
  calm: {
    body:  '#B48BD8',
    light: '#CCA9E8',
    eyes: 'closed',
    mouth: 'smile',
  },
  happy: {
    body:  '#7DCB7D',
    light: '#9EDD9E',
    eyes: 'open',
    mouth: 'bigsmile',
  },
  sad: {
    body:  '#7B8FD4',
    light: '#9AAAE0',
    eyes: 'open',
    mouth: 'frown',
  },
  anxious: {
    body:  '#F4A642',
    light: '#F7BC72',
    eyes: 'wide',
    mouth: 'worried',
  },
};

export default function MindCharacter({ mood = 'calm', size = 120 }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,  duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const m = MOODS[mood] || MOODS.calm;
  const s = size;
  const cx = s / 2;
  const cy = s / 2 + 4;

  return (
    <Animated.View style={{ transform: [{ translateY: float }] }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {/* Shadow */}
        <Ellipse cx={cx} cy={s - 8} rx={s * 0.22} ry={s * 0.05} fill="rgba(37,29,75,0.12)" />

        {/* Body */}
        <Ellipse cx={cx} cy={cy} rx={s * 0.28} ry={s * 0.32} fill={m.body} opacity={0.92} />
        <Ellipse cx={cx} cy={cy - s * 0.06} rx={s * 0.24} ry={s * 0.2} fill={m.light} />

        {/* Eyes */}
        {m.eyes === 'closed' ? (
          <>
            <Path d={`M${cx - s*0.1} ${cy - s*0.05} Q${cx - s*0.06} ${cy - s*0.09} ${cx - s*0.02} ${cy - s*0.05}`}
              stroke="#251D4B" strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
            <Path d={`M${cx + s*0.02} ${cy - s*0.05} Q${cx + s*0.06} ${cy - s*0.09} ${cx + s*0.1} ${cy - s*0.05}`}
              stroke="#251D4B" strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx={cx - s*0.08} cy={cy - s*0.05} r={s*0.055} fill="#251D4B" />
            <Circle cx={cx + s*0.08} cy={cy - s*0.05} r={s*0.055} fill="#251D4B" />
            <Circle cx={cx - s*0.065} cy={cy - s*0.068} r={s*0.022} fill="white" />
            <Circle cx={cx + s*0.095} cy={cy - s*0.068} r={s*0.022} fill="white" />
          </>
        )}

        {/* Mouth */}
        {m.mouth === 'smile' && (
          <Path d={`M${cx - s*0.09} ${cy + s*0.06} Q${cx} ${cy + s*0.12} ${cx + s*0.09} ${cy + s*0.06}`}
            stroke="#251D4B" strokeWidth={s*0.028} fill="none" strokeLinecap="round" />
        )}
        {m.mouth === 'bigsmile' && (
          <Path d={`M${cx - s*0.1} ${cy + s*0.05} Q${cx} ${cy + s*0.14} ${cx + s*0.1} ${cy + s*0.05}`}
            stroke="#251D4B" strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
        )}
        {m.mouth === 'frown' && (
          <Path d={`M${cx - s*0.09} ${cy + s*0.1} Q${cx} ${cy + s*0.04} ${cx + s*0.09} ${cy + s*0.1}`}
            stroke="#251D4B" strokeWidth={s*0.028} fill="none" strokeLinecap="round" />
        )}
        {m.mouth === 'worried' && (
          <Path d={`M${cx - s*0.08} ${cy + s*0.08} Q${cx} ${cy + s*0.04} ${cx + s*0.08} ${cy + s*0.08}`}
            stroke="#251D4B" strokeWidth={s*0.028} fill="none" strokeLinecap="round" />
        )}

        {/* Legs */}
        <Line x1={cx - s*0.1} y1={cy + s*0.28} x2={cx - s*0.16} y2={cy + s*0.42} stroke="#251D4B" strokeWidth={s*0.03} strokeLinecap="round" />
        <Line x1={cx + s*0.1} y1={cy + s*0.28} x2={cx + s*0.16} y2={cy + s*0.42} stroke="#251D4B" strokeWidth={s*0.03} strokeLinecap="round" />
        <Ellipse cx={cx - s*0.16} cy={cy + s*0.44} rx={s*0.07} ry={s*0.028} fill="#251D4B" />
        <Ellipse cx={cx + s*0.16} cy={cy + s*0.44} rx={s*0.07} ry={s*0.028} fill="#251D4B" />
      </Svg>
    </Animated.View>
  );
}