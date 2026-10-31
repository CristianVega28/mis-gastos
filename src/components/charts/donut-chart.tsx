import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useThemeColors } from '@/lib/theme';

export type DonutSlice = { value: number; color: string };

/** Gráfico de dona en SVG; los segmentos dejan un pequeño espacio entre sí. */
export function DonutChart({
  data,
  size = 168,
  thickness = 20,
  children,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const colors = useThemeColors();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const gap = data.length > 1 ? 6 : 0;

  let offset = 0;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.card2} strokeWidth={thickness} fill="none" />
        <G>
          {total > 0 &&
            data.map((d, i) => {
              const length = (d.value / total) * circumference;
              const dash = Math.max(length - gap, 0.01);
              const el = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeLinecap={data.length > 1 ? 'round' : 'butt'}
                  fill="none"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return el;
            })}
        </G>
      </Svg>
      {children}
    </View>
  );
}
