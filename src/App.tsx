import React, { useEffect, useMemo, useState } from 'react';
import Header from '@components/Header';
import Footer from '@components/Footer';
import ManualEntry from '@components/ManualEntry';
import RouteList from '@components/RouteList';
import OrderControls from '@components/OrderControls';
import type { OrderMode, Stop } from './types';
import { initOcr } from '@utils/ocr';
import { openMaps, buildGmapsUrl, DEFAULT_ORIGIN } from '@utils/maps';
import { loadStops, saveStops, clearStops, loadMode, saveMode, loadOrigin, saveOrigin } from '@utils/storage';
import { autoCompleteAddress, addUserStreet } from '@utils/resolver';
import DisambiguationDialog from '@components/DisambiguationDialog';

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [initialFromOcr, setInitialFromOcr] = useState<Partial<Stop> | undefined>(undefined);
  const [rawText, setRawText] = useState<string>('');
  const [stops, setStops] = useState<Stop[]>(() => loadStops());
  const [mode, setMode] = useState<OrderMode>(() => loadMode());
  // Origin fixed: pizzeria address
  const origin = DEFAULT_ORIGIN;
  const [disambOpen, setDisambOpen] = useState(false);
  const [disambCandidates, setDisambCandidates] = useState<{ city: string; street: string; score: number }[]>([]);
  const [pendingAddress, setPendingAddress] = useState<Partial<Stop> | undefined>(undefined);

  useEffect(() => {
    // Prepare OCR worker early
    initOcr().catch(() => {});
  }, []);

  useEffect(() => {
    saveStops(stops);
  }, [stops]);

  useEffect(() => { saveMode(mode); }, [mode]);
  // origin is fixed; no persistence needed

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function onInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => setCanInstall(false));
  }

  // handleExtract kept for potential future OCR flow; not used in manual-only UI
  function handleExtract(parsed: Partial<Stop>, raw: string) {
    const ac = autoCompleteAddress({ address: parsed.address, city: parsed.city });
    const next: Partial<Stop> = { ...parsed, city: ac.city };
    setRawText(raw);
    if (ac.needsDisambiguation && ac.candidates.length) {
      setDisambCandidates(ac.candidates);
      setPendingAddress(next);
      setDisambOpen(true);
    } else {
      setInitialFromOcr(next);
      setPendingAddress(undefined);
    }
  }

  function addStop(s: Stop) {
    setStops((prev) => [...prev, s]);
    setInitialFromOcr(undefined);
    setRawText('');
  }

  function reorder(next: Stop[]) { setStops(next); }
  function update(id: string, patch: Partial<Stop>) { setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))); }
  function remove(id: string) { setStops((prev) => prev.filter((s) => s.id !== id)); }

  function sortByTime(list: Stop[]) {
    return list.slice().sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }

  const viewStops = useMemo(() => (mode === 'time' ? sortByTime(stops) : stops), [mode, stops]);

  function openInMaps() {
    openMaps(viewStops, origin);
  }

  const url = useMemo(() => buildGmapsUrl(viewStops, origin), [viewStops, origin]);

  return (
    <div>
      <Header canInstall={canInstall} onInstallClick={onInstallClick} />

      <section className="container">
        <div className="card">
          <div><strong>Départ:</strong> {origin}</div>
          <div className="muted">Toutes les livraisons partent de la pizzeria.</div>
        </div>
      </section>

      <ManualEntry onSubmit={addStop} />

      <OrderControls mode={mode} onChange={setMode} />

      <RouteList stops={viewStops} onReorder={reorder} onUpdate={update} onDelete={remove} disabledDnd={mode === 'time'} />

      <section className="container sticky-footer">
        <div className="card">
          <div className="actions">
            <a href={url} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
              <button disabled={viewStops.length === 0}>Ouvrir dans Google Maps</button>
            </a>
            <button className="outline" onClick={() => navigator.clipboard?.writeText(url)} disabled={viewStops.length === 0}>Copier l'URL</button>
            <button className="danger" onClick={() => { if (confirm('Vider la tournée ?')) { setStops([]); clearStops(); } }}>Vider la tournée</button>
          </div>
          <div className="muted" style={{ marginTop: 8, wordBreak: 'break-all' }}>{url}</div>
        </div>
      </section>

      <Footer />

      <DisambiguationDialog
        open={disambOpen}
        candidates={disambCandidates}
        onSelect={(city, street) => {
          setDisambOpen(false);
          // Cache this street for next time
          addUserStreet(city, street);
          const next = { ...(pendingAddress || {}), city } as Partial<Stop>;
          setInitialFromOcr(next);
          setPendingAddress(undefined);
        }}
        onCancel={() => {
          setDisambOpen(false);
          // Fallback to default city already applied in resolver
          if (pendingAddress) setInitialFromOcr(pendingAddress);
          setPendingAddress(undefined);
        }}
      />
    </div>
  );
}
