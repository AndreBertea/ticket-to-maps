'use client';

import * as React from 'react';
import { ExternalLink, Copy, Check, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { buildDirectionsUrl, formatDestination, tryOpenInApp, type Origin } from '@/lib/maps';

export interface MapsPreviewProps {
  origin?: Origin | null;
  city?: string;
  street?: string;
  number?: string | number;
  time?: string;
  className?: string;
}

export function MapsPreview({ origin, city, street, number, time, className }: MapsPreviewProps) {
  const destination = formatDestination({ city, street, number });
  const url = React.useMemo(
    () => buildDirectionsUrl({ origin: origin ?? undefined, city, street, number }),
    [origin, city, street, number]
  );
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = React.useCallback(async () => {
    if (typeof navigator === 'undefined' || !('clipboard' in navigator) || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(8);
      }
    } catch (error) {
      setCopied(false);
    }
  }, [url]);

  return (
    <Card className={cn('rounded-3xl border shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Aperçu Google Maps</CardTitle>
        <LocateFixed className="h-5 w-5 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1" aria-live="polite">
          <p className="text-xs uppercase text-muted-foreground">Depuis</p>
          <p className="font-medium">
            {origin ? `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}` : 'Position actuelle'}
          </p>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Destination</p>
          <p className="font-medium">
            {destination || <span className="text-muted-foreground">Complétez ville et rue</span>}
          </p>
        </div>
        {time && (
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Heure cible</p>
            <p className="font-medium">{time}</p>
          </div>
        )}
        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild className="h-12 flex-1 rounded-xl text-base">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" aria-hidden />
              Ouvrir dans Google Maps
            </a>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 rounded-xl text-base"
            onClick={() => tryOpenInApp(url)}
          >
            App native
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl text-base"
            onClick={handleCopy}
          >
            {copied ? <Check className="mr-2 h-5 w-5" aria-hidden /> : <Copy className="mr-2 h-5 w-5" aria-hidden />}
            {copied ? 'Copié !' : 'Copier le lien'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
