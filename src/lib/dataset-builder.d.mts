import type { Dataset } from './types';

export interface DatasetSources {
  efir: string;
  banner: string;
  stoplist: string;
  tt: string;
  developers: Dataset['developerRules'];
}

export declare function parseCsv(text: string): string[][];
export declare function buildDataset(sources: DatasetSources): Dataset;
export declare function validateDataset(dataset: Dataset | null | undefined): string[];
export declare const FORMATS: Dataset['formats'];
export declare const DISCOUNT_GRID: Record<string, number>;
