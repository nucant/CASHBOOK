const URL_KEY = 'cb-sheets-url';
const TOKEN_KEY = 'cb-sheets-token';

export const DEFAULT_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbzSTYFJ8wnIdVEaxi90bSLn2X33psFHeqojyibZazNmzoxeyu4BjP-DE50UngObxxU-/exec';
export const DEFAULT_SHEETS_TOKEN = 'NUCANT007';

export function getSheetsConfig(): { url: string; token: string } {
  return {
    url: localStorage.getItem(URL_KEY) ?? '',
    token: localStorage.getItem(TOKEN_KEY) ?? '',
  };
}

export function setSheetsConfig(url: string, token: string): void {
  localStorage.setItem(URL_KEY, url.trim());
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearSheetsConfig(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isConfigured(): boolean {
  const { url, token } = getSheetsConfig();
  return Boolean(url && token);
}

export function useDefaultsIfUnconfigured(): void {
  if (!isConfigured()) {
    setSheetsConfig(DEFAULT_SHEETS_URL, DEFAULT_SHEETS_TOKEN);
  }
}
