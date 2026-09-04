'use client';

import 'leaflet/dist/leaflet.css';

import type { CircleMarker, Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';

import { money, n } from '@/lib/format';
import type { Complex, FormatId, Selection } from '@/lib/types';

interface Props {
  complexes: Complex[];
  selection: Selection;
  blocked: Set<string>;
  format: FormatId;
  months: number;
  onToggle: (complexId: string) => void;
  /** пересчитать границы, когда меняется набор ЖК на карте */
  fitKey: string;
}

const COLORS = {
  selected: '#951b81',
  free: '#ef7d00',
  blocked: '#98989a',
};

/** средняя точка ЖК по домам с координатами */
function center(complex: Complex): [number, number] | null {
  const points = complex.housesList.filter((h) => typeof h.lat === 'number' && typeof h.lon === 'number');
  if (!points.length) return null;
  const lat = points.reduce((a, h) => a + (h.lat as number), 0) / points.length;
  const lon = points.reduce((a, h) => a + (h.lon as number), 0) / points.length;
  return [lat, lon];
}

export function ComplexMap({ complexes, selection, blocked, format, months, onToggle, fitKey }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, CircleMarker>>(new Map());
  const toggleRef = useRef(onToggle);
  toggleRef.current = onToggle;

  const points = useMemo(
    () => complexes.map((c) => ({ complex: c, point: center(c) })).filter((x) => x.point),
    [complexes],
  );

  /* карта создаётся один раз */
  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    import('leaflet').then((L) => {
      if (cancelled || !boxRef.current || mapRef.current) return;
      map = L.map(boxRef.current, { scrollWheelZoom: true, attributionControl: true })
        .setView([55.5, 50], 5);
      // по умолчанию Leaflet дописывает в подпись свой флаг — оставляем
      // только обязательную ссылку на источник тайлов
      map.attributionControl.setPrefix('Leaflet');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  /* маркеры пересобираются при смене набора ЖК, формата или срока */
  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (cancelled || !map) return;

      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();

      for (const { complex, point } of points) {
        const metrics = format === 'video' ? complex.video : complex.banner;
        const isBlocked = blocked.has(complex.id);
        const isSelected = Boolean(selection[complex.id]);
        const color = isBlocked ? COLORS.blocked : isSelected ? COLORS.selected : COLORS.free;

        const marker = L.circleMarker(point as [number, number], {
          radius: Math.min(18, 5 + Math.sqrt(complex.screens) * 1.7),
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: isBlocked ? 0.45 : 0.85,
        });

        const html = `
          <div class="mappopup">
            ${complex.photo ? `<img class="mappopup__photo" src="${escapeHtml(complex.photo)}" alt="" loading="lazy">` : ''}
            <div class="mappopup__name">${escapeHtml(complex.name)}</div>
            <div class="mappopup__meta">${escapeHtml(complex.city)}${complex.district ? ` · ${escapeHtml(complex.district)}` : ''}</div>
            <div class="mappopup__meta">кат. ${escapeHtml(complex.category)}${complex.housing ? ` · ${escapeHtml(complex.housing)}` : ''}</div>
            <div style="height:8px"></div>
            <div class="mappopup__row"><span>Домов</span><b>${n(complex.houses)}</b></div>
            <div class="mappopup__row"><span>Экранов</span><b>${n(complex.screens)}</b></div>
            <div class="mappopup__row"><span>Жителей</span><b>${n(complex.residents)}</b></div>
            <div class="mappopup__row"><span>Контактов</span><b>${n(metrics.ots * months)}</b></div>
            <div class="mappopup__row"><span>Стоимость</span><b>${money(metrics.vat * months)}</b></div>
            ${isBlocked
              ? '<div class="mappopup__meta mappopup__meta--danger" style="margin-top:10px">Застройщикам недоступно</div>'
              : `<button type="button" class="mappopup__btn" data-on="${isSelected}" data-complex="${escapeHtml(complex.id)}">${isSelected ? 'Убрать из плана' : 'Добавить в план'}</button>`}
          </div>`;

        marker.bindPopup(html);
        marker.on('popupopen', (event) => {
          const button = event.popup.getElement()?.querySelector<HTMLButtonElement>('.mappopup__btn');
          button?.addEventListener('click', () => {
            toggleRef.current(complex.id);
            map.closePopup();
          });
        });

        marker.addTo(map);
        markersRef.current.set(complex.id, marker);
      }
    });

    return () => { cancelled = true; };
  }, [points, selection, blocked, format, months]);

  /* подгоняем масштаб под текущий набор */
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (cancelled || !map || !points.length) return;
      const bounds = L.latLngBounds(points.map((p) => p.point as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    });
    return () => { cancelled = true; };
  }, [fitKey, points]);

  return (
    <div className="mapbox">
      <div ref={boxRef} className="mapbox__canvas" />
      <div className="maplegend noprint">
        <div className="maplegend__row">
          <span className="maplegend__dot" style={{ background: COLORS.selected }} /> в медиаплане
        </div>
        <div className="maplegend__row">
          <span className="maplegend__dot" style={{ background: COLORS.free }} /> доступно
        </div>
        <div className="maplegend__row">
          <span className="maplegend__dot" style={{ background: COLORS.blocked }} /> недоступно
        </div>
        <div className="maplegend__row" style={{ fontSize: 12 }}>размер точки — число экранов</div>
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
