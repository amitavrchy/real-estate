"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Command,
  Heart,
  Menu,
  Search,
} from "lucide-react";
import { api, errorMessage, get } from "@/lib/api";
import type { Agent, PageResult } from "@/lib/types";
import {
  notify,
  setCommand,
  setMenu,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import { Modal } from "./ui";

const links = [
  { href: "/search", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/sell", label: "Sell" },
  { href: "/agents", label: "Our people" },
  { href: "/journal", label: "Journal" },
];
export function Header() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const menu = useAppSelector((s) => s.ui.menu);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 32);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  const home = pathname === "/";
  return (
    <header
      className={`header ${home && !scrolled ? "header-transparent" : ""}`}
    >
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Haven home">
          HAVEN<span>®</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="header-search"
            aria-label="Search Haven"
            onClick={() => dispatch(setCommand(true))}
          >
            <Search size={19} />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <Link
            className="header-heart icon-button"
            href={user ? "/account" : "/login"}
            aria-label="Saved homes"
          >
            <Heart size={20} />
          </Link>
          <Link className="signin-link" href={user ? "/account" : "/login"}>
            {user ? user.name.split(" ")[0] : "Sign in"}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => dispatch(setMenu(true))}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
      <Modal
        open={menu}
        onClose={() => dispatch(setMenu(false))}
        title="Explore Haven"
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[
            ...links,
            { href: "/collections", label: "Your collections" },
            {
              href: user ? "/account" : "/login",
              label: user ? "Your account" : "Sign in",
            },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => dispatch(setMenu(false))}
            >
              {l.label}
              <ArrowUpRight size={21} />
            </Link>
          ))}
        </nav>
      </Modal>
    </header>
  );
}
export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  if (
    pathname === "/search" ||
    pathname === "/rent" ||
    pathname.startsWith("/dashboard")
  )
    return null;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark">
              HAVEN<span>®</span>
            </Link>
            <p>A place to call your own.</p>
          </div>
          <div className="footer-news">
            <label htmlFor="newsletter">Good things. In your inbox.</label>
            <p>New homes, considered spaces, and local stories.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api.post("/newsletter", { email });
                  setSubscribed(true);
                  dispatch(notify("You’re on the list. Welcome to Haven."));
                } catch (error) {
                  dispatch(notify(errorMessage(error)));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input
                id="newsletter"
                type="email"
                placeholder="Your email address"
                aria-label="Your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribed}
              />
              <button
                aria-label="Subscribe to newsletter"
                disabled={busy || subscribed}
              >
                {subscribed ? <Check size={22} /> : <ArrowRight size={22} />}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-links">
          <div>
            <span>FIND YOUR PLACE</span>
            <Link href="/search">Homes for sale</Link>
            <Link href="/rent">Homes for rent</Link>
            <Link href="/search?exclusive=true">Private exclusives</Link>
            <Link href="/collections">Your collections</Link>
          </div>
          <div>
            <span>THE HAVEN WAY</span>
            <Link href="/sell">Sell with Haven</Link>
            <Link href="/valuation">Discover your home’s value</Link>
            <Link href="/agents">Meet our people</Link>
            <Link href="/journal">The journal</Link>
          </div>
          <div>
            <span>OUR NEIGHBORHOODS</span>
            <Link href="/neighborhoods/pacific-heights">Pacific Heights</Link>
            <Link href="/neighborhoods/sea-cliff">Sea Cliff</Link>
            <Link href="/search?q=Sausalito">Sausalito</Link>
            <Link href="/search?q=Mill+Valley">Mill Valley</Link>
          </div>
          <div>
            <span>LET’S CONNECT</span>
            <a href="mailto:hello@haven.example">
              hello@haven.example
              <ArrowUpRight size={14} />
            </a>
            <a href="tel:+14155550142">+1 (415) 555-0142</a>
            <p>
              San Francisco Bay Area
              <br />
              California, with love.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Haven. All rights reserved.</p>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <span>Equal Housing Opportunity</span>
          </div>
        </div>
        <p className="demo-disclosure">
          An independent demo marketplace. Listings, agents, addresses, and
          market data are illustrative. Photography: Unsplash.
        </p>
      </div>
    </footer>
  );
}
export function CommandPalette() {
  const open = useAppSelector((s) => s.ui.command);
  const dispatch = useAppDispatch();
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(term), 250);
    return () => clearTimeout(timer);
  }, [term]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dispatch(setCommand(!open));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch, open]);
  const homes = useQuery({
    queryKey: ["properties", "command", query],
    queryFn: () => get<PageResult>("/properties", { q: query, limit: 4 }),
    enabled: open,
  });
  const agents = useQuery({
    queryKey: ["agents"],
    queryFn: () => get<Agent[]>("/agents"),
    enabled: open,
  });
  const close = () => dispatch(setCommand(false));
  return (
    <Modal open={open} onClose={close} title="Find your place">
      <div className="command-input">
        <Search size={22} />
        <input
          placeholder="A home, a neighborhood, a person…"
          aria-label="Search homes and people"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <div className="command-results">
        <p className="eyebrow">RESIDENCES</p>
        {homes.isLoading ? (
          <p>Searching…</p>
        ) : homes.isError ? (
          <p>Search is unavailable right now. Please try again.</p>
        ) : !homes.data?.items.length ? (
          <p>No homes found. Try a neighborhood or city.</p>
        ) : (
          homes.data.items.map((p) => (
            <Link key={p.id} href={`/property/${p.slug}`} onClick={close}>
              <Image
                src={p.media[0]?.url || "/images/hero.jpg"}
                alt=""
                width={64}
                height={48}
              />
              <span>
                {p.title}
                <small>{p.city}</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))
        )}
        <p className="eyebrow">NEIGHBORHOODS</p>
        {["Pacific Heights", "Sea Cliff"]
          .filter((n) => n.toLowerCase().includes(term.toLowerCase()))
          .map((n) => (
            <Link
              key={n}
              href={`/neighborhoods/${n.toLowerCase().replaceAll(" ", "-")}`}
              onClick={close}
            >
              {n}
              <ArrowUpRight size={18} />
            </Link>
          ))}
        <p className="eyebrow">OUR PEOPLE</p>
        {agents.data
          ?.filter((a) => a.name.toLowerCase().includes(term.toLowerCase()))
          .map((a) => (
            <Link key={a.id} href={`/agents/${a.id}`} onClick={close}>
              {a.name}
              <ArrowUpRight size={18} />
            </Link>
          ))}
      </div>
      <div className="command-footer">
        <Command size={14} />
        <span>K to open</span>
        <span>esc to close</span>
      </div>
    </Modal>
  );
}
