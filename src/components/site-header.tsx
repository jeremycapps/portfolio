import { useEffect, useState } from 'react';
import { Menu, Sparkles, X } from 'lucide-react';

export type SiteSection = 'portfolio' | 'stratos' | 'blog' | 'about';

interface SiteHeaderProps {
  current?: SiteSection;
  onNotice?: (message: string) => void;
}

const PROFILE_NOTICE = "This is Jeremy's portfolio — ask the assistant about his work.";

export function SiteHeader({ current, onNotice }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [internalNotice, setInternalNotice] = useState('');

  useEffect(() => {
    if (!internalNotice) return;
    const timeout = window.setTimeout(() => setInternalNotice(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [internalNotice]);

  const showNotice = (message: string) => {
    if (onNotice) onNotice(message);
    else setInternalNotice(message);
  };
  const currentPage = (section: SiteSection) => (
    current === section ? { 'aria-current': 'page' as const } : {}
  );

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-brand">
          <span className="brand-mark" aria-hidden="true">
            <Sparkles />
          </span>
          <span data-testid="text-brand-name">Domain</span>
        </a>

        <nav className="nav-actions" aria-label="Main navigation">
          <a className="nav-link" href="/" data-testid="link-portfolio" {...currentPage('portfolio')}>Portfolio</a>
          <a className="nav-link" href="/stratos" data-testid="link-stratos" {...currentPage('stratos')}>StratOS</a>
          <a className="nav-link" href="/blog" data-testid="link-blog" {...currentPage('blog')}>Blog</a>
          <a className="nav-link" href="/about" data-testid="link-about" {...currentPage('about')}>About</a>
          <button className="avatar-button" type="button" onClick={() => showNotice(PROFILE_NOTICE)} aria-label="Open profile" data-testid="button-profile">
            JC
          </button>
        </nav>

        <button
          className="mobile-menu"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!menuOpen}
        data-testid="menu-mobile"
      >
        <a href="/" data-testid="link-mobile-portfolio" {...currentPage('portfolio')}>Portfolio</a>
        <a href="/stratos" data-testid="link-mobile-stratos" {...currentPage('stratos')}>StratOS</a>
        <a href="/blog" data-testid="link-mobile-blog" {...currentPage('blog')}>Blog</a>
        <a href="/about" data-testid="link-mobile-about" {...currentPage('about')}>About</a>
        <button type="button" onClick={() => showNotice(PROFILE_NOTICE)} data-testid="button-mobile-profile">Profile</button>
      </nav>

      {!onNotice && internalNotice && (
        <div className="toast-message" role="status">{internalNotice}</div>
      )}
    </>
  );
}
