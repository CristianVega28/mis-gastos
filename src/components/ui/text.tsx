import { Platform, Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

/** En web, quita el contorno azul de foco del navegador en los TextInput. */
export const NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : undefined;

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

type Props = TextProps & {
  className?: string;
  weight?: keyof typeof FONTS;
  /** Números alineados (para montos) */
  tabular?: boolean;
};

export function Text({ className, weight = 'regular', tabular, style, ...props }: Props) {
  return (
    <RNText
      className={cn('text-foreground text-base', className)}
      style={[{ fontFamily: FONTS[weight] }, tabular && { fontVariant: ['tabular-nums'] }, style]}
      {...props}
    />
  );
}
