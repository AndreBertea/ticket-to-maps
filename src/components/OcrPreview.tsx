import React from 'react';

type Props = { text: string };

export default function OcrPreview({ text }: Props) {
  return (
    <div className="card" aria-live="polite" aria-atomic>
      <div className="muted" style={{ marginBottom: 6 }}>Texte OCR brut</div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</pre>
    </div>
  );
}

