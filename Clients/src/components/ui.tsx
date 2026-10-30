"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/link";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Check, LoaderCircle, X } from "lucide-react";
import { notify, useAppDispatch, useAppSelector } from "@/store";

export function ArrowLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link className={`arrow-link ${light ? "light" : ""}`} href={href}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
export function Loading({
  label = "Finding something exceptional…",
}: {
  label?: string;
}) {
  return (
    <div className="state-panel" role="status">
      <LoaderCircle className="spin" size={28} />
      <p>{label}</p>
    </div>
  );
}
export function Empty({
  title,
  text,
  href,
  action = "Explore homes",
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="state-panel">
      <span className="empty-mark">H.</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {href && <ArrowLink href={href}>{action}</ArrowLink>}
    </div>
  );
}
export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="state-panel" role="alert">
      <h2>A little interruption.</h2>
      <p>
        We couldn’t load this just now. Please check your connection and try
        again.
      </p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () =>
        dialog.current
          ?.querySelector<HTMLElement>(
            'button, input, select, textarea, a[href], [tabindex="0"]',
          )
          ?.focus(),
      30,
    );
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const elements = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, a[href], [tabindex="0"]',
          ) ?? [],
        ).filter(
          (el) => !el.hasAttribute("disabled") && el.getClientRects().length,
        );
        const first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [open]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`modal ${wide ? "modal-wide" : ""} ${className}`}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>{title}</h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={onClose}
              >
                <X size={22} />
              </button>
            </div>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
export function Toast() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((s) => s.ui.toast);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => dispatch(notify("")), 4500);
    return () => clearTimeout(timeout);
  }, [toast, dispatch]);
  return (
    <div className="toast-container" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <m.div
            key={toast}
            className="toast"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <Check size={18} />
            <span>{toast}</span>
            <button
              onClick={() => dispatch(notify(""))}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export function Protected({
  children,
  agent = false,
}: {
  children: React.ReactNode;
  agent?: boolean;
}) {
  const { user, ready } = useAppSelector((s) => s.auth);
  if (!ready) return <Loading label="Opening your space…" />;
  if (!user)
    return (
      <Empty
        title="A space of your own."
        text="Sign in to save the homes you love and keep your next chapter together."
        href="/login"
        action="Sign in to Haven"
      />
    );
  if (agent && user.role === "BUYER")
    return (
      <Empty
        title="For our property advisors."
        text="This workspace is available to Haven agents and administrators."
        href="/account"
        action="Back to your account"
      />
    );
  return children;
}
