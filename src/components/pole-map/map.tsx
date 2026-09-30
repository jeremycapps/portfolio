import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { filterPoles, poles, statusLabel, type Pole, type PoleFilter } from '@/lib/pole-map/model';
import 'leaflet/dist/leaflet.css';

type MapState = { leaflet: typeof Leaflet; map: Leaflet.Map };

// The site's dark mode follows the system setting (index.css), so the basemap does too.
function usePrefersDark() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return dark;
}

export function PoleMap({ filter, selected, onSelect }: {
  filter: PoleFilter;
  selected: Pole | null;
  onSelect: (pole: Pole) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<MapState | null>(null);
  const [failed, setFailed] = useState(false);
  const dark = usePrefersDark();

  useEffect(() => {
    let disposed = false;
    let map: Leaflet.Map | undefined;
    let resize: ResizeObserver | undefined;
    // Leaflet reads window at import time; this boundary also protects prerendering.
    void import('leaflet').then((leaflet) => {
      if (disposed || !container.current) return;
      map = leaflet.map(container.current, { maxZoom: 17, scrollWheelZoom: false });
      map.fitBounds(leaflet.latLngBounds(poles.map((pole) => [pole.lat, pole.lon])).pad(0.08));
      resize = new ResizeObserver(() => map?.invalidateSize());
      resize.observe(container.current);
      setInstance({ leaflet, map });
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true;
      resize?.disconnect();
      map?.remove();
    };
  }, []);

  useEffect(() => {
    if (!instance || dark === null) return;
    const { leaflet, map } = instance;
    const canvas = dark ? 'World_Dark_Gray' : 'World_Light_Gray';
    const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
    const query = apiKey ? `?token=${encodeURIComponent(apiKey)}` : '';
    const layers = ['Base', 'Reference'].map((part) => leaflet.tileLayer(
      `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${canvas}_${part}/MapServer/tile/{z}/{y}/{x}${query}`,
      {
        maxNativeZoom: 16, maxZoom: 17,
        attribution: part === 'Base' ? 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors' : undefined,
      },
    ).addTo(map));
    return () => { layers.forEach((layer) => layer.remove()); };
  }, [instance, dark]);

  useEffect(() => {
    if (!instance) return;
    const { leaflet, map } = instance;
    const markers = filterPoles(poles, filter).map((pole) => {
      const glyph = pole.review_reason ?? 'matches_scan';
      const marker = leaflet.marker([pole.lat, pole.lon], {
        icon: leaflet.divIcon({
          html: `<span class="pole-glyph pole-glyph--${glyph}" aria-hidden="true"></span>`,
          className: 'pole-marker', iconSize: [28, 28], iconAnchor: [14, 14],
        }),
        title: `Pole ${pole.id} · ${statusLabel(pole)}`,
        alt: `Pole ${pole.id} · ${statusLabel(pole)}`,
        zIndexOffset: pole.status === 'review' ? 1000 : 0,
      });
      marker.on('click', () => onSelect(pole));
      return marker;
    });
    const layer = leaflet.layerGroup(markers).addTo(map);
    return () => { layer.remove(); };
  }, [filter, instance, onSelect]);

  useEffect(() => {
    if (instance && selected) instance.map.setView([selected.lat, selected.lon], 17, { animate: false });
  }, [instance, selected]);

  return <div className="pole-map" ref={container} role="region" aria-label="Map of telecom poles">
    {!instance && <p className="pole-map-placeholder">{failed ? 'Map unavailable. Select a pole from the under-review list below.' : 'Map loads here. The under-review list is below.'}</p>}
  </div>;
}
