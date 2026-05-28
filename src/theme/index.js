// src/theme/index.js
export const colors = {
  navy:     '#251D4B',
  lilac:    '#CCA9E8',
  lavender: '#C3BEEF',
  sky:      '#CADFFD',
  cream:    '#F7F4EE',
  soft:     '#EEE8F8',
  white:    '#FFFFFF',
  muted:    '#7B7199',
  text:     '#251D4B',

  // Emociones
  happy:    '#7DCB7D',
  happyBg:  '#EEF8EE',
  anxious:  '#F4A642',
  anxiousBg:'#FFF3E0',
  sad:      '#7B8FD4',
  sadBg:    '#EEF0FB',
  calm:     '#B48BD8',
  calmBg:   '#F5EEFB',

  // Semánticos
  success:  '#7DCB7D',
  warning:  '#F4A642',
  error:    '#E05555',
  errorBg:  '#FFF0F0',
};

export const fonts = {
  serif:        'DMSerifDisplay_400Regular',
  regular:      'DMSans_400Regular',
  medium:       'DMSans_500Medium',
  semibold:     'DMSans_600SemiBold',
  bold:         'DMSans_700Bold',
};

export const radius = {
  sm:   12,
  md:   16,
  lg:   24,
  xl:   32,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: '#251D4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  strong: {
    shadowColor: '#251D4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};