import React from 'react';

type Props = { onInstallClick?: () => void; canInstall: boolean };

export default function Header({ onInstallClick, canInstall }: Props) {
  return (
    <header className="container" style={{ paddingTop: 16 }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Ticket to Maps</h1>
          <p className="muted" style={{ marginTop: 4 }}>Scanner OCR → Itinéraire Google Maps</p>
        </div>
        <div>
          {canInstall && (
            <button aria-label="Installer l'application" onClick={onInstallClick}>Installer</button>
          )}
        </div>
      </div>
    </header>
  );
}

