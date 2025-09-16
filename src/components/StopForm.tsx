import React, { useEffect, useState } from 'react';
import type { Stop } from '../types';

type Props = {
  initial?: Partial<Stop>;
  onSubmit: (stop: Stop) => void;
};

export default function StopForm({ initial, onSubmit }: Props) {
  const [address, setAddress] = useState(initial?.address || '');
  const [city, setCity] = useState(initial?.city || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [time, setTime] = useState(initial?.time || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  useEffect(() => {
    setAddress(initial?.address || '');
    setCity(initial?.city || '');
    setPhone(initial?.phone || '');
    setTime(initial?.time || '');
    setNotes(initial?.notes || '');
  }, [initial?.address, initial?.city, initial?.phone, initial?.time, initial?.notes]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    onSubmit({ id, address: address.trim(), city: city.trim(), phone: phone.trim() || undefined, time: time.trim() || undefined, notes: notes.trim() || undefined });
  }

  return (
    <section className="container">
      <form className="card" onSubmit={submit}>
        <div className="grid cols-2">
          <div>
            <label htmlFor="address">Adresse</label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="21 Rue Haute" required />
          </div>
          <div>
            <label htmlFor="city">Ville</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pleudihen" required />
          </div>
          <div>
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 7… / 07…" />
          </div>
          <div>
            <label htmlFor="time">Horaire</label>
            <input id="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM (ex 19:30)" />
          </div>
          <div className="wide">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="coupé; couteau; fourchette" />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button type="submit" className="wide">Ajouter à la tournée</button>
        </div>
      </form>
    </section>
  );
}

