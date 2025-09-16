import React from 'react';

export default function Footer() {
  return (
    <footer className="container" style={{ paddingBottom: 24, paddingTop: 12 }}>
      <div className="row">
        <div className="muted">Version v0.1.0</div>
        <div style={{ textAlign: 'right' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Politique de confidentialité: aucun upload; toutes les données restent sur votre appareil.'); }}>Politique de confidentialité</a>
        </div>
      </div>
    </footer>
  );
}

