// src/components/Logo.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

export function LogoIcon({ size = 56, dark = true }) {
  const bg = dark ? 'rgba(255,255,255,0.1)' : colors.soft;
  const stroke = dark ? '#FFFFFF' : colors.navy;
  return (
    <View style={[styles.iconWrap, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: bg }]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 44 44" fill="none">
        <Path
          d="M28 8 C34 8 38 13 38 19 C38 24 35 28 30 30 L30 36 C30 37 29 38 28 38 L18 38 C16 38 15 37 15 36 L15 32 C10 30 8 26 8 20 C8 13 13 8 20 8 Z"
          stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <Path d="M30 19 Q31 17 32 19" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M28 25 L27 27 L29 27" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <Path
          d="M17 18 C17 15.5 19 14 21 16 C23 14 25 15.5 25 18 C25 20 21 24 21 24 C21 24 17 20 17 18Z"
          fill={colors.lilac} />
      </Svg>
    </View>
  );
}

export function LogoFull({ dark = true }) {
  return (
    <View style={styles.fullWrap}>
      <LogoIcon size={52} dark={dark} />
      <Text style={[styles.name, { color: dark ? '#fff' : colors.navy }]}>
        Open<Text style={{ color: colors.lilac }}>Mind</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  fullWrap: { alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.serif, fontSize: 38, letterSpacing: -0.5 },
});