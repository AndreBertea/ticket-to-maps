import React from 'react';
import type { OrderMode } from '../types';

type Props = {
  mode: OrderMode;
  onChange: (m: OrderMode) => void;
};

export default function OrderControls({ mode, onChange }: Props) {
  return (
    <section className="container">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 14 }}>Ordre:</strong>
          <label><input type="radio" name="ordermode" checked={mode === 'time'} onChange={() => onChange('time')} /> Par horaire</label>
          <label><input type="radio" name="ordermode" checked={mode === 'manual'} onChange={() => onChange('manual')} /> Manuel (drag & drop)</label>
        </div>
      </div>
    </section>
  );
}

