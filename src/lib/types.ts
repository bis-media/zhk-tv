export type FormatId = 'video' | 'banner';
export type Category = 'А' | 'Б';
export type Tier = 'миллионник' | 'мск' | 'остальное';

export interface FormatMetrics {
  ots: number;
  noVat: number;
  vat: number;
}

export interface House {
  address: string;
  lat: number | null;
  lon: number | null;
  year: number | null;
  floors: number | null;
  flats: number;
  residents: number;
  screens: number;
  hall: number;
  lift: number;
  types: string[];
  showsPerDay: number;
  video: FormatMetrics;
  banner: FormatMetrics;
  photo: string | null;
  estimated: boolean;
}

export interface Complex {
  id: string;
  gid: string;
  name: string;
  region: string;
  city: string;
  tier: Tier;
  district: string;
  pack: string;
  category: string;
  housing: string;
  screenTypes: string[];
  houses: number;
  screens: number;
  flats: number;
  residents: number;
  showsPerDay: number;
  video: FormatMetrics;
  banner: FormatMetrics;
  housesList: House[];
}

export interface City {
  name: string;
  region: string;
  tier: Tier;
  complexes: number;
  houses: number;
  screens: number;
  flats: number;
  residents: number;
  districts: string[];
  packages: string[];
}

export interface FormatInfo {
  id: FormatId;
  title: string;
  short: string;
  description: string;
  creative: string;
  pricePerScreenNoVat: number;
  pricePerScreenVat: number;
}

export interface StopListGroup {
  title: string;
  items: string[];
}

export interface DeveloperRule {
  region: string;
  city: string;
  category: string;
  allowed: boolean;
}

export interface Dataset {
  generatedAt: string;
  source: string;
  totals: {
    cities: number;
    regions: number;
    complexes: number;
    houses: number;
    screens: number;
    flats: number;
    residents: number;
  };
  formats: Record<FormatId, FormatInfo>;
  vatRate: number;
  periodDays: number;
  discountGrid?: Record<string, number>;
  cities: City[];
  complexes: Complex[];
  stopList: StopListGroup[];
  developerRules: { defaultAllowed: boolean; rules: DeveloperRule[] };
  tech: string[];
  problems?: string[];
}

/** Что выбрано: id ЖК -> 'all' либо список адресов домов. */
export type Selection = Record<string, 'all' | string[]>;

export interface QuoteInput {
  format: FormatId;
  months: number;
  selection: Selection;
  advertiser: {
    company: string;
    contact: string;
    email: string;
    phone: string;
    industry: string;
    comment: string;
  };
  /** Персональные скидки менеджера, id ЖК -> процент. Ключ '*' — скидка на весь расчёт. */
  personalDiscounts?: Record<string, number>;
  /** Показывать ли клиенту скидочную цену в сохранённой ссылке. */
  revealDiscounts?: boolean;
}

export interface StoredQuote extends QuoteInput {
  id: string;
  createdAt: string;
  createdBy: 'client' | 'manager';
}
