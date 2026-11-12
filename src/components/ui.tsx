"use client";

import Link from "next/link";
import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function optionLabel(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionLabel).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return optionLabel(node.props.children);
  return "";
}

function readOptions(children: React.ReactNode) {
  const options: Array<{ value: string; label: string }> = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: React.ReactNode }>(child) || child.type !== "option") return;
    const label = optionLabel(child.props.children);
    options.push({ value: child.props.value !== undefined ? String(child.props.value) : label, label });
  });
  return options;
}

export function SelectInput({
  value,
  onChange,
  children,
  className,
  id,
  required,
  disabled,
  "aria-label": ariaLabel,
}: {
  value?: string | number | readonly string[];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const options = readOptions(children);
  const current = value == null ? "" : String(value);
  const selected = options.find((option) => option.value === current);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const dark = className?.includes("bg-ink") ?? false;

  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.max(rect.width, 180);
      const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8));
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      setBox({
        top: rect.bottom + 4,
        left,
        width: Math.max(rect.width, Math.min(width, window.innerWidth - left - 8)),
        maxHeight: Math.min(320, Math.max(spaceBelow, 96)),
      });
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    place();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  function choose(next: string) {
    setOpen(false);
    onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
  }

  const menu = open && box ? (
    <ul
      ref={menuRef}
      id={listId}
      role="listbox"
      style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
      className={cn("fixed z-[80] overflow-y-auto border py-1", dark ? "border-detail bg-ink text-white" : "border-line bg-white text-ink")}
    >
      {options.map((option, index) => {
        const active = option.value === current;
        return (
          <li key={`${index}-${option.value}`}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => choose(option.value)}
              className={cn("block w-full px-3 py-2 text-left text-sm", active ? (dark ? "bg-white text-ink" : "bg-ink text-white") : dark ? "hover:bg-panel" : "hover:bg-paper")}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative", className?.includes("w-auto") ? "w-auto" : "w-full")}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className={cn("inline-flex h-11 items-center justify-between gap-3 text-left text-sm outline-none", className?.includes("w-auto") ? "w-auto" : "w-full", className ?? `${control}`)}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <span aria-hidden="true" className="h-0 w-0 shrink-0 border-x-4 border-t-[5px] border-x-transparent border-t-current" />
      </button>
      {menu && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
      {required ? <input tabIndex={-1} aria-hidden="true" className="sr-only" value={current} required onChange={() => undefined} /> : null}
    </div>
  );
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

export function Photo({ src, alt, className, loading = "lazy" }: { src?: string; alt: string; className?: string; loading?: "lazy" | "eager" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div role="img" aria-label={alt} className={cn("bg-panel", className)} />;
  return <img src={src} alt={alt} loading={loading} decoding="async" className={cn("object-cover", className)} onError={() => setFailed(true)} />;
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
          <dd className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">{item.value}</dd>
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
