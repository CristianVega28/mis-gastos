import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { PALETTE } from '@/lib/palette';

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {PALETTE.map((c) => (
        <Pressable
          key={c}
          accessibilityLabel={`Color ${c}`}
          onPress={() => {
            haptic.selection();
            onChange(c);
          }}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: c }}
        >
          {value === c && <Check size={18} color="#fff" strokeWidth={3} />}
        </Pressable>
      ))}
    </View>
  );
}
