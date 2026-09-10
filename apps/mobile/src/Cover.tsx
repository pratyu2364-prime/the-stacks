import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { coverUrl } from '@stacks/data';
import { font, palette, radii } from './theme';

const SIZES = {
  S: { width: 48, height: 72, radius: radii.sm },
  M: { width: 96, height: 144, radius: radii.md },
} as const;

type CoverProps = {
  coverId: number | null;
  title: string;
  size?: keyof typeof SIZES;
};

export function Cover({ coverId, title, size = 'S' }: CoverProps) {
  const dims = SIZES[size];
  const url = coverUrl(coverId, size === 'M' ? 'M' : 'S');

  if (!url) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: dims.width, height: dims.height, borderRadius: dims.radius },
        ]}
      >
        <Text
          style={[size === 'M' ? styles.placeholderLetterLarge : styles.placeholderLetter]}
        >
          {title.trim().charAt(0) || '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[{ width: dims.width, height: dims.height, borderRadius: dims.radius }, styles.image]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: palette.ink,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderColor: palette.oak,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  placeholderLetter: {
    color: palette.dust,
    fontFamily: font.family.serif,
    fontSize: font.size.lg,
    fontWeight: '600',
  },
  placeholderLetterLarge: {
    color: palette.dust,
    fontFamily: font.family.serif,
    fontSize: font.size.hero,
    fontWeight: '600',
  },
});