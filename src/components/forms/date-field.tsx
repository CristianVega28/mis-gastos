import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { shortDate, toISODate, todayISO } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function Calendar({ value, onChange }: { value: string | null; onChange: (iso: string) => void }) {
  const [cursor, setCursor] = useState(() => startOfMonth(value ? parseISO(value) : new Date()));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });
  const today = todayISO();
  const title = format(cursor, 'MMMM yyyy', { locale: es });

  return (
    <View className="gap-2 rounded-2xl bg-card-2 p-3">
      <View className="flex-row items-center justify-between">
        <IconButton
          icon={ChevronLeft}
          accessibilityLabel="Mes anterior"
          className="bg-card"
          onPress={() => setCursor(addMonths(cursor, -1))}
        />
        <Text weight="bold" className="capitalize">
          {title}
        </Text>
        <IconButton
          icon={ChevronRight}
          accessibilityLabel="Mes siguiente"
          className="bg-card"
          onPress={() => setCursor(addMonths(cursor, 1))}
        />
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text key={i} weight="semibold" className="flex-1 text-center text-xs text-muted">
            {d}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {days.map((d) => {
          const iso = toISODate(d);
          const selected = iso === value;
          const outside = !isSameMonth(d, cursor);
          return (
            <Pressable
              key={iso}
              onPress={() => {
                haptic.selection();
                onChange(iso);
              }}
              className="items-center justify-center"
              style={{ width: `${100 / 7}%`, height: 40 }}
            >
              <View
                className={cn(
                  'h-9 w-9 items-center justify-center rounded-full',
                  selected && 'bg-primary',
                  !selected && iso === today && 'border border-primary',
                )}
              >
                <Text
                  weight={selected ? 'bold' : 'medium'}
                  className={cn(
                    'text-sm',
                    selected ? 'text-on-primary' : outside ? 'text-muted opacity-40' : 'text-foreground',
                  )}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Campo de fecha con calendario desplegable (funciona igual en iOS, Android y web). */
export function DateField({
  label,
  value,
  onChange,
  clearable,
  placeholder = 'Sin fecha',
}: {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  clearable?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();
  return (
    <View className="gap-1.5">
      <Text weight="medium" className="text-sm text-muted">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className={cn(
          'h-13 flex-row items-center gap-3 rounded-2xl border bg-card-2 px-4',
          open ? 'border-primary' : 'border-border',
        )}
      >
        <CalendarDays size={18} color={colors.muted} />
        <Text weight="medium" className={cn('flex-1', !value && 'text-muted')}>
          {value ? shortDate(value) : placeholder}
        </Text>
        {clearable && value && (
          <Pressable hitSlop={8} onPress={() => onChange(null)}>
            <X size={18} color={colors.muted} />
          </Pressable>
        )}
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
          <Calendar
            value={value}
            onChange={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
