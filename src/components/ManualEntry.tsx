import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Stop } from '../types';
import { VILLAGES } from '../data/localities';
import { getStreetIndex, addUserStreet, isKnownVillage, resolveCityFromStreet, autoCompleteAddress } from '@utils/resolver';
import { normalize, similarity } from '@utils/match';
import { parseTicketText } from '@utils/parse';

type Props = {
  onSubmit: (stop: Stop) => void;
};

export default function ManualEntry({ onSubmit }: Props) {
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const streetsIndex = useMemo(() => getStreetIndex(), []);
  const cityList = useMemo(() => VILLAGES.slice().sort(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const streetsForCity = useMemo(() => streetsIndex[city] || [], [streetsIndex, city]);

  const suggestions = useMemo(() => {
    const q = address.trim();
    if (!q) return [] as string[];
    const base = streetsForCity.length ? streetsForCity : Object.values(streetsIndex).flat();
    // Rank by similarity and startsWith priority
    const items = base
      .map((s) => ({ s, score: similarity(q, s) + (normalize(s).startsWith(normalize(q)) ? 0.15 : 0) }))
      .filter((x) => x.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.s);
    return Array.from(new Set(items));
  }, [address, city, streetsIndex, streetsForCity]);

  function pickSuggestion(street: string) {
    // preserve house number if present
    const m = address.match(/^(\s*\d{1,3})/);
    const num = m ? m[1].trim() + ' ' : '';
    setAddress(num + street);
    setSuggestOpen(false);
    // If city unknown, try resolve from street
    if (!isKnownVillage(city)) {
      const resolved = resolveCityFromStreet(street);
      if (resolved.length === 1 && resolved[0].score > 0.85) setCity(resolved[0].city);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    const trimmed = { city: city.trim(), address: address.trim() };
    const ac = autoCompleteAddress(trimmed);
    const stop: Stop = {
      id,
      address: ac.address || address.trim(),
      city: ac.city,
      phone: phone.trim() || undefined,
      time: time.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    onSubmit(stop);
    // Add to user streets cache
    const m = stop.address.match(/^\s*\d{1,3}\s+(.*)$/);
    const streetOnly = (m ? m[1] : stop.address).trim();
    addUserStreet(stop.city, streetOnly);
    // Reset for next entry
    setAddress(''); setPhone(''); setTime(''); setNotes('');
    // keep city as is
    inputRef.current?.focus();
  }

  function startVoice() {
    setSpeechError(null);
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechError('La dictée vocale n\'est pas supportée par ce navigateur.'); return; }
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = (e: any) => { setListening(false); setSpeechError(e?.error || 'Erreur dictée'); };
    rec.onend = () => setListening(false);
    rec.onresult = (ev: any) => {
      const transcript: string = ev.results?.[0]?.[0]?.transcript || '';
      if (!transcript) return;
      // Use existing parser and resolver
      const parsed = parseTicketText(transcript);
      const ac = autoCompleteAddress({ address: parsed.address, city: parsed.city });
      if (parsed.address) setAddress(parsed.address);
      if (ac.city) setCity(ac.city);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.time) setTime(parsed.time);
      if (parsed.notes) setNotes(parsed.notes);
    };
    try { rec.start(); } catch (e) { setSpeechError('Impossible de démarrer la dictée'); setListening(false); }
  }

  return (
    <section className="container">
      <form className="card" onSubmit={submit}>
        <div className="row" style={{ alignItems: 'end' }}>
          <div style={{ flex: 2 }}>
            <label>Ville</label>
            <div className="chips">
              {cityList.map((c) => (
                <button type="button" key={c} className={`chip ${city === c ? 'chip-active' : ''}`} onClick={() => setCity(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 3, position: 'relative' }}>
            <label htmlFor="address">Adresse</label>
            <input
              id="address"
              ref={inputRef}
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
              placeholder="16 Rue du Parc"
              required
            />
            {suggestOpen && suggestions.length > 0 && (
              <div className="suggest-popover">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" className="suggest-item" onMouseDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid cols-2" style={{ marginTop: 12 }}>
          <div>
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 88 86 71 02" />
          </div>
          <div>
            <label htmlFor="time">Horaire</label>
            <input id="time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="19:30" />
          </div>
          <div className="wide">
            <label htmlFor="notes">Notes</label>
            <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="coupé; couteau; fourchette" />
          </div>
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button type="submit">Ajouter à la tournée</button>
          <button type="button" className="outline" onClick={startVoice} disabled={listening} aria-live="polite">
            {listening ? 'Écoute en cours…' : 'Mode vocal'}
          </button>
        </div>
        {speechError && <div className="muted" role="alert" style={{ color: '#fca5a5' }}>{speechError}</div>}
      </form>
    </section>
  );
}
