import React, { useRef, useState } from 'react';
import { recognize } from '@utils/ocr';
import OcrPreview from './OcrPreview';
import type { ParseResult } from '@utils/parse';
import { parseTicketText } from '@utils/parse';

type Props = {
  onExtract: (parsed: ParseResult, raw: string) => void;
};

export default function CameraScan({ onExtract }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function pickPhoto() {
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setOcrText('');
    setError(null);
  }

  async function runOcr() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    try {
      setStatus('scanning');
      setError(null);
      const text = await recognize(f);
      setOcrText(text);
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setError('OCR failed. Vérifiez la permission caméra / photo.');
    }
  }

  function extract() {
    const parsed = parseTicketText(ocrText);
    onExtract(parsed, ocrText);
  }

  return (
    <section className="container" aria-live="polite" aria-busy={status === 'scanning'}>
      <div className="card" style={{ position: 'relative' }}>
        <div className="actions" style={{ marginBottom: 12 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            style={{ display: 'none' }}
          />
          <button onClick={pickPhoto}>Scanner</button>
          <button onClick={runOcr} disabled={!imgUrl || status === 'scanning'}>
            {status === 'scanning' ? 'Analyse en cours…' : 'Lancer l\'OCR'}
          </button>
          <button className="outline" onClick={() => { setImgUrl(null); setOcrText(''); }} disabled={!imgUrl}>Effacer</button>
        </div>
        {imgUrl && (
          <img src={imgUrl} alt="Aperçu" style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
        )}
        {ocrText && <OcrPreview text={ocrText} />}
        <div className="actions" style={{ marginTop: 12 }}>
          <button onClick={extract} disabled={!ocrText}>Extraire</button>
        </div>
        {status === 'error' && <div className="muted" role="alert" style={{ color: '#fca5a5' }}>{error}</div>}

        {status === 'scanning' && (
          <div className="loading-overlay" role="status" aria-live="assertive">
            <div className="spinner" />
            <div>OCR en cours…</div>
          </div>
        )}
      </div>
    </section>
  );
}
