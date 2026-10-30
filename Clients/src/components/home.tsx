"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
} from "lucide-react";
import { get, heroImage, money } from "@/lib/api";
import type { Agent, PageResult, Post } from "@/lib/types";
import { ArrowLink, ErrorState, Loading, Reveal } from "./ui";
import { ListingCard } from "./listing-card";
import { Select } from "./select";

export function Home() {
  const router = useRouter();
  const [type, setType] = useState("SALE");
  const [carousel, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const properties = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: () => get<PageResult>("/properties", { type: "SALE", limit: 3 }),
  });
  const agents = useQuery({
    queryKey: ["agents"],
    queryFn: () => get<Agent[]>("/agents"),
  });
  const journal = useQuery({
    queryKey: ["journal"],
    queryFn: () => get<Post[]>("/journal"),
  });
  const market = useQuery({
    queryKey: ["market"],
    queryFn: () =>
      get<{
        medianPrice: number;
        daysOnMarket: number;
        newThisWeek: number;
        active: number;
      }>("/market"),
  });
  return (
    <>
      <section className="hero">
        <div className="hero-photo">
          <Image
            src={heroImage}
            alt="A sculptural modern residence opening onto a sunlit pool and garden"
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            quality={60}
          />
        </div>
        <div className="hero-shade" />
        <div className="hero-content container">
          <div>
            <p className="eyebrow hero-eyebrow">
              <span />
              EXCEPTIONAL HOMES. HUMAN CONNECTION.
            </p>
            <h1>
              A place to call
              <br />
              <em>your own.</em>
            </h1>
            <p className="hero-description">
              Extraordinary spaces. A more personal approach.
              <br />
              Find the home that feels like you.
            </p>
            <div className="hero-ctas">
              <Link className="button button-paper" href="/search">
                Discover your next home
                <ArrowUpRight size={19} />
              </Link>
              <Link className="hero-secondary" href="/agents">
                Let’s find it together
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="hero-bottom">
            <a href="#discover" className="scroll-hint">
              <ArrowDown size={17} />
              <span>A little further. A little closer to home.</span>
            </a>
            <span className="hero-location">
              <MapPin size={16} />
              THE CALIFORNIA COLLECTION
            </span>
          </div>
        </div>
      </section>
      <div id="discover" className="home-search-wrap container">
        <form
          className="home-search"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const params = new URLSearchParams({ type });
            for (const [key, value] of data)
              if (value) params.set(key, String(value));
            router.push(`${type === "RENT" ? "/rent" : "/search"}?${params}`);
          }}
        >
          <div className="search-purpose">
            <button
              type="button"
              aria-pressed={type === "SALE"}
              className={type === "SALE" ? "selected" : ""}
              onClick={() => setType("SALE")}
            >
              Buy
            </button>
            <button
              type="button"
              aria-pressed={type === "RENT"}
              className={type === "RENT" ? "selected" : ""}
              onClick={() => setType("RENT")}
            >
              Rent
            </button>
          </div>
          <label className="search-location">
            <span>WHERE LIFE TAKES YOU</span>
            <div>
              <MapPin size={18} />
              <input
                name="q"
                placeholder="City, neighborhood, or address"
                list="places"
                aria-label="City, neighborhood, or address"
              />
              <datalist id="places">
                <option value="San Francisco" />
                <option value="Sausalito" />
                <option value="Tiburon" />
                <option value="Mill Valley" />
              </datalist>
            </div>
          </label>
          <div className="home-search-field">
            <span>PRICE RANGE</span>
            <Select
              name="maxPrice"
              label="Maximum price"
              key={type}
              options={[
                { value: "", label: "Any price" },
                ...(type === "SALE"
                  ? [2000000, 3000000, 5000000, 8000000]
                  : [8000, 10000, 15000]
                ).map((n) => ({
                  value: String(n),
                  label: `Up to ${money(n, true)}`,
                })),
              ]}
            />
          </div>
          <div className="home-search-field">
            <span>BEDROOMS</span>
            <Select
              name="beds"
              label="Minimum bedrooms"
              options={[
                { value: "", label: "Any beds" },
                ...[1, 2, 3, 4, 5].map((n) => ({
                  value: String(n),
                  label: `${n}+ bedrooms`,
                })),
              ]}
            />
          </div>
          <button className="button search-submit" type="submit">
            <Search size={19} />
            <span>Find a home</span>
          </button>
        </form>
      </div>
      <section className="section container featured-section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">A FEW PLACES TO FALL FOR</p>
            <h2>
              Remarkable homes.
              <br />
              <em>Real possibilities.</em>
            </h2>
          </div>
          <div className="section-heading-aside">
            <p>
              Thoughtfully selected. Beautifully lived.
              <br />
              Your next chapter could start here.
            </p>
            <ArrowLink href="/search">Explore all homes</ArrowLink>
          </div>
        </Reveal>
        {properties.isLoading ? (
          <Loading />
        ) : properties.isError ? (
          <ErrorState retry={() => properties.refetch()} />
        ) : (
          <div className="grid-three">
            {properties.data?.items.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ListingCard property={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
      <section className="collections-section section">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <p className="eyebrow">CURATED WITH A POINT OF VIEW</p>
              <h2>
                Find your kind of <em>extraordinary.</em>
              </h2>
            </div>
            <div className="carousel-controls">
              <button
                className="round-button"
                aria-label="Previous collection"
                onClick={() => embla?.scrollPrev()}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                className="round-button"
                aria-label="Next collection"
                onClick={() => embla?.scrollNext()}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </Reveal>
          <div className="collection-viewport" ref={carousel}>
            <div className="collection-track">
              {[
                {
                  name: "The coastal edit",
                  sub: "A little closer to the water.",
                  image: "residence-2",
                  href: "/search?amenities=Ocean+view",
                  count: "OCEAN AIR. OPEN POSSIBILITIES.",
                },
                {
                  name: "Modern by nature",
                  sub: "Clean lines. A fresh perspective.",
                  image: "residence-1",
                  href: "/search?propertyType=HOUSE",
                  count: "ARCHITECTURE WITH INTENTION.",
                },
                {
                  name: "Room to unwind",
                  sub: "A softer pace of life.",
                  image: "interior-3",
                  href: "/search?amenities=Garden",
                  count: "YOUR OWN QUIET CORNER.",
                },
              ].map((c) => (
                <Link className="collection-card" href={c.href} key={c.name}>
                  <Image
                    src={`/images/${c.image}.jpg`}
                    alt={c.name}
                    fill
                    sizes="(max-width: 700px) 86vw, 45vw"
                  />
                  <div className="collection-overlay" />
                  <div className="collection-card-content">
                    <p className="eyebrow">{c.count}</p>
                    <h3>{c.name}</h3>
                    <div>
                      <p>{c.sub}</p>
                      <span className="round-button">
                        <ArrowUpRight size={22} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <p className="collection-footnote">
            A collection of homes. A reflection of you.
          </p>
        </div>
      </section>
      <section className="market-section container">
        <Reveal className="market-heading">
          <p className="eyebrow">A LITTLE LOCAL PERSPECTIVE</p>
          <h2>
            The market,
            <br />
            <em>at a glance.</em>
          </h2>
          <p>
            Our Bay Area sale collection.
            <br />A snapshot, refreshed as homes arrive.
          </p>
          <span className="live-label">
            <span />
            LIVE FROM OUR LISTINGS
          </span>
        </Reveal>
        <div className="market-cards">
          {market.isError ? (
            <ErrorState retry={() => market.refetch()} />
          ) : market.isLoading ? (
            <Loading label="Reading the market…" />
          ) : (
            [
              {
                title: "Median asking price",
                value: money(market.data?.medianPrice ?? 0, true),
                detail: `${market.data?.active ?? 0} active sale listings`,
                path: "M0 45 L22 38 L40 43 L62 22 L80 28 L100 12 L122 19 L148 5",
              },
              {
                title: "Average days listed",
                value: `${market.data?.daysOnMarket ?? 0}`,
                detail: "Time to find your perfect fit",
                path: "M0 8 L24 18 L42 13 L66 26 L85 20 L106 38 L126 32 L148 46",
              },
              {
                title: "New this week",
                value: `${market.data?.newThisWeek ?? 0}`.padStart(2, "0"),
                detail: "Fresh spaces. New possibilities.",
                path: "M0 42 L20 44 L42 29 L60 36 L80 19 L100 25 L123 10 L148 4",
              },
            ].map((m) => (
              <Reveal className="market-card" key={m.title}>
                <p>{m.title}</p>
                <div className="metric-value">
                  {m.value}
                  <svg
                    width="100"
                    height="42"
                    viewBox="0 0 150 50"
                    aria-hidden="true"
                  >
                    <path
                      d={m.path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <span>{m.detail}</span>
              </Reveal>
            ))
          )}
        </div>
      </section>
      <section className="section neighborhood-section container">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">LOVE THE HOME. KNOW THE NEIGHBORHOOD.</p>
            <h2>
              It’s more than an address.
              <br />
              <em>It’s a way of life.</em>
            </h2>
          </div>
          <p className="section-heading-aside">
            The local coffee. The Sunday walk.
            <br />
            The feeling that you belong.
          </p>
        </Reveal>
        <div className="grid-three">
          {[
            {
              name: "Pacific Heights",
              sub: "Timeless charm. Elevated living.",
              image: "neighborhood-1",
              href: "/neighborhoods/pacific-heights",
              tag: "HISTORIC & REFINED",
            },
            {
              name: "Sea Cliff",
              sub: "Where the city meets the sea.",
              image: "neighborhood-2",
              href: "/neighborhoods/sea-cliff",
              tag: "COASTAL & PEACEFUL",
            },
            {
              name: "Mill Valley",
              sub: "Room to breathe. Space to grow.",
              image: "neighborhood-3",
              href: "/search?q=Mill+Valley",
              tag: "NATURALLY CONNECTED",
            },
          ].map((n, i) => (
            <Reveal key={n.name} delay={i * 0.08}>
              <Link className="neighborhood-card" href={n.href}>
                <div className="neighborhood-image">
                  <Image
                    src={`/images/${n.image}.jpg`}
                    alt={
                      n.name === "Pacific Heights"
                        ? "San Francisco neighborhood and the Golden Gate Bridge"
                        : n.name === "Sea Cliff"
                          ? "Pacific Ocean waves on the California coastline"
                          : "Sunlight falling through a redwood forest"
                    }
                    fill
                    sizes="(max-width: 700px) 100vw, 33vw"
                  />
                  <span className="listing-badge">{n.tag}</span>
                </div>
                <div>
                  <h3>{n.name}</h3>
                  <ArrowUpRight size={22} />
                </div>
                <p>{n.sub}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="agent-home-section">
        <div className="container">
          <Reveal className="agent-home-intro">
            <p className="eyebrow">GOOD HOMES START WITH GOOD PEOPLE</p>
            <h2>
              Expertise is a given.
              <br />
              <em>Connection is everything.</em>
            </h2>
            <p>
              Local knowledge, a thoughtful eye, and the belief that
              <br className="desktop-only" /> finding a home should feel as good
              as arriving in one.
            </p>
            <ArrowLink href="/agents" light>
              Meet your people
            </ArrowLink>
          </Reveal>
          <div className="agent-home-grid">
            {agents.data
              ?.filter((a) => a.id !== "demo-admin")
              .slice(0, 3)
              .map((a) => (
                <Link
                  href={`/agents/${a.id}`}
                  className="agent-mini"
                  key={a.id}
                >
                  <div className="agent-portrait">
                    <Image
                      src={a.avatarUrl || "/images/agent-1.jpg"}
                      alt={a.name}
                      fill
                      sizes="180px"
                    />
                  </div>
                  <h3>{a.name}</h3>
                  <p>Bay Area property advisor</p>
                  <span>
                    <span className="status-dot" />
                    Here when you need us
                    <ArrowUpRight size={15} />
                  </span>
                </Link>
              ))}
          </div>
          {agents.isError && <ErrorState retry={() => agents.refetch()} />}
        </div>
      </section>
      <section className="section container">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">THE HAVEN JOURNAL</p>
            <h2>
              Stories for <em>a life well lived.</em>
            </h2>
          </div>
          <ArrowLink href="/journal">A little inspiration</ArrowLink>
        </Reveal>
        {journal.isLoading ? (
          <Loading label="Opening the journal…" />
        ) : journal.isError ? (
          <ErrorState retry={() => journal.refetch()} />
        ) : (
          <div className="grid-three">
            {journal.data?.slice(0, 3).map((p) => (
              <JournalCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
      <section className="closing-section">
        <div className="container">
          <p className="eyebrow">EVERY GREAT CHAPTER STARTS SOMEWHERE</p>
          <h2>
            Let’s find <em>your somewhere.</em>
          </h2>
          <div>
            <Link className="button" href="/search">
              Find your home
              <ArrowUpRight size={19} />
            </Link>
            <Link className="button button-outline" href="/sell">
              Discover your home’s value
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
export function JournalCard({ post: p }: { post: Post }) {
  return (
    <Reveal>
      <Link href={`/journal/${p.slug}`} className="journal-card">
        <div className="journal-image">
          <Image
            src={p.coverImage}
            alt={p.title}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
          />
        </div>
        <p className="eyebrow">
          {p.body.split("\n")[0].toUpperCase()}
          <span>5 MIN READ</span>
        </p>
        <div>
          <h3>{p.title}</h3>
          <ArrowUpRight size={22} />
        </div>
        <p>{p.excerpt}</p>
      </Link>
    </Reveal>
  );
}
