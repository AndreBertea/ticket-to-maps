import React from 'react';
import type { Candidate } from '@utils/resolver';

type Props = {
  open: boolean;
  candidates: Candidate[];
  onSelect: (city: string, street: string) => void;
  onCancel: () => void;
};

export default function DisambiguationDialog({ open, candidates, onSelect, onCancel }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="dialog-backdrop">
      <div className="dialog-card">
        <h3 style={{ marginTop: 0 }}>Quelle ville ?</h3>
        <p className="muted">Nous avons reconnu la rue mais plusieurs communes possibles existent. Choisissez :</p>
        <div className="list">
          {candidates.map((c, i) => (
            <button key={i} className="outline" onClick={() => onSelect(c.city, c.street)}>
              {c.street}, {c.city} (score {(c.score * 100).toFixed(0)}%)
            </button>
          ))}
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="outline" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

