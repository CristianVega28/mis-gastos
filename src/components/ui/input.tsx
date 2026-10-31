import type { ComponentRef, Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

import { FONTS, NO_OUTLINE, Text } from './text';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function Input({ label, error, className, style, ref, ...props }: Props) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text weight="medium" className="text-sm text-muted">
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColorClassName="accent-muted"
        selectionColorClassName="accent-primary"
        className={cn(
          'h-13 rounded-2xl border bg-card-2 px-4 text-base text-foreground',
          error ? 'border-danger' : 'border-border focus:border-primary',
          className,
        )}
        style={[{ fontFamily: FONTS.medium }, NO_OUTLINE, style]}
        {...props}
      />
      {error && <Text className="text-xs text-danger">{error}</Text>}
    </View>
  );
}
