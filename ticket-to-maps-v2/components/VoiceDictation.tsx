'use client';

import * as React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractFromSpeech, type SpeechExtraction } from '@/lib/speech-parse';
import { cn } from '@/lib/utils';

export interface VoiceDictationProps {
  onResult: (result: SpeechExtraction) => void;
  className?: string;
}

type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onaudioend: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: any) => void) | null;
};

function createRecognition(): Recognition | null {
  if (typeof window === 'undefined') return null;
  const Constructor =
    (window as typeof window & {
      webkitSpeechRecognition?: new () => Recognition;
      SpeechRecognition?: new () => Recognition;
    }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

  if (!Constructor) return null;

  const recognition = new Constructor();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = true;
  return recognition;
}

export function VoiceDictation({ onResult, className }: VoiceDictationProps) {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const recognitionRef = React.useRef<Recognition | null>(null);
  const statusRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    recognitionRef.current = createRecognition();
    setIsSupported(Boolean(recognitionRef.current));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = React.useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  const handleStart = React.useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    recognitionRef.current.onresult = (event: any) => {
      let latest = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const segment = event.results[i];
        latest += segment[0].transcript;
      }
      setTranscript(latest.trim());
      const isFinal = event.results[event.resultIndex]?.isFinal;
      if (isFinal) {
        const extraction = extractFromSpeech(latest);
        onResult(extraction);
        stopListening();
        setIsListening(false);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
  }, [onResult, stopListening]);

  const toggleListening = React.useCallback(() => {
    if (!isSupported) return;
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }
    handleStart();
  }, [handleStart, isSupported, isListening, stopListening]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Dictée vocale</span>
        {!isSupported && <span className="text-xs text-muted-foreground">Non disponible</span>}
      </div>
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'secondary'}
        size="lg"
        disabled={!isSupported}
        onClick={toggleListening}
        className="h-12 w-full gap-3 rounded-xl text-base"
        aria-pressed={isListening}
        aria-describedby="dictation-status"
      >
        {isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : isSupported ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        <span className="font-semibold">
          {isListening ? 'Écoute en cours…' : isSupported ? 'Dicter une adresse' : 'Dictée non supportée'}
        </span>
      </Button>
      <div id="dictation-status" ref={statusRef} className="text-sm text-muted-foreground" aria-live="polite">
        {transcript && !isListening && isSupported && (
          <span>
            Dernier résultat : <span className="font-medium text-foreground">{transcript}</span>
          </span>
        )}
        {isListening && <span>Parlez près du micro…</span>}
        {!transcript && !isListening && isSupported && <span>Appuyez pour remplir ville, rue et heure par la voix.</span>}
      </div>
    </div>
  );
}
