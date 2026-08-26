import { Menu, Sparkles, X } from 'lucide-react';

export function SiteBrand() {
  return (
    <a className="brand" href="/" data-testid="link-brand">
      <span className="brand-mark" aria-hidden="true">
        <Sparkles />
      </span>
      <span data-testid="text-brand-name">Domain</span>
    </a>
  );
}

interface SiteNavigationProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onNotice: (message: string) => void;
}

export function SiteNavigation({ menuOpen, onMenuToggle, onNotice }: SiteNavigationProps) {
  return (
    <>
      <nav className="nav-actions" aria-label="Main navigation">
        <a className="nav-link" href="/stratos" data-testid="link-stratos">StratOS</a>
        <button className="nav-link" type="button" onClick={() => onNotice('A quieter way to work with your context.')} data-testid="button-about">
          About
        </button>
        <button className="avatar-button" type="button" onClick={() => onNotice("This is Jeremy's portfolio — ask the assistant about his work.")} aria-label="Open profile" data-testid="button-profile">
          JC
        </button>
      </nav>

      <button className="mobile-menu" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={onMenuToggle} data-testid="button-mobile-menu">
        {menuOpen ? <X /> : <Menu />}
      </button>

    </>
  );
}

export function MobileNavigation({ onNotice }: Pick<SiteNavigationProps, 'onNotice'>) {
  return (
    <div className="mobile-nav" data-testid="menu-mobile">
      <a href="/stratos" data-testid="link-mobile-stratos">StratOS</a>
      <button type="button" onClick={() => onNotice('A quieter way to work with your context.')} data-testid="button-mobile-about">About</button>
      <button type="button" onClick={() => onNotice('Profile settings are coming with your workspace.')} data-testid="button-mobile-profile">Profile</button>
    </div>
  );
}
