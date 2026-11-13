import { SESSION_KEY, STATE_KEY } from "@/lib/constants";
import type { DemoState, Session } from "@/lib/types";

const LOCAL_ACCOUNTS_KEY = "blackline.local-accounts.v1";

export interface LocalAccount {
  email: string;
  password: string;
  userId: string;
  name: string;
}

function isState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const record = value as DemoState;
  return Array.isArray(record.artists) && Array.isArray(record.bookings) && Array.isArray(record.customers) && Boolean(record.settings);
}

export function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(state: DemoState) {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return "Storage is full. Remove a large image and try again.";
  }
}

export function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.role || !parsed.userId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

export function loadLocalAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_ACCOUNTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalAccount => {
      if (!item || typeof item !== "object") return false;
      const account = item as LocalAccount;
      return typeof account.email === "string" && typeof account.password === "string" && typeof account.userId === "string" && typeof account.name === "string";
    });
  } catch {
    return [];
  }
}

export function saveLocalAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}
