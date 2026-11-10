"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/format";
import type { BookingStatus, Role } from "@/lib/types";
import { statusLabel } from "@/lib/status";

export const frame = "mx-auto w-full max-w-[1440px] px-5 md:px-8";

const buttonStyles = {
  primary: "bg-ink text-white ring-1 ring-white hover:bg-panel",
  secondary: "border border-line bg-white text-ink hover:border-ink",
  ghost: "text-current hover:bg-paper hover:text-ink",
  inverse: "bg-white text-ink hover:bg-mist",
};

export function Button({
  variant = "primary",
  href,
  className,
  children,
  ...props
}: {
  variant?: keyof typeof buttonStyles;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classNames = cn(
    "inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40",
    buttonStyles[variant],
    className,
  );
  if (href) return <Link href={href} className={classNames}>{children}</Link>;
  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-mute">{hint}</span> : null}
      {error ? <span className="mt-2 block text-xs text-ink">{error}</span> : null}
    </label>
  );
}

const control = "h-11 w-full border border-line bg-white px-3 text-sm outline-none transition-colors focus:border-ink";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-28 w-full border border-line bg-white px-3 py-3 text-sm outline-none focus:border-ink", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(control, props.className)} />;
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="font-medium">{value.toFixed(1)}</span>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((mark) => (
          <span key={mark} className={cn("h-1.5 w-3", mark <= Math.round(value) ? "bg-current" : "bg-detail")} />
        ))}
      </span>
      {count != null ? <span className="text-mute">{count}</span> : null}
    </span>
  );
}

export function StatusPill({ status, role }: { status: BookingStatus; role?: Role }) {
  const solid = status === "confirmed" || status === "completed";
  return (
    <span className={cn("inline-flex h-7 items-center px-2 text-xs tracking-wide", solid ? "bg-ink text-white" : "border border-detail bg-paper text-ink")}>
      {statusLabel(status, role)}
    </span>
  );
}

export function Photo({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div role="img" aria-label={alt} className={cn("bg-panel", className)} />;
  return <img src={src} alt={alt} className={cn("object-cover", className)} onError={() => setFailed(true)} />;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-white px-6 py-12 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mute">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-mute">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-mute">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function StatGrid({ items }: { items: Array<{ label: string; value: string; note?: string }> }) {
  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="-mt-px -ml-px border border-line bg-white px-4 py-5">
          <dt className="text-xs uppercase tracking-[0.16em] text-mute">{item.label}</dt>
          <dd className="mt-3 font-display text-3xl tracking-tight">{item.value}</dd>
          {item.note ? <p className="mt-2 text-xs leading-5 text-mute">{item.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: Array<{ id: string; label: string }>; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" aria-label="Sections" className="flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn("h-11 shrink-0 text-sm", value === tab.id ? "border-b-2 border-ink font-medium" : "text-mute")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/50 px-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-mute">Close</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function useFieldId(prefix: string) {
  const id = useId();
  return `${prefix}-${id}`;
}
