import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { HOME_SYSTEMS, type HomeSystem } from '../lib/home-systems';

function SystemBody({ system }: { system: HomeSystem }) {
  const [left, right] = system.poles;
  return (
    <>
      <div className="home-system-top">
        <div>
          <div className="home-system-name">{system.name}</div>
          <div className="home-system-cat">{system.category}</div>
        </div>
        <span className="home-system-glyph" aria-hidden="true">
          {system.name.charAt(0)}
        </span>
      </div>
      <p className="home-system-desc">{system.description}</p>
      <div className="home-system-axis" aria-hidden="true">
        <div className="home-system-poles">
          <span>{left}</span>
          <span>{right}</span>
        </div>
        <div className="home-system-track">
          <span
            className="home-system-dot"
            style={{ left: `${Math.round(system.position * 100)}%` }}
          />
        </div>
      </div>
      <div className="home-system-cta">
        {system.external ? 'View on GitHub' : 'Open the instrument'}
        <ArrowUpRight aria-hidden="true" />
      </div>
    </>
  );
}

function SystemCard({ system }: { system: HomeSystem }) {
  const className = `home-system-card accent-${system.accent}`;
  const label = system.external
    ? `${system.name} on GitHub`
    : `Open ${system.name}`;

  if (system.external) {
    return (
      <a
        className={className}
        href={system.href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        data-testid={`system-${system.id}`}
      >
        <SystemBody system={system} />
      </a>
    );
  }
  return (
    <Link
      href={system.href}
      className={className}
      aria-label={label}
      data-testid={`system-${system.id}`}
    >
      <SystemBody system={system} />
    </Link>
  );
}

export function HomeSystems({
  systems = HOME_SYSTEMS,
}: {
  systems?: readonly HomeSystem[];
}): ReactNode {
  return (
    <div className="home-systems-grid">
      {systems.map((system) => (
        <SystemCard key={system.id} system={system} />
      ))}
    </div>
  );
}
