import { StyleSheet } from 'react-native';

export const palette = {
  paper: '#efe6d2',
  ink: '#1a1410',
  lamp: '#ffb45c',
  oak: '#5a3f26',
  gloom: '#0a0705',
  dust: '#b6a68c',
  danger: '#c05c4a',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    hero: 32,
  },
  family: {
    serif: 'serif',
    mono: 'monospace',
  },
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.gloom,
  },
  card: {
    backgroundColor: palette.ink,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: palette.lamp,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryBtnText: {
    color: palette.gloom,
    fontFamily: font.family.mono,
    fontWeight: '600',
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: palette.oak,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    color: palette.paper,
    fontFamily: font.family.mono,
    fontWeight: '600',
  },
  input: {
    backgroundColor: palette.ink,
    borderColor: palette.oak,
    borderRadius: radii.md,
    borderWidth: 1,
    color: palette.paper,
    fontFamily: font.family.mono,
    fontSize: font.size.md,
    padding: spacing.md,
  },
  inputPlaceholder: {
    color: palette.dust,
  },
  hairline: {
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    color: palette.dust,
    fontSize: font.size.sm,
    fontFamily: font.family.mono,
    fontWeight: '600',
    letterSpacing: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
  },
  label: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    fontWeight: '600',
  },
  bodyText: {
    color: palette.paper,
    fontFamily: font.family.mono,
  },
  secondaryText: {
    color: palette.dust,
    fontFamily: font.family.mono,
  },
  destructiveBtn: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: palette.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  destructiveBtnText: {
    color: palette.danger,
    fontFamily: font.family.mono,
    fontWeight: '600',
  },
});
