'use client';

import * as React from 'react';
import { MoonStar, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeaderBarProps {
  title?: string;
  className?: string;
}

export function HeaderBar({ title = 'Ticket to Maps', className }: HeaderBarProps) {
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = React.useCallback((next?: boolean) => {
    if (typeof document === 'undefined') return;
    const shouldEnable = next ?? !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', shouldEnable);
  }, []);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const hasClass = document.documentElement.classList.contains('dark');
    const initial = hasClass || prefersDark;
    toggleTheme(initial);
    setIsDark(initial);
  }, [toggleTheme]);

  const handleToggle = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      toggleTheme(next);
      return next;
    });
  }, [toggleTheme]);

  return (
    <header className={cn('flex items-center justify-between gap-4 px-4 py-4', className)}>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Cartographie</p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-pressed={isDark}
        onClick={handleToggle}
        className="h-11 w-11 rounded-full"
      >
        {isDark ? <Sun className="h-5 w-5" aria-hidden /> : <MoonStar className="h-5 w-5" aria-hidden />}
        <span className="sr-only">Changer de thème</span>
      </Button>
    </header>
  );
}
