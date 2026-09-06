import { getSheetsConfig } from './sheetsConfig';
import type { Account, Category, Transaction, RecurringRule } from './types';

export interface AllData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringRule[];
}

export type SheetName = 'accounts' | 'categories' | 'transactions' | 'recurring';

function num(v: unknown, fallback = 0): number {
  if (v === '' || v === undefined || v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function numOrUndefined(v: unknown): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string {
  return v === undefined || v === null ? '' : String(v);
}

function strOrUndefined(v: unknown): string | undefined {
  const s = str(v);
  return s === '' ? undefined : s;
}

function normalize(raw: Record<string, unknown[]>): AllData {
  const accounts = (raw.accounts as Record<string, unknown>[]).map((r) => ({
    id: str(r.id),
    name: str(r.name),
    type: r.type as Account['type'],
    color: str(r.color),
    openingBalance: num(r.openingBalance),
  }));
  const categories = (raw.categories as Record<string, unknown>[]).map((r) => ({
    id: str(r.id),
    name: str(r.name),
    type: r.type as Category['type'],
    color: str(r.color),
    icon: str(r.icon),
    monthlyLimit: numOrUndefined(r.monthlyLimit),
  }));
  const transactions = (raw.transactions as Record<string, unknown>[]).map((r) => ({
    id: str(r.id),
    accountId: str(r.accountId),
    categoryId: str(r.categoryId),
    type: r.type as Transaction['type'],
    amount: num(r.amount),
    note: strOrUndefined(r.note),
    date: str(r.date),
  }));
  const recurring = (raw.recurring as Record<string, unknown>[]).map((r) => ({
    id: str(r.id),
    accountId: str(r.accountId),
    categoryId: str(r.categoryId),
    type: r.type as RecurringRule['type'],
    amount: num(r.amount),
    note: strOrUndefined(r.note),
    dayOfMonth: num(r.dayOfMonth, 1),
    lastGeneratedMonth: strOrUndefined(r.lastGeneratedMonth),
  }));
  return { accounts, categories, transactions, recurring };
}

async function apiGet(action: string, params: Record<string, string> = {}) {
  const { url, token } = getSheetsConfig();
  if (!url || !token) throw new Error('not_configured');
  const qs = new URLSearchParams({ token, action, ...params });
  const res = await fetch(`${url}?${qs.toString()}`);
  if (!res.ok) throw new Error(`http_${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'request_failed');
  return json.data;
}

async function apiPost(body: Record<string, unknown>) {
  const { url, token } = getSheetsConfig();
  if (!url || !token) throw new Error('not_configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token, ...body }),
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'request_failed');
  return json as { ok: true; id?: string };
}

export async function fetchAll(): Promise<AllData> {
  const raw = await apiGet('all');
  return normalize(raw);
}

export async function createRow(sheet: SheetName, data: Record<string, unknown>): Promise<string> {
  const res = await apiPost({ action: 'create', sheet, data });
  return res.id!;
}

export async function updateRow(sheet: SheetName, id: string, data: Record<string, unknown>): Promise<void> {
  await apiPost({ action: 'update', sheet, id, data });
}

export async function deleteRow(sheet: SheetName, id: string): Promise<void> {
  await apiPost({ action: 'delete', sheet, id });
}

export async function testConnection(): Promise<void> {
  await apiGet('all');
}
