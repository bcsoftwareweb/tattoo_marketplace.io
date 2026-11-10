"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@/context/demo-context";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import { homeFor } from "@/lib/permissions";
import { unreadCount } from "@/lib/selectors";
import type { Role } from "@/lib/types";
import { frame } from "@/components/ui";

const PUBLIC_LINKS = [
  ["/artists", "Artists"],
  ["/styles", "Styles"],
  ["/how-it-works", "How it works"],
  ["/for-artists", "For artists"],
];

export function PublicHeader() {
  const { session, state } = useDemo();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const brand = state.settings.platformName || "BLACKLINE";

  return (
    <header className="on-ink sticky top-0 z-40 border-b border-panel bg-ink text-white">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className={`${frame} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="font-display text-sm tracking-[0.22em]">{brand}</Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {PUBLIC_LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm hover:text-mute">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={session ? homeFor(session.role) : "/login"} className="inline-flex h-10 items-center bg-white px-4 text-sm text-ink">
            {session ? "Dashboard" : "Sign in"}
          </Link>
          <button type="button" className="h-10 px-3 text-sm md:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-panel px-5 py-4 md:hidden" aria-label="Mobile">
          <ul className="grid gap-3">
            {PUBLIC_LINKS.map(([href, label]) => (
              <li key={href}><Link href={href} className="block py-1 text-lg">{label}</Link></li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  const { state } = useDemo();
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white">
      <div className={`${frame} grid gap-10 py-14 md:grid-cols-4`}>
        <div>
          <p className="font-display tracking-[0.18em]">{state.settings.platformName}</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-mist">{state.settings.tagline} This prototype stores everything in your browser.</p>
        </div>
        <FooterColumn title="Marketplace" links={[["/artists", "Find artists"], ["/styles", "Styles"], ["/how-it-works", "How it works"]]} />
        <FooterColumn title="Studios" links={[["/for-artists", "For artists"], ["/login", "Demo sign in"]]} />
        <FooterColumn title="About" links={[["/about", "About the demo"], ["/legal/privacy", "Privacy"], ["/legal/terms", "Terms"]]} />
      </div>
      <div className={`${frame} border-t border-panel py-5 text-xs text-mist`}>Simulated bookings and payments. No real money, messages, or accounts.</div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-mist">{title}</p>
      <ul className="mt-4 grid gap-2 text-sm">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="hover:text-mist">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, ready } = useDemo();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else if (session.role !== role) router.replace(homeFor(session.role));
  }, [ready, session, role, router]);
  if (!ready || !session || session.role !== role) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-mist">Checking the demo session…</div>;
  }
  return children;
}

export function DashboardShell({ role, items, children }: { role: Role; items: Array<{ href: string; label: string }>; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="min-h-screen bg-ink text-white md:grid md:grid-cols-[240px_1fr]">
      <aside className="on-ink hidden border-r border-panel bg-ink text-white md:flex md:min-h-screen md:flex-col">
        <SideNav role={role} items={items} pathname={pathname} />
      </aside>
      <div className="min-w-0">
        <TopBar role={role} onMenu={() => setOpen(true)} />
        {open ? (
          <div className="fixed inset-0 z-50 bg-ink text-white md:hidden">
            <div className="flex justify-end p-4">
              <button type="button" onClick={() => setOpen(false)} className="text-sm">Close</button>
            </div>
            <SideNav role={role} items={items} pathname={pathname} />
          </div>
        ) : null}
        <div id="content" className="px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}

function SideNav({ role, items, pathname }: { role: Role; items: Array<{ href: string; label: string }>; pathname: string }) {
  const { state } = useDemo();
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/" className="font-display text-sm tracking-[0.2em]">{state.settings.platformName}</Link>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-mist">{role}</p>
      <nav className="mt-8 grid gap-1" aria-label="Dashboard">
        {items.map((item) => {
          const active = item.href === `/${role}` ? pathname === item.href || pathname === `${item.href}/` : pathname === item.href || pathname.startsWith(`${item.href}`);
          return (
            <Link key={item.href} href={item.href} className={active ? "bg-white px-3 py-2 text-sm text-ink" : "px-3 py-2 text-sm text-mist hover:text-white"}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TopBar({ role, onMenu }: { role: Role; onMenu: () => void }) {
  const { session, state, logout, switchTo, resetDemo, readNotification, toast } = useDemo();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  if (!session) return null;
  const notes = state.notifications.filter((item) => item.userId === session.userId).slice(0, 5);
  const unread = unreadCount(state, session.userId);

  return (
    <div className="flex h-16 items-center justify-between border-b border-panel bg-ink px-4 text-white md:px-8">
      <button type="button" className="text-sm md:hidden" onClick={onMenu}>Menu</button>
      <p className="hidden text-sm text-mist md:block">Demo session · {session.email}</p>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button type="button" className="h-10 border border-detail px-3 text-sm" aria-expanded={notesOpen} onClick={() => { setNotesOpen((value) => !value); setAccountOpen(false); }}>
            Alerts{unread ? ` ${unread}` : ""}
          </button>
          {notesOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-80 border border-line bg-white p-3 shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Notifications</p>
                <Link href={`/${role}/notifications`} className="text-xs text-mute" onClick={() => setNotesOpen(false)}>View all</Link>
              </div>
              <ul className="mt-3 grid gap-2">
                {notes.length ? notes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={note.href}
                      className="block border border-line px-3 py-2 text-sm hover:bg-paper"
                      onClick={() => { readNotification(note.id); setNotesOpen(false); }}
                    >
                      <span className="block font-medium">{note.title}</span>
                      <span className="mt-1 block text-xs text-mute">{note.body}</span>
                    </Link>
                  </li>
                )) : <li className="text-sm text-mute">No notifications yet.</li>}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button type="button" className="h-10 bg-white px-3 text-sm text-ink" aria-expanded={accountOpen} onClick={() => { setAccountOpen((value) => !value); setNotesOpen(false); }}>
            {session.name}
          </button>
          {accountOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-64 border border-line bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-mute">Switch demo account</p>
              <div className="mt-2 grid gap-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    className="px-2 py-2 text-left text-sm hover:bg-paper"
                    onClick={() => {
                      const result = switchTo(account.role);
                      setAccountOpen(false);
                      if (result.ok) router.push(homeFor(account.role));
                      else toast(result.error);
                    }}
                  >
                    {account.blurb}
                  </button>
                ))}
              </div>
              <button type="button" className="mt-2 w-full border border-line px-2 py-2 text-left text-sm" onClick={() => { resetDemo(); setAccountOpen(false); }}>Reset demo data</button>
              <button type="button" className="mt-1 w-full px-2 py-2 text-left text-sm" onClick={() => { logout(); router.push("/"); }}>Log out</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
