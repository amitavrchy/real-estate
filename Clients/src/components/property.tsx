"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  FolderPlus,
  Images,
  MapPin,
  Phone,
  Scan,
  Share2,
} from "lucide-react";
import { api, errorMessage, get, money, number } from "@/lib/api";
import type { Collection, PageResult, Property } from "@/lib/types";
import { notify, useAppDispatch, useAppSelector } from "@/store";
import { ArrowLink, Empty, ErrorState, Loading, Modal, Reveal } from "./ui";
import { FavoriteButton, ListingCard } from "./listing-card";

const MapPane = dynamic(() => import("./map-pane"), {
  ssr: false,
  loading: () => <Loading label="Exploring the neighborhood…" />,
});
const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z.string().max(30).optional(),
  message: z
    .string()
    .trim()
    .min(
      10,
      "A few more words will help us understand what you’re looking for.",
    )
    .max(5000),
});
type InquiryValues = z.infer<typeof inquirySchema>;
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InquiryForm({
  property,
  schedule = false,
}: {
  property: Property;
  schedule?: boolean;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: "",
      message: schedule
        ? `I would love to arrange a private viewing of ${property.title}.`
        : `I’m interested in ${property.title} and would love to know more.`,
    },
  });
  if (!['ACTIVE','PENDING'].includes(property.status)) return <Empty title="This home has found its next chapter." text="Your advisor can help you discover another residence with the same good feeling." href={property.listingType === 'RENT' ? '/rent' : '/search'} />;
  if (success)
    return (
      <div className="form-success" role="status">
        <Check size={26} />
        <h3>
          {schedule
            ? "A little closer to the front door."
            : "A conversation starts here."}
        </h3>
        <p>
          {schedule
            ? "Your viewing request has been sent. Your advisor will confirm availability and the time with you directly."
            : `${property.agent.name.split(" ")[0]} has your message. Your next chapter is in good hands.`}
        </p>
      </div>
    );
  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        if (schedule && (!date || date < today())) {
          setError("Please choose today or a future date.");
          return;
        }
        try {
          await api.post("/inquiries", {
            ...values,
            propertyId: property.id,
            message: schedule
              ? `${values.message}\n\nRequested private viewing: ${date} at ${time} (America/Los_Angeles). Subject to agent confirmation.`
              : values.message,
          });
          setSuccess(true);
        } catch (e) {
          setError(errorMessage(e));
        }
      })}
    >
      {schedule && (
        <div className="form-grid">
          <label>
            Preferred day
            <input
              type="date"
              min={today()}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Preferred time
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {[
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="form-grid">
        <label>
          Your name
          <input
            autoComplete="name"
            {...form.register("name")}
            aria-invalid={!!form.formState.errors.name}
          />
          {form.formState.errors.name && (
            <span className="form-error">
              {form.formState.errors.name.message}
            </span>
          )}
        </label>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            {...form.register("email")}
            aria-invalid={!!form.formState.errors.email}
          />
          {form.formState.errors.email && (
            <span className="form-error">
              {form.formState.errors.email.message}
            </span>
          )}
        </label>
      </div>
      <label>
        Phone <span className="form-note">(optional)</span>
        <input autoComplete="tel" type="tel" {...form.register("phone")} />
      </label>
      <label>
        A little about what you’re looking for
        <textarea
          {...form.register("message")}
          aria-invalid={!!form.formState.errors.message}
        />
        {form.formState.errors.message && (
          <span className="form-error">
            {form.formState.errors.message.message}
          </span>
        )}
      </label>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "Sending your message…"
          : schedule
            ? "Request a private viewing"
            : "Start the conversation"}
        <ArrowUpRight size={18} />
      </button>
      <p className="form-note">
        {schedule
          ? "Times are in Pacific Time. This is a request; your advisor will confirm."
          : "Your details are shared only with the listing advisor."}{" "}
        By sending, you agree to our{" "}
        <Link href="/privacy" className="text-link">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
function Gallery({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [selected, setSelected] = useState(0);
  const [ref, embla] = useEmblaCarousel({ loop: true });
  const images = property.media.filter((m) => m.kind === "image");
  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") embla?.scrollNext();
      if (e.key === "ArrowLeft") embla?.scrollPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, embla]);
  useEffect(() => {
    if (open && embla) embla.scrollTo(startAt, true);
  }, [open, embla, startAt]);
  const launch = (i: number) => {
    setStartAt(i);
    setSelected(i);
    setOpen(true);
  };
  return (
    <>
      <div className="property-gallery">
        {images.length ? (
          images.slice(0, 3).map((m, i) => (
            <button
              key={m.id}
              className={`gallery-tile gallery-tile-${i}`}
              onClick={() => launch(i)}
              aria-label={`Open photo ${i + 1}: ${m.alt}`}
            >
              <Image
                src={m.url}
                alt={m.alt}
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                sizes={i === 0 ? "(max-width: 760px) 100vw, 67vw" : "33vw"}
              />
            </button>
          ))
        ) : (
          <div className="gallery-tile gallery-tile-0">
            <Image
              src="/images/hero.jpg"
              alt="Residence photography coming soon"
              fill
              sizes="100vw"
            />
          </div>
        )}
        <button className="gallery-view-all" onClick={() => launch(0)}>
          <Images size={17} />
          View all {images.length} photos
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${property.title} · ${selected + 1} / ${images.length}`}
        wide
        className="gallery-modal"
      >
        <div className="lightbox-viewport" ref={ref}>
          <div className="lightbox-track">
            {images.map((m) => (
              <div className="lightbox-slide" key={m.id}>
                <Image src={m.url} alt={m.alt} fill sizes="90vw" />
              </div>
            ))}
          </div>
        </div>
        <div className="gallery-navigation">
          <button
            className="round-button"
            aria-label="Previous photo"
            onClick={() => embla?.scrollPrev()}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="gallery-thumbs">
            {images.map((m, i) => (
              <button
                key={m.id}
                className={selected === i ? "selected" : ""}
                onClick={() => embla?.scrollTo(i)}
                aria-label={`View photo ${i + 1}`}
              >
                <Image src={m.url} alt="" width={66} height={46} />
              </button>
            ))}
          </div>
          <button
            className="round-button"
            aria-label="Next photo"
            onClick={() => embla?.scrollNext()}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </Modal>
    </>
  );
}
export function MortgageCalculator({ price }: { price: string }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const principal = Number(price) * (1 - down / 100);
  const r = rate / 1200;
  const n = years * 12;
  const payment = r
    ? (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : principal / n;
  const tax = (Number(price) * 0.012) / 12;
  const insurance = 200;
  const total = payment + tax + insurance;
  return (
    <div className="mortgage">
      <div>
        <p className="eyebrow">ROOM IN YOUR PLANS</p>
        <h2>
          Make the numbers
          <br />
          <em>feel at home.</em>
        </h2>
        <p className="form-note">
          Explore an illustrative monthly estimate. Adjust it to your plans.
        </p>
        <div className="mortgage-inputs">
          <label>
            Down payment ({down}%)
            <input
              type="range"
              aria-label="Down payment percentage"
              min="0"
              max="100"
              step="5"
              value={down}
              onChange={(e) => setDown(Number(e.target.value))}
            />
            <span className="form-note">
              {money((Number(price) * down) / 100)}
            </span>
          </label>
          <div className="form-grid">
            <label>
              Interest rate (%)
              <input
                type="number"
                aria-label="Interest rate"
                min="0"
                max="25"
                step=".1"
                value={rate}
                onChange={(e) =>
                  setRate(Math.min(25, Math.max(0, Number(e.target.value))))
                }
              />
            </label>
            <label>
              Loan term
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              >
                <option value="30">30 years</option>
                <option value="20">20 years</option>
                <option value="15">15 years</option>
                <option value="10">10 years</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="mortgage-result" aria-live="polite">
        <span>Estimated monthly payment</span>
        <strong>
          {money(total)}
          <small> / mo</small>
        </strong>
        <div className="mortgage-bar">
          <span style={{ flex: payment }} />
          <span style={{ flex: tax }} />
          <span style={{ flex: insurance }} />
        </div>
        <div>
          <span>
            <i />
            Principal & interest
          </span>
          <span>{money(payment)}</span>
        </div>
        <div>
          <span>
            <i />
            Property tax (1.2% / year)
          </span>
          <span>{money(tax)}</span>
        </div>
        <div>
          <span>
            <i />
            Home insurance
          </span>
          <span>{money(insurance)}</span>
        </div>
        <p>
          Illustrative estimate, not a lending offer or financial advice.
          Excludes HOA, PMI, and closing costs. Actual rates, taxes, and
          insurance vary.
        </p>
      </div>
    </div>
  );
}
function AddToCollection({
  property,
  open,
  onClose,
}: {
  property: Property;
  open: boolean;
  onClose: () => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const collections = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: () => get<Collection[]>("/collections"),
    enabled: !!user && open,
  });
  return (
    <Modal open={open} onClose={onClose} title="A collection of possibilities.">
      {!user ? (
        <Empty
          title="Keep your favorites together."
          text="Sign in to add this residence to a personal collection."
          href="/login"
          action="Sign in"
        />
      ) : collections.isLoading ? (
        <Loading />
      ) : collections.isError ? (
        <ErrorState retry={() => collections.refetch()} />
      ) : (
        <>
          <p className="form-note">Add {property.title} to a collection.</p>
          <div className="collection-picker">
            {collections.data?.map((c) => (
              <button
                key={c.id}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api.post(`/collections/${c.id}/items`, {
                      propertyId: property.id,
                    });
                    await collections.refetch();
                    dispatch(notify(`Added to “${c.name}”.`));
                    onClose();
                  } catch (e) {
                    dispatch(notify(errorMessage(e)));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <FolderPlus size={19} />
                <span>{c.name}</span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          <Link className="arrow-link" href="/collections" onClick={onClose}>
            Create a new collection
            <ArrowRight size={18} />
          </Link>
        </>
      )}
    </Modal>
  );
}
export function PropertyDetail({
  slug,
  initial,
}: {
  slug: string;
  initial?: Property | null;
}) {
  const query = useQuery({
    queryKey: ["property", slug],
    queryFn: () => get<Property>(`/properties/${slug}`),
    initialData: initial ?? undefined,
  });
  const similar = useQuery({
    queryKey: ["properties", "similar", initial?.listingType],
    queryFn: () =>
      get<PageResult>("/properties", {
        type: initial?.listingType || "SALE",
        limit: 4,
      }),
  });
  const [modal, setModal] = useState<
    "contact" | "schedule" | "collection" | null
  >(null);
  const dispatch = useAppDispatch();
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => query.refetch()} />;
  const p = query.data;
  const floorplan = p.media.find((m) => m.kind === "floorplan");
  const video = p.media.find((m) => m.kind === "video");
  let tour: string | null = null;
  if (video) {
    try {
      const u = new URL(video.url);
      if (
        ["my.matterport.com", "www.youtube.com", "player.vimeo.com"].includes(
          u.hostname,
        )
      )
        tour = video.url;
    } catch {}
  }
  return (
    <>
      <div className="container property-breadcrumb">
        <Link href="/search">Homes</Link>
        <ChevronRight size={14} />
        <Link href={`/search?q=${encodeURIComponent(p.city)}`}>{p.city}</Link>
        <ChevronRight size={14} />
        <span>{p.title}</span>
      </div>
      <Gallery property={p} />
      <div className="container">
        <div className="property-title-row">
          <div>
            <div className="property-status">
              <span className="status-dot" />
              {p.status === "ACTIVE"
                ? p.listingType === "RENT"
                  ? "AVAILABLE FOR LEASE"
                  : "AVAILABLE FOR SALE"
                : p.status}
              {p.isPrivateExclusive && (
                <span className="pill pill-green">Haven private exclusive</span>
              )}
            </div>
            <h1>{p.title}</h1>
            <p>
              <MapPin size={16} />
              {p.addressLine1}, {p.city}, {p.state} {p.postalCode}
            </p>
          </div>
          <div className="property-title-actions">
            <FavoriteButton property={p} />
            <button
              className="icon-button"
              aria-label="Share this home"
              onClick={async () => {
                try {
                  if (navigator.share)
                    await navigator.share({
                      title: p.title,
                      url: window.location.href,
                    });
                  else {
                    await navigator.clipboard.writeText(window.location.href);
                    dispatch(
                      notify("A good find is worth sharing. Link copied."),
                    );
                  }
                } catch (e) {
                  if ((e as Error).name !== "AbortError")
                    dispatch(
                      notify("Copy this page’s address to share this home."),
                    );
                }
              }}
            >
              <Share2 size={20} />
            </button>
            <button
              className="icon-button"
              aria-label="Add to a collection"
              onClick={() => setModal("collection")}
            >
              <FolderPlus size={21} />
            </button>
          </div>
        </div>
        <div className="property-layout">
          <div className="property-main">
            <div className="property-facts">
              <span>
                <BedDouble size={21} />
                <strong>{p.beds}</strong>Bedrooms
              </span>
              <span>
                <Bath size={21} />
                <strong>{p.baths}</strong>Bathrooms
              </span>
              <span>
                <Scan size={21} />
                <strong>{number(p.sqft)}</strong>Square feet
              </span>
              <span>
                <CalendarDays size={21} />
                <strong>{p.yearBuilt ?? "—"}</strong>Year built
              </span>
            </div>
            <nav
              className="property-anchor-nav"
              aria-label="Residence sections"
            >
              <a href="#overview">The residence</a>
              <a href="#features">The details</a>
              <a href="#neighborhood">The neighborhood</a>
              <a href="#affordability">The possibilities</a>
            </nav>
            <section id="overview" className="property-section">
              <p className="eyebrow">
                THOUGHTFULLY DESIGNED. BEAUTIFULLY LIVED.
              </p>
              <h2>
                There’s a feeling
                <br />
                <em>you get here.</em>
              </h2>
              <div className="property-description">
                {p.description.split("\n\n").map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </section>
            <section className="property-section" id="features">
              <p className="eyebrow">EVERY DETAIL, CONSIDERED</p>
              <h2>
                Room for the <em>everyday.</em>
              </h2>
              <div className="feature-grid">
                {[...p.features, ...p.amenities].map((f) => (
                  <span key={f}>
                    <Check size={17} />
                    {f}
                  </span>
                ))}
              </div>
              <div className="property-detail-table">
                <div>
                  <span>Property type</span>
                  <strong>{p.propertyType.toLowerCase()}</strong>
                </div>
                <div>
                  <span>Listing ID</span>
                  <strong>HVN-{p.id.toUpperCase()}</strong>
                </div>
                <div>
                  <span>Price per sq ft</span>
                  <strong>
                    {p.sqft ? money(Number(p.price) / p.sqft) : "On request"}
                  </strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{p.status.toLowerCase()}</strong>
                </div>
              </div>
            </section>
            <section className="property-section">
              <div className="section-heading">
                <h2>
                  A sense of <em>space.</em>
                </h2>
                <button
                  className="arrow-link"
                  onClick={() => setModal("contact")}
                >
                  Request floor plan
                  <ArrowRight size={18} />
                </button>
              </div>
              {floorplan ? (
                <div className="floorplan-image">
                  <Image
                    src={floorplan.url}
                    alt={floorplan.alt || "Residence floor plan"}
                    fill
                    sizes="70vw"
                  />
                </div>
              ) : (
                <div className="viewing-invite">
                  <Scan size={32} />
                  <h3>Get to know every corner.</h3>
                  <p>
                    The official floor plan is available from your advisor.
                    We’ll help you picture your life here.
                  </p>
                  <button
                    className="button button-outline button-small"
                    onClick={() => setModal("contact")}
                  >
                    Ask for the floor plan
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </section>
            <section className="property-section">
              <h2>
                A closer <em>look.</em>
              </h2>
              {tour ? (
                <iframe
                  className="virtual-tour"
                  src={tour}
                  title={`Virtual tour of ${p.title}`}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="viewing-invite">
                  <CalendarDays size={30} />
                  <h3>Some things are best felt in person.</h3>
                  <p>
                    Explore the light, the spaces, and the feeling of being
                    here. Let’s arrange a private viewing.
                  </p>
                  <button
                    className="button button-small"
                    onClick={() => setModal("schedule")}
                  >
                    Find your moment
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              )}
            </section>
            <section className="property-section" id="neighborhood">
              <p className="eyebrow">THE LIFE AROUND YOUR HOME</p>
              <h2>
                {p.neighborhood?.name ?? p.city}.<br />
                <em>A place to belong.</em>
              </h2>
              <p className="neighborhood-description">
                {p.neighborhood?.description ??
                  `Discover the independent shops, favorite walks, and local rhythm that make ${p.city} a remarkable place to call home.`}
              </p>
              <div className="property-map">
                <MapPane properties={[p]} />
              </div>
              {p.neighborhood && (
                <>
                  <div className="neighborhood-scores">
                    {[
                      ["Walk", p.neighborhood.statsJson.walk],
                      ["Transit", p.neighborhood.statsJson.transit],
                      ["Bike", p.neighborhood.statsJson.bike],
                    ].map(([label, score]) => (
                      <div key={label}>
                        <strong>
                          {score}
                          <small>/100</small>
                        </strong>
                        <span>{label} · illustrative score</span>
                      </div>
                    ))}
                  </div>
                  <ArrowLink href={`/neighborhoods/${p.neighborhood.slug}`}>
                    Explore {p.neighborhood.name}
                  </ArrowLink>
                </>
              )}
            </section>
            {p.listingType === "SALE" && (
              <section id="affordability" className="property-section">
                <MortgageCalculator price={p.price} />
              </section>
            )}
            <section className="property-section" id="inquiry">
              <p className="eyebrow">
                YOUR NEXT CHAPTER STARTS WITH A CONVERSATION
              </p>
              <h2>
                Shall we <em>take a look?</em>
              </h2>
              <div className="property-inquiry">
                <InquiryForm property={p} />
              </div>
            </section>
          </div>
          <aside className="property-rail">
            <div className="summary-card">
              <p className="eyebrow">A PLACE TO CALL YOUR OWN</p>
              <div className="summary-price">
                {money(p.price)}
                {p.listingType === "RENT" && <small> / mo</small>}
              </div>
              <p>
                {p.listingType === "RENT"
                  ? "Offered for lease"
                  : "Offered at this asking price"}
              </p>
              <button className="button" onClick={() => setModal("schedule")}>
                Arrange a private viewing
                <CalendarDays size={18} />
              </button>
              <button
                className="button button-outline"
                onClick={() => setModal("contact")}
              >
                Connect with your advisor
                <ArrowUpRight size={18} />
              </button>
              <div className="rail-agent">
                <Image
                  src={p.agent.avatarUrl || "/images/agent-1.jpg"}
                  alt={p.agent.name}
                  width={56}
                  height={66}
                />
                <div>
                  <Link href={`/agents/${p.agent.id}`}>{p.agent.name}</Link>
                  <span>Your Bay Area property advisor</span>
                </div>
              </div>
              <a
                className="rail-phone"
                href={`tel:${p.agent.phone?.replace(/[^+0-9]/g, "")}`}
              >
                <Phone size={16} />
                {p.agent.phone}
              </a>
              <p className="rail-note">
                <span className="status-dot" />A real person. A more personal
                approach.
              </p>
            </div>
          </aside>
        </div>
        {similar.data && (
          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MORE POSSIBILITIES TO CALL YOUR OWN</p>
                <h2>
                  A few more <em>good feelings.</em>
                </h2>
              </div>
              <ArrowLink href={p.listingType === "RENT" ? "/rent" : "/search"}>
                Explore all homes
              </ArrowLink>
            </div>
            <div className="grid-three">
              {similar.data.items
                .filter((home) => home.id !== p.id)
                .slice(0, 3)
                .map((home) => (
                  <ListingCard key={home.id} property={home} />
                ))}
            </div>
          </section>
        )}
      </div>
      <Modal
        open={modal === "contact" || modal === "schedule"}
        onClose={() => setModal(null)}
        title={
          modal === "schedule"
            ? "Find a moment to make it yours."
            : "A more personal conversation."
        }
      >
        {modal && (
          <InquiryForm
            key={modal}
            property={p}
            schedule={modal === "schedule"}
          />
        )}
      </Modal>
      <AddToCollection
        property={p}
        open={modal === "collection"}
        onClose={() => setModal(null)}
      />
    </>
  );
}
