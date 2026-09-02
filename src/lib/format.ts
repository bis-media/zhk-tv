const nf = new Intl.NumberFormat('ru-RU');

export const n = (v: number) => nf.format(Math.round(v || 0));

export const money = (v: number) => `${nf.format(Math.round(v || 0))} ₽`;

export const moneyShort = (v: number) => {
  const x = Math.round(v || 0);
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x >= 10_000_000 ? 0 : 1).replace('.', ',')} млн ₽`;
  if (x >= 10_000) return `${nf.format(Math.round(x / 1000))} тыс ₽`;
  return money(x);
};

export const percent = (v: number, digits = 0) =>
  `${(v * 100).toFixed(digits).replace('.', ',')}%`;

/** 1 месяц / 3 месяца / 5 месяцев */
export const months = (v: number) => {
  const mod10 = v % 10;
  const mod100 = v % 100;
  if (mod10 === 1 && mod100 !== 11) return `${v} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${v} месяца`;
  return `${v} месяцев`;
};

export const plural = (v: number, one: string, few: string, many: string) => {
  const mod10 = v % 10;
  const mod100 = v % 100;
  if (mod10 === 1 && mod100 !== 11) return `${nf.format(v)} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${nf.format(v)} ${few}`;
  return `${nf.format(v)} ${many}`;
};

export const complexes = (v: number) => plural(v, 'ЖК', 'ЖК', 'ЖК');
export const houses = (v: number) => plural(v, 'дом', 'дома', 'домов');
export const screens = (v: number) => plural(v, 'экран', 'экрана', 'экранов');
