import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type SiteSection = 'portfolio' | 'stratos' | 'blog' | 'ask';

interface SiteHeaderProps {
  current?: SiteSection;
  onNotice?: (message: string) => void;
}

export function SiteHeader({ current }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage = (section: SiteSection) => (
    current === section ? { 'aria-current': 'page' as const } : {}
  );

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-brand">
          <span data-testid="text-brand-name">JEREMY CAPPS</span>
        </a>

        <nav className="nav-actions" aria-label="Main navigation">
          <a className="nav-link" href="/blog" data-testid="link-blog" {...currentPage('blog')}>Blog</a>
          <a className="nav-link" href="/ask" data-testid="link-ask" {...currentPage('ask')}>Ask</a>
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
        <a href="/blog" data-testid="link-mobile-blog" {...currentPage('blog')}>Blog</a>
        <a href="/ask" data-testid="link-mobile-ask" {...currentPage('ask')}>Ask</a>
      </nav>
    </>
  );
}
