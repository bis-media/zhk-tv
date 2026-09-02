import type { Metadata } from 'next';

import { MapExplorer } from '@/components/MapExplorer';
import { dataset } from '@/lib/dataset';
import { n } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Карта размещения — Умные экраны в ЖК',
  description: 'Все жилые комплексы сети на карте: экраны, охват и стоимость размещения по каждому ЖК.',
};

export default function MapPage() {
  return (
    <div className="wrap" style={{ paddingTop: 36 }}>
      <h1>Карта размещения</h1>
      <p className="section__sub" style={{ marginTop: 12 }}>
        {n(dataset.totals.complexes)} жилых комплексов в {dataset.totals.cities} городах.
        Размер точки — количество экранов в ЖК. Нажмите на точку, чтобы увидеть охват
        и стоимость, и добавьте комплекс в медиаплан прямо с карты.
      </p>

      <MapExplorer />

      <div className="section" style={{ paddingBottom: 8 }}>
        <div className="note note--muted">
          Координаты взяты из адресов домов сети. У трёх домов из {n(dataset.totals.houses)} координат
          в исходных данных нет — они не отображаются на карте, но участвуют в расчёте.
        </div>
      </div>
    </div>
  );
}
