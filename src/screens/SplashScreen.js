// src/screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LogoFull } from '../components/Logo';
import MindCharacter from '../components/MindCharacter';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onDone }) {
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const charAnim  = useRef(new Animated.Value(0)).current;
  const fadeOut   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoAnim,  { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.spring(charAnim,  { toValue: 1, tension: 50, friction: 12, delay: 300, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Blob decorativo arriba derecha */}
      <View style={styles.blobTR} />
      {/* Blob decorativo abajo izquierda */}
      <View style={styles.blobBL} />

      {/* Personaje flotando arriba */}
      <Animated.View style={{
        opacity: charAnim,
        transform: [{ scale: charAnim }, { translateY: charAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] }) }],
        marginBottom: 8,
      }}>
        <MindCharacter mood="calm" size={130} />
      </Animated.View>

      {/* Logo */}
      <Animated.View style={{
        opacity: logoAnim,
        transform: [{ translateY: logoAnim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
      }}>
        <LogoFull dark />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: logoAnim }]}>
        Tu bienestar mental, con calma
      </Animated.Text>

      {/* Dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  blobTR: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(195,190,239,0.1)',
    top: -80,
    right: -80,
  },
  blobBL: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(202,223,253,0.07)',
    bottom: -50,
    left: -50,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  dots: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.lilac,
  },
});