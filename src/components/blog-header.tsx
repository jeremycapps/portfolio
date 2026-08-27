import { useEffect, useState } from 'react';
import { MobileNavigation, SiteBrand, SiteNavigation } from './site-navigation';

export function BlogHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <>
      <header className="topbar">
        <SiteBrand />
        <SiteNavigation
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
          onNotice={setNotice}
        />
      </header>
      {menuOpen && <MobileNavigation onNotice={setNotice} />}
      {notice && <div className="toast-message" role="status">{notice}</div>}
    </>
  );
}
