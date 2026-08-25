import { Menu, X } from 'lucide-react';

interface SiteNavigationProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onNotice: (message: string) => void;
}

export function SiteNavigation({ menuOpen, onMenuToggle, onNotice }: SiteNavigationProps) {
  return (
    <>
      <nav className="nav-actions" aria-label="Main navigation">
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
      <button type="button" onClick={() => onNotice('A quieter way to work with your context.')} data-testid="button-mobile-about">About</button>
      <button type="button" onClick={() => onNotice('Profile settings are coming with your workspace.')} data-testid="button-mobile-profile">Profile</button>
    </div>
  );
}
