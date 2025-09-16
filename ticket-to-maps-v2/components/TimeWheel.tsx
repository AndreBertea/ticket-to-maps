'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 56;
const LOOPS = 3;

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function buildLoop(values: number[]) {
  return Array.from({ length: values.length * LOOPS }, (_, index) => values[index % values.length]);
}

function formatPart(value: number) {
  return value.toString().padStart(2, '0');
}

function parseTime(value?: string) {
  if (!value) {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
  const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
  const hour = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return { hour, minute };
}

export interface TimeWheelProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
}

export function TimeWheel({ value, onChange, className }: TimeWheelProps) {
  const [selected, setSelected] = React.useState(parseTime(value));
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);
  const hourSync = React.useRef(false);
  const minuteSync = React.useRef(false);
  const hourTick = React.useRef(false);
  const minuteTick = React.useRef(false);

  React.useEffect(() => {
    setSelected((prev) => {
      const parsed = parseTime(value);
      if (prev.hour === parsed.hour && prev.minute === parsed.minute) {
        return prev;
      }
      alignScroll(hourRef, parsed.hour, HOURS.length, hourSync);
      alignScroll(minuteRef, parsed.minute, MINUTES.length, minuteSync);
      return parsed;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    alignScroll(hourRef, selected.hour, HOURS.length, hourSync);
    alignScroll(minuteRef, selected.minute, MINUTES.length, minuteSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTime = React.useCallback(
    (partial: Partial<{ hour: number; minute: number }>) => {
      setSelected((prev) => {
        const next = { ...prev, ...partial };
        onChange?.(`${formatPart(next.hour)}:${formatPart(next.minute)}`);
        return next;
      });
    },
    [onChange]
  );

  const handleScroll = React.useCallback(
    (type: 'hour' | 'minute') => (event: React.UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const values = type === 'hour' ? HOURS : MINUTES;
      const syncRef = type === 'hour' ? hourSync : minuteSync;
      const tickRef = type === 'hour' ? hourTick : minuteTick;

      if (syncRef.current) {
        return;
      }
      if (tickRef.current) {
        return;
      }

      tickRef.current = true;
      window.requestAnimationFrame(() => {
        tickRef.current = false;
        const baseHeight = values.length * ITEM_HEIGHT;
        let scrollTop = container.scrollTop;

        if (scrollTop < baseHeight * 0.5) {
          scrollTop = scrollTop + baseHeight;
          container.scrollTop = scrollTop;
        } else if (scrollTop > baseHeight * 1.5) {
          scrollTop = scrollTop - baseHeight;
          container.scrollTop = scrollTop;
        }

        const index = Math.round(scrollTop / ITEM_HEIGHT) % values.length;
        const normalized = (index + values.length) % values.length;

        updateTime({ [type]: normalized } as Partial<{ hour: number; minute: number }>);
      });
    },
    [hourTick, minuteTick, updateTime]
  );

  return (
    <div className={cn('relative rounded-3xl border bg-card p-4 shadow-sm', className)}>
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Heure</span>
        <span>Minutes</span>
      </div>
      <div className="relative flex gap-6">
        <WheelColumn
          ref={hourRef}
          values={buildLoop(HOURS)}
          selected={selected.hour}
          onScroll={handleScroll('hour')}
        />
        <WheelColumn
          ref={minuteRef}
          values={buildLoop(MINUTES)}
          selected={selected.minute}
          onScroll={handleScroll('minute')}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2"
          aria-hidden
        >
          <div className="mx-1 h-14 rounded-2xl border-2 border-primary/40" />
        </div>
      </div>
    </div>
  );
}

interface WheelColumnProps {
  values: number[];
  selected: number;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

const WheelColumn = React.forwardRef<HTMLDivElement, WheelColumnProps>(
  ({ values, selected, onScroll }, ref) => {
    return (
      <div className="relative h-48 w-full overflow-y-scroll" ref={ref} onScroll={onScroll}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-80" aria-hidden />
        <div className="snap-y snap-mandatory">
          {values.map((value, index) => (
            <div
              key={`${index}-${value}`}
              className={cn(
                'flex h-14 snap-center items-center justify-center text-lg font-semibold transition-colors',
                value === selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {formatPart(value)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
WheelColumn.displayName = 'WheelColumn';

function alignScroll(
  ref: React.RefObject<HTMLDivElement>,
  value: number,
  range: number,
  flag: React.MutableRefObject<boolean>
) {
  const container = ref.current;
  if (!container) return;
  flag.current = true;
  const index = range + value; // center copy
  container.scrollTop = index * ITEM_HEIGHT;
  window.requestAnimationFrame(() => {
    flag.current = false;
  });
}
