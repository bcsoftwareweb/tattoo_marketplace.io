import type { DemoState, Role, Session } from "@/lib/types";

export interface DemoAccount {
  email: string;
  password: string;
  role: Role;
  userId: string;
  name: string;
  blurb: string;
}

export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "customer@demo.com",
    password: DEMO_PASSWORD,
    role: "customer",
    userId: "maya-chen",
    name: "Maya Chen",
    blurb: "Customer · Maya Chen",
  },
  {
    email: "artist@demo.com",
    password: DEMO_PASSWORD,
    role: "artist",
    userId: "nova-reyes",
    name: "Nova Reyes",
    blurb: "Artist · Nova Reyes",
  },
  {
    email: "admin@demo.com",
    password: DEMO_PASSWORD,
    role: "admin",
    userId: "avery-quinn",
    name: "Avery Quinn",
    blurb: "Administrator · Avery Quinn",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function authenticate(
  email: string,
  password: string,
): { ok: true; session: Session } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Enter your email address." };
  if (!EMAIL_PATTERN.test(normalized)) return { ok: false, error: "Enter a valid email address." };
  if (!password) return { ok: false, error: "Enter your password." };

  const account = DEMO_ACCOUNTS.find((item) => item.email === normalized);
  if (!account || account.password !== password) {
    return { ok: false, error: "That email and password do not match an account." };
  }

  return {
    ok: true,
    session: {
      role: account.role,
      userId: account.userId,
      email: account.email,
      name: account.name,
    },
  };
}

export function accountForRole(role: Role) {
  return DEMO_ACCOUNTS.find((account) => account.role === role) ?? null;
}

export function accountBlock(state: DemoState, session: Session) {
  if (session.role === "customer") {
    const customer = state.customers.find((item) => item.id === session.userId);
    if (!customer) return "This customer profile is missing.";
    if (customer.status === "suspended") return "This customer account is suspended.";
  }
  if (session.role === "artist") {
    const artist = state.artists.find((item) => item.id === session.userId);
    if (!artist) return "This artist profile is missing.";
    if (artist.verificationStatus === "suspended") return "This artist account is suspended.";
    if (artist.verificationStatus === "rejected") return "This artist application was rejected.";
  }
  return null;
}
