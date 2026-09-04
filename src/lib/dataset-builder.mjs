/**
 * Конвертер выгрузок Google-таблицы «Основной медиаплан Умные экраны в ЖК»
 * в датасет сайта.
 *
 * Модуль намеренно чистый: на вход — тексты CSV, на выход — готовый объект.
 * Его использует и сборочный скрипт (scripts/build-dataset.mjs, читает файлы
 * с диска), и серверный роут /api/dataset, который тянет те же вкладки
 * из таблицы на лету.
 *
 * Что делает:
 *   1. Разбирает CSV с учётом кавычек и переносов строк внутри ячеек
 *      (в исходнике ~12 адресов содержат перенос и ломают наивный парсинг).
 *   2. Схлопывает строки-размещения в дома по уникальному адресу, чтобы
 *      не задваивать жителей: у дома с экранами в холле и в лифте две строки
 *      с одинаковым числом жителей.
 *   3. Схлопывает дома в ЖК и считает агрегаты для калькулятора.
 */

/* ------------------------------------------------------------------ CSV --- */

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = String(text).replace(/^﻿/, '').replace(/\r\n/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

/** «1 154» / «1 154» / «» / «#REF!» -> число или null */
function num(v) {
  if (v == null) return null;
  const cleaned = String(v).replace(/[\s  ]/g, '').replace(',', '.');
  if (!cleaned || cleaned.startsWith('#')) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const int = (v) => { const n = num(v); return n == null ? 0 : Math.round(n); };
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------- нормализация ---- */

const SCREEN_TYPE_FIXES = { 'Венртикальный 4*3': 'Вертикальный 4*3' };
const normScreenType = (v) => SCREEN_TYPE_FIXES[clean(v)] ?? clean(v);

/** Тип города для скидочной сетки — по префиксу кода ЖК, как в исходной формуле. */
function cityTier(gid) {
  const prefix = clean(gid).replace(/\d+/g, '').toUpperCase();
  if (['U', 'NN', 'KZN'].includes(prefix)) return 'миллионник';
  if (prefix === 'MSC') return 'мск';
  return 'остальное';
}

/* ----------------------------------------------------------- колонки ----- */

const EFIR = {
  gid: 0, region: 1, city: 2, district: 3, pack: 4, category: 5, screensSince: 6, housing: 7,
  complex: 8, address: 9, lat: 10, lon: 11, builtYear: 12, floors: 13, flats: 14, residents: 15,
  screens: 16, hallScreens: 17, halls: 18, liftScreens: 19, lifts: 20, screenType: 21, mode: 22,
  format: 23, duration: 24, block: 25, showsPerDayPerScreen: 26, days: 27, showsPerPeriod: 28,
  frequency: 29, ots: 30, cpt: 31, camera: 32, photo: 33,
  priceScreenNoVat: 34, priceScreenVat: 35, priceHouseNoVat: 36, priceHouseVat: 37,
};

const BANNER = {
  gid: 0, region: 1, city: 2, complex: 8, address: 9, screens: 16, format: 23, days: 24,
  frequency: 25, ots: 26, cpt: 27, priceScreenNoVat: 30, priceScreenVat: 31,
  priceHouseNoVat: 32, priceHouseVat: 33,
};

const keyOf = (region, city, complex) => `${clean(region)}|${clean(city)}|${clean(complex)}`;

/* ------------------------------------------------------------ константы -- */

export const FORMATS = {
  video: {
    id: 'video',
    title: 'Видеоролик 10 секунд',
    short: 'Основной эфир',
    description: 'Ролик 10 сек в основном блоке экрана. 576 показов в сутки на экран, блок 150 сек, показ без звука.',
    creative: '1032×774 px',
    pricePerScreenNoVat: 3279,
    pricePerScreenVat: 4000,
  },
  banner: {
    id: 'banner',
    title: 'Генеральный баннер',
    short: 'Статичный баннер',
    description: 'Статичный баннер в верхней части экрана — виден весь эфир, без ротации с другими рекламодателями.',
    creative: '1032×234 px',
    pricePerScreenNoVat: 6557,
    pricePerScreenVat: 8000,
  },
};

export const DISCOUNT_GRID = {
  'А|миллионник': 0.625,
  'Б|миллионник': 0.75,
  'А|мск': 0.5,
  'Б|мск': 0.625,
  'А|остальное': 0.7,
  'Б|остальное': 0.8,
};

/* -------------------------------------------------------------- сборка --- */

function readPlacements(text, map, kind, problems, label) {
  const rows = parseCsv(text).slice(2);
  const out = [];
  for (const r of rows) {
    const gid = clean(r[map.gid]);
    const city = clean(r[map.city]);
    const complex = clean(r[map.complex]);
    if (!gid || !city || !complex) continue;
    if (kind === 'video' && int(r[map.days]) !== 31) {
      problems.push(`${label}: строка ЖК «${complex}» (${city}) с нетипичным периодом — пропущена`);
      continue;
    }
    const ots = num(r[map.ots]);
    if (ots == null) problems.push(`${label}: у дома «${clean(r[map.address])}» (${complex}, ${city}) нет OTS (#REF! в исходнике)`);
    out.push({
      gid, region: clean(r[map.region]), city, complex,
      address: clean(r[map.address]),
      screens: int(r[map.screens]),
      ots: ots ?? 0,
      otsMissing: ots == null,
      priceNoVat: int(r[map.priceHouseNoVat]),
      priceVat: int(r[map.priceHouseVat]),
      raw: r,
    });
  }
  return out;
}

function readStopList(text) {
  const rows = parseCsv(text);
  const groups = [{ title: 'Общие ограничения', items: [] }];
  let current = groups[0];
  for (const r of rows.slice(2)) {
    const a = clean(r[0]);
    const b = clean(r[1]);
    if (!a && !b) continue;
    if (a && !/^\d+$/.test(a) && !b) {
      current = { title: a.replace(/^Сфера\s+/i, 'Сфера: '), items: [] };
      groups.push(current);
      continue;
    }
    if (!b) continue;
    if (/^Организации и продукции/i.test(b)) continue;
    current.items.push(b.charAt(0).toUpperCase() + b.slice(1));
  }
  return groups.filter((g) => g.items.length);
}

function readTech(text) {
  const rows = parseCsv(text);
  const lines = rows.map((r) => clean(r.find((x) => clean(x)) ?? '')).filter(Boolean);
  return lines.filter((l) => !/^Технические требования/i.test(l));
}

/**
 * @param {{efir: string, banner: string, stoplist: string, tt: string, developers: object}} sources
 */
export function buildDataset(sources) {
  const problems = [];

  const videoRows = readPlacements(sources.efir, EFIR, 'video', problems, 'Основной эфир');
  const bannerRows = readPlacements(sources.banner, BANNER, 'banner', problems, 'Генеральный баннер');

  /* баннерные метрики по (ЖК|адрес) */
  const bannerByHouse = new Map();
  for (const b of bannerRows) {
    const k = `${keyOf(b.region, b.city, b.complex)}|${b.address}`;
    const acc = bannerByHouse.get(k) ?? { screens: 0, ots: 0, priceNoVat: 0, priceVat: 0 };
    acc.screens += b.screens;
    acc.ots += b.ots;
    acc.priceNoVat += b.priceNoVat;
    acc.priceVat += b.priceVat;
    bannerByHouse.set(k, acc);
  }

  /* ----------------------------------------------- дома внутри ЖК -------- */

  const complexes = new Map();

  for (const row of videoRows) {
    const r = row.raw;
    const key = keyOf(row.region, row.city, row.complex);

    let c = complexes.get(key);
    if (!c) {
      c = {
        key,
        gid: row.gid,
        tier: cityTier(row.gid),
        region: row.region,
        city: row.city,
        districts: new Set(),
        packages: new Set(),
        categories: new Set(),
        housingClasses: new Set(),
        screenTypes: new Set(),
        name: row.complex,
        houses: new Map(),
      };
      complexes.set(key, c);
    }
    c.districts.add(clean(r[EFIR.district]));
    c.packages.add(clean(r[EFIR.pack]));
    c.categories.add(clean(r[EFIR.category]));
    c.housingClasses.add(clean(r[EFIR.housing]));
    c.screenTypes.add(normScreenType(r[EFIR.screenType]));

    const addr = row.address;
    let h = c.houses.get(addr);
    if (!h) {
      h = {
        address: addr,
        lat: num(r[EFIR.lat]),
        lon: num(r[EFIR.lon]),
        builtYear: int(r[EFIR.builtYear]) || null,
        floors: int(r[EFIR.floors]) || null,
        // квартиры и жители повторяются в каждой строке-размещении одного дома —
        // берём один раз, иначе охват задваивается
        flats: int(r[EFIR.flats]),
        residents: int(r[EFIR.residents]),
        screens: 0, hallScreens: 0, liftScreens: 0,
        screenTypes: new Set(),
        showsPerDay: 0,
        videoOts: 0, videoOtsMissing: false, bannerOtsMissing: false,
        videoNoVat: 0, videoVat: 0,
        bannerScreens: 0, bannerOts: 0, bannerNoVat: 0, bannerVat: 0,
        photo: clean(r[EFIR.photo]) || null,
      };
      c.houses.set(addr, h);
    }
    h.screens += row.screens;
    h.hallScreens += int(r[EFIR.hallScreens]);
    h.liftScreens += int(r[EFIR.liftScreens]);
    h.screenTypes.add(normScreenType(r[EFIR.screenType]));
    h.showsPerDay += int(r[EFIR.showsPerDayPerScreen]) * row.screens;
    h.videoOts += row.ots;
    if (row.otsMissing) h.videoOtsMissing = true;
    h.videoNoVat += row.priceNoVat;
    h.videoVat += row.priceVat;
    if (!h.photo && clean(r[EFIR.photo])) h.photo = clean(r[EFIR.photo]);
  }

  const bannerMissingOts = new Set(
    bannerRows.filter((b) => b.otsMissing).map((b) => `${keyOf(b.region, b.city, b.complex)}|${b.address}`),
  );

  for (const c of complexes.values()) {
    for (const h of c.houses.values()) {
      const k = `${c.key}|${h.address}`;
      const b = bannerByHouse.get(k);
      if (b) {
        h.bannerScreens = b.screens;
        h.bannerOts = b.ots;
        h.bannerOtsMissing = bannerMissingOts.has(k);
        h.bannerNoVat = b.priceNoVat;
        h.bannerVat = b.priceVat;
      } else {
        // баннер крутится на том же экране — если строки нет, считаем по прайсу
        h.bannerScreens = h.screens;
        h.bannerOts = 0;
        h.bannerOtsMissing = true;
        h.bannerNoVat = h.videoNoVat * 2;
        h.bannerVat = h.videoVat * 2;
        problems.push(`Генеральный баннер: нет строки для «${h.address}» (${c.name}, ${c.city}) — цена посчитана как удвоенный видеопрайс`);
      }
    }
  }

  /**
   * В исходнике часть OTS потеряна (#REF!). Чтобы калькулятор не показывал ноль охвата,
   * достраиваем их по среднему числу контактов на жителя × экран.
   */
  function imputeOts(field, missingField) {
    let ots = 0;
    let base = 0;
    for (const c of complexes.values()) {
      for (const h of c.houses.values()) {
        if (h[missingField] || !h.residents) continue;
        ots += h[field];
        base += h.residents * h.screens;
      }
    }
    const k = base ? ots / base : 0;
    let fixed = 0;
    for (const c of complexes.values()) {
      for (const h of c.houses.values()) {
        if (!h[missingField]) continue;
        h[field] = Math.round(k * h.residents * h.screens);
        fixed++;
      }
    }
    if (fixed) problems.push(`OTS достроен расчётом для ${fixed} дом(ов) по формату «${field === 'videoOts' ? 'видеоролик' : 'баннер'}» (в исходнике #REF!)`);
  }

  imputeOts('videoOts', 'videoOtsMissing');
  imputeOts('bannerOts', 'bannerOtsMissing');

  /* -------------------------------------------------------- итоговый JSON */

  const pickOne = (set, fallback = '') => {
    const list = [...set].filter(Boolean);
    return list.length ? list.join(', ') : fallback;
  };

  const complexList = [...complexes.values()].map((c) => {
    const houses = [...c.houses.values()].map((h) => ({
      address: h.address,
      lat: h.lat, lon: h.lon,
      year: h.builtYear, floors: h.floors,
      flats: h.flats, residents: h.residents,
      screens: h.screens, hall: h.hallScreens, lift: h.liftScreens,
      types: [...h.screenTypes].filter(Boolean),
      showsPerDay: h.showsPerDay,
      video: { ots: h.videoOts, noVat: h.videoNoVat, vat: h.videoVat },
      banner: { ots: h.bannerOts, noVat: h.bannerNoVat, vat: h.bannerVat },
      photo: h.photo,
      estimated: h.videoOtsMissing || h.bannerOtsMissing,
    }));

    const sum = (fn) => houses.reduce((a, h) => a + fn(h), 0);

    return {
      id: c.key,
      gid: c.gid,
      name: c.name,
      region: c.region,
      city: c.city,
      tier: c.tier,
      district: pickOne(c.districts),
      pack: pickOne(c.packages),
      category: pickOne(c.categories, 'Б'),
      housing: pickOne(c.housingClasses),
      screenTypes: [...c.screenTypes].filter(Boolean),
      houses: houses.length,
      screens: sum((h) => h.screens),
      flats: sum((h) => h.flats),
      residents: sum((h) => h.residents),
      showsPerDay: sum((h) => h.showsPerDay),
      video: {
        ots: sum((h) => h.video.ots),
        noVat: sum((h) => h.video.noVat),
        vat: sum((h) => h.video.vat),
      },
      banner: {
        ots: sum((h) => h.banner.ots),
        noVat: sum((h) => h.banner.noVat),
        vat: sum((h) => h.banner.vat),
      },
      housesList: houses,
    };
  }).sort((a, b) => a.city.localeCompare(b.city, 'ru') || a.name.localeCompare(b.name, 'ru'));

  /* ------------------------------------------------------------ города --- */

  const cities = [];
  for (const c of complexList) {
    let city = cities.find((x) => x.name === c.city && x.region === c.region);
    if (!city) {
      city = {
        name: c.city, region: c.region, tier: c.tier,
        complexes: 0, houses: 0, screens: 0, flats: 0, residents: 0,
        districts: new Set(), packages: new Set(),
      };
      cities.push(city);
    }
    city.complexes++;
    city.houses += c.houses;
    city.screens += c.screens;
    city.flats += c.flats;
    city.residents += c.residents;
    if (c.district) city.districts.add(c.district);
    if (c.pack) city.packages.add(c.pack);
  }
  const cityList = cities
    .map((c) => ({
      ...c,
      districts: [...c.districts].sort((a, b) => a.localeCompare(b, 'ru')),
      packages: [...c.packages].sort((a, b) => a.localeCompare(b, 'ru')),
    }))
    .sort((a, b) => b.screens - a.screens);

  const totals = {
    cities: cityList.length,
    regions: new Set(complexList.map((c) => c.region)).size,
    complexes: complexList.length,
    houses: complexList.reduce((a, c) => a + c.houses, 0),
    screens: complexList.reduce((a, c) => a + c.screens, 0),
    flats: complexList.reduce((a, c) => a + c.flats, 0),
    residents: complexList.reduce((a, c) => a + c.residents, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    source: 'Google Sheets «Основной медиаплан Умные экраны в ЖК»',
    totals,
    formats: FORMATS,
    vatRate: 0.22,
    periodDays: 31,
    discountGrid: DISCOUNT_GRID,
    cities: cityList,
    complexes: complexList,
    stopList: readStopList(sources.stoplist),
    developerRules: sources.developers,
    tech: readTech(sources.tt),
    problems: [...new Set(problems)],
  };
}

/**
 * Проверка перед тем, как показывать данные на сайте. Если в таблице
 * переставили колонки или выгрузка пришла битой, лучше остаться
 * на прошлой версии, чем показать клиенту пустой или неверный прайс.
 */
export function validateDataset(dataset) {
  const errors = [];
  const t = dataset?.totals;
  if (!t) return ['датасет не собрался'];
  if (t.complexes < 50) errors.push(`жилых комплексов всего ${t.complexes} — похоже на битую выгрузку`);
  if (t.screens < 500) errors.push(`экранов всего ${t.screens} — похоже на битую выгрузку`);
  if (t.cities < 3) errors.push(`городов всего ${t.cities}`);
  if (!dataset.stopList?.length) errors.push('пустой стоп-лист');
  if (!dataset.tech?.length) errors.push('пустые техтребования');
  const priced = dataset.complexes?.filter((c) => c.video?.vat > 0).length ?? 0;
  if (priced < t.complexes * 0.9) errors.push('у части ЖК нет цены');
  return errors;
}
