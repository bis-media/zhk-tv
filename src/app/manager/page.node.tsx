import type { Metadata } from 'next';
import Link from 'next/link';

import { ManagerLogin } from '@/components/ManagerLogin';
import { dataset, discountGrid } from '@/lib/dataset';
import { percent } from '@/lib/format';
import { isManager } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Режим менеджера',
  robots: { index: false, follow: false },
};

export default async function ManagerPage() {
  const manager = await isManager();

  return (
    <div className="wrap" style={{ paddingTop: 36, maxWidth: 900 }}>
      <h1>Режим менеджера</h1>

      {manager ? (
        <>
          <p className="section__sub" style={{ marginTop: 12 }}>
            Вы вошли. В калькуляторе теперь видны категорийная скидка, поля персональной скидки
            и итоговая цена. Клиент по обычной ссылке этих цифр не видит.
          </p>

          <div className="section">
            <div className="card card--pad stack gap-12">
              <h3>Категорийная скидка</h3>
              <p className="small muted">
                Применяется автоматически по паре «категория ЖК + тип города».
                Персональная скидка считается уже от цены со скидкой.
              </p>
              <div className="tablewrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Категория ЖК</th>
                      <th>Тип города</th>
                      <th className="num">Скидка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(discountGrid).map(([key, value]) => {
                      const [category, tier] = key.split('|');
                      return (
                        <tr key={key}>
                          <td className="strong">{category}</td>
                          <td className="muted">{tier}</td>
                          <td className="num">{percent(value, 1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="note note--muted">
                Тип города определяется по коду ЖК: U, NN, KZN — миллионник; MSC — Москва
                и область; остальные — «остальное». Прайс: {' '}
                {dataset.formats.video.pricePerScreenVat} ₽ за экран в месяц с НДС для ролика,{' '}
                {dataset.formats.banner.pricePerScreenVat} ₽ — для генерального баннера.
              </div>
            </div>
          </div>

          <div className="section">
            <Link href="/calculator" className="btn btn--lg">Перейти к расчёту</Link>
          </div>
        </>
      ) : (
        <>
          <p className="section__sub" style={{ marginTop: 12 }}>
            Вход для сотрудников отдела продаж. В этом режиме калькулятор показывает скидочную
            сетку, поля для персональной скидки и итоговую цену со скидкой.
          </p>
          <div className="section">
            <ManagerLogin />
          </div>
        </>
      )}
    </div>
  );
}
