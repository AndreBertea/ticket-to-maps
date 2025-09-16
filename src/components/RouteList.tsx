import React, { useRef, useState } from 'react';
import type { Stop } from '../types';

type Props = {
  stops: Stop[];
  onReorder: (next: Stop[]) => void;
  onUpdate: (id: string, patch: Partial<Stop>) => void;
  onDelete: (id: string) => void;
  disabledDnd?: boolean;
};

export default function RouteList({ stops, onReorder, onUpdate, onDelete, disabledDnd }: Props) {
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    if (disabledDnd) return;
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>, id: string) {
    if (disabledDnd) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, id: string) {
    if (disabledDnd) return;
    e.preventDefault();
    const fromId = dragId.current;
    if (!fromId || fromId === id) return;
    const fromIdx = stops.findIndex((s) => s.id === fromId);
    const toIdx = stops.findIndex((s) => s.id === id);
    if (fromIdx < 0 || toIdx < 0) return;
    const copy = stops.slice();
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    onReorder(copy);
    setDragOverId(null);
  }

  function onDragEnd() {
    dragId.current = null;
    setDragOverId(null);
  }

  return (
    <section className="container">
      <div className="card list">
        {stops.length === 0 && <div className="muted">Aucun stop ajouté pour le moment.</div>}
        {stops.map((s, idx) => (
          <div
            key={s.id}
            className={`stop-item ${dragOverId === s.id ? 'ghost' : ''}`}
            draggable={!disabledDnd}
            onDragStart={(e) => onDragStart(e, s.id)}
            onDragOver={(e) => onDragOver(e, s.id)}
            onDrop={(e) => onDrop(e, s.id)}
            onDragEnd={onDragEnd}
          >
            <div style={{ minWidth: 28, textAlign: 'center', paddingTop: 4 }} aria-hidden>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{s.address}{s.city ? `, ${s.city}` : ''}</div>
              <div className="meta">{s.phone || '—'} · {s.time || '—'}{s.notes ? ` · ${s.notes}` : ''}</div>
            </div>
            <div className="actions">
              <button className="outline" onClick={() => {
                const nextAddress = prompt('Adresse', s.address) ?? s.address;
                const nextCity = prompt('Ville', s.city) ?? s.city;
                const nextPhone = prompt('Téléphone', s.phone || '') || undefined;
                const nextTime = prompt('Horaire (HH:MM)', s.time || '') || undefined;
                const nextNotes = prompt('Notes', s.notes || '') || undefined;
                onUpdate(s.id, { address: nextAddress, city: nextCity, phone: nextPhone, time: nextTime, notes: nextNotes });
              }}>Éditer</button>
              <button className="danger" onClick={() => onDelete(s.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

