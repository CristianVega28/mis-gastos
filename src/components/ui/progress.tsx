import { View } from 'react-native';

export function Progress({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View className="w-full overflow-hidden rounded-full bg-card-2" style={{ height }}>
      <View style={{ width: `${pct}%`, height, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}
