import { View } from 'react-native';

import { CATEGORY_ICONS, FALLBACK_ICON } from '@/lib/category-icons';
import { withAlpha } from '@/lib/palette';

/** Ícono de categoría dentro de un cuadrado redondeado con su color. */
export function IconBadge({ icon, color, size = 44 }: { icon: string | null; color: string; size?: number }) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || FALLBACK_ICON;
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: withAlpha(color, 0.16) }}
    >
      <Icon size={size * 0.48} color={color} strokeWidth={2.2} />
    </View>
  );
}
