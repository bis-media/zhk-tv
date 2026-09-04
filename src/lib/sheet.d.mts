export interface SheetTab {
  key: string;
  file: string;
  gid: string;
  name: string;
  optional?: boolean;
}

export declare const SHEET_ID: string;
export declare const SHEET_URL: string;
export declare const TABS: SheetTab[];
export declare function tabUrl(gid: string): string;
export declare function fetchSheetSources(options?: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<Record<string, string>>;
