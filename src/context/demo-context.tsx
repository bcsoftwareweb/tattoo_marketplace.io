"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { accountBlock, accountForRole, authenticate } from "@/lib/auth";
import type { BookingAction } from "@/lib/booking";
import {
  addPortfolio,
  addService,
  applyBookingAction,
  createBookingRequest,
  deleteCategory,
  deletePortfolio,
  deleteService,
  deleteStyle,
  ensureConversation,
  markAllRead,
  markNotificationRead,
  saveCategory,
  saveStyle,
  sendMessage,
  setCustomerStatus,
  setReportStatus,
  setReviewStatus,
  setVerification,
  toggleAvailability,
  toggleFavorite,
  toggleFeatured,
  updateArtistProfile,
  updateCustomer,
  updatePortfolio,
  updateService,
  updateSettings,
  updateWorkingHours,
  type ArtistPatch,
  type BookingDraft,
} from "@/lib/mutations";
import { createSeed } from "@/lib/seed";
import { loadSession, loadState, saveSession, saveState } from "@/lib/storage";
import type { Actor, Category, Customer, DemoState, PlatformSettings, PortfolioItem, Role, Service, Session, TattooStyle } from "@/lib/types";
import { uid } from "@/lib/format";

interface Toast {
  id: string;
  text: string;
}

interface DemoContextValue {
  state: DemoState;
  session: Session | null;
  ready: boolean;
  toasts: Toast[];
  login: (email: string, password: string) => { ok: true; session: Session } | { ok: false; error: string };
  logout: () => void;
  switchTo: (role: Role) => { ok: true; session: Session } | { ok: false; error: string };
  resetDemo: () => void;
  toast: (text: string) => void;
  dismissToast: (id: string) => void;
  updateArtist: (patch: ArtistPatch) => string | null;
  addPortfolioItem: (input: Omit<PortfolioItem, "id" | "artistId">) => string | null;
  editPortfolio: (id: string, patch: Partial<PortfolioItem>) => string | null;
  removePortfolio: (id: string) => string | null;
  addArtistService: (input: Omit<Service, "id" | "artistId">) => string | null;
  editService: (id: string, patch: Partial<Service>) => string | null;
  removeService: (id: string) => string | null;
  toggleDay: (date: string) => string | null;
  saveHours: (hours: DemoState["artists"][number]["workingHours"]) => string | null;
  saveCustomer: (patch: Partial<Pick<Customer, "name" | "phone" | "photo" | "borough" | "neighborhood" | "bio">>) => string | null;
  favorite: (artistId: string) => string | null;
  openThread: (artistId: string) => { id?: string; error?: string };
  postMessage: (conversationId: string, body: string, attachment: { name: string; url: string } | null) => string | null;
  requestAppointment: (draft: BookingDraft) => { id?: string; error?: string };
  act: (bookingId: string, action: BookingAction) => string | null;
  readNotification: (id: string) => void;
  readAll: () => void;
  verifyArtist: (artistId: string, status: DemoState["artists"][number]["verificationStatus"], note: string) => string | null;
  setCustomerAccess: (customerId: string, status: Customer["status"]) => string | null;
  moderateReview: (reviewId: string, status: DemoState["reviews"][number]["status"]) => string | null;
  resolveReport: (reportId: string, status: DemoState["reports"][number]["status"]) => string | null;
  featureArtist: (artistId: string) => string | null;
  editStyle: (input: TattooStyle) => string | null;
  removeStyle: (id: string) => string | null;
  editCategory: (input: Category) => string | null;
  removeCategory: (id: string) => string | null;
  savePlatform: (patch: Partial<PlatformSettings>) => string | null;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeed());
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const stored = loadState();
    if (stored) setState(stored);
    setSession(loadSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const error = saveState(state);
    if (error) {
      setToasts((current) => [...current, { id: uid("toast"), text: error }]);
    }
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    saveSession(session);
  }, [session, ready]);

  useEffect(() => {
    if (!ready || !session) return;
    const block = accountBlock(state, session);
    if (!block) return;
    setSession(null);
    setToasts((current) => [...current, { id: uid("toast"), text: block }]);
  }, [ready, session, state]);

  const api = useMemo<DemoContextValue>(() => {
    const toast = (text: string) => setToasts((current) => [...current, { id: uid("toast"), text }]);
    const actor = (): Actor | null => (session ? { role: session.role, userId: session.userId } : null);
    const now = () => new Date().toISOString();
    const commit = (result: { state: DemoState; error?: string; id?: string }, success?: string) => {
      if (result.error) {
        toast(result.error);
        return result.error;
      }
      setState(result.state);
      if (success) toast(success);
      return null;
    };

    return {
      state,
      session,
      ready,
      toasts,
      toast,
      dismissToast: (id) => setToasts((current) => current.filter((item) => item.id !== id)),
      login: (email, password) => {
        const result = authenticate(email, password);
        if (!result.ok) return result;
        const block = accountBlock(state, result.session);
        if (block) return { ok: false, error: block };
        setSession(result.session);
        return result;
      },
      logout: () => setSession(null),
      switchTo: (role) => {
        const account = accountForRole(role);
        if (!account) return { ok: false, error: "That demo account is missing." };
        const next = { role: account.role, userId: account.userId, email: account.email, name: account.name };
        const block = accountBlock(state, next);
        if (block) return { ok: false, error: block };
        setSession(next);
        return { ok: true, session: next };
      },
      resetDemo: () => {
        const fresh = createSeed();
        setState(fresh);
        toast("Demo data reset to the original sample.");
      },
      updateArtist: (patch) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updateArtistProfile(state, who.userId, patch, who), "Profile saved.");
      },
      addPortfolioItem: (input) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(addPortfolio(state, who.userId, input, who), "Portfolio piece added.");
      },
      editPortfolio: (id, patch) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updatePortfolio(state, id, patch, who), "Portfolio updated.");
      },
      removePortfolio: (id) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(deletePortfolio(state, id, who), "Portfolio piece removed.");
      },
      addArtistService: (input) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(addService(state, who.userId, input, who), "Service added.");
      },
      editService: (id, patch) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updateService(state, id, patch, who), "Service updated.");
      },
      removeService: (id) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(deleteService(state, id, who), "Service removed.");
      },
      toggleDay: (date) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(toggleAvailability(state, who.userId, date, who));
      },
      saveHours: (hours) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updateWorkingHours(state, who.userId, hours, who), "Working hours saved.");
      },
      saveCustomer: (patch) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updateCustomer(state, who.userId, patch, who), "Profile saved.");
      },
      favorite: (artistId) => {
        const who = actor();
        if (!who) return "Sign in as a customer to save artists.";
        return commit(toggleFavorite(state, who.userId, artistId, who));
      },
      openThread: (artistId) => {
        const who = actor();
        if (!who || who.role !== "customer") return { error: "Sign in as a customer to message artists." };
        const opened = ensureConversation(state, who.userId, artistId);
        setState(opened.state);
        return { id: opened.conversationId };
      },
      postMessage: (conversationId, body, attachment) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(sendMessage(state, conversationId, body, attachment, who, now()));
      },
      requestAppointment: (draft) => {
        const who = actor();
        if (!who) return { error: "Sign in as a customer to request an appointment." };
        const result = createBookingRequest(state, draft, who, now());
        if (result.error) return { error: result.error };
        setState(result.state);
        toast("Request sent.");
        return { id: result.id };
      },
      act: (bookingId, action) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(applyBookingAction(state, bookingId, action, who, now()));
      },
      readNotification: (id) => {
        const who = actor();
        if (!who) return;
        setState(markNotificationRead(state, id, who).state);
      },
      readAll: () => {
        const who = actor();
        if (!who) return;
        setState(markAllRead(state, who).state);
      },
      verifyArtist: (artistId, status, note) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(setVerification(state, artistId, status, note, who, now()), "Verification updated.");
      },
      setCustomerAccess: (customerId, status) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(setCustomerStatus(state, customerId, status, who, now()), status === "suspended" ? "Customer suspended." : "Customer reactivated.");
      },
      moderateReview: (reviewId, status) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(setReviewStatus(state, reviewId, status, who), "Review updated.");
      },
      resolveReport: (reportId, status) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(setReportStatus(state, reportId, status, who), "Report updated.");
      },
      featureArtist: (artistId) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(toggleFeatured(state, artistId, who));
      },
      editStyle: (input) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(saveStyle(state, input, who), "Style saved.");
      },
      removeStyle: (id) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(deleteStyle(state, id, who), "Style removed.");
      },
      editCategory: (input) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(saveCategory(state, input, who), "Category saved.");
      },
      removeCategory: (id) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(deleteCategory(state, id, who), "Category removed.");
      },
      savePlatform: (patch) => {
        const who = actor();
        if (!who) return "Sign in again.";
        return commit(updateSettings(state, patch, who), "Settings saved.");
      },
    };
  }, [ready, session, state, toasts]);

  return (
    <DemoContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pointer-events-auto max-w-md bg-ink px-4 py-3 text-left text-sm text-white"
            onClick={() => setToasts((current) => current.filter((toast) => toast.id !== item.id))}
          >
            {item.text}
          </button>
        ))}
      </div>
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}
