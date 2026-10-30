"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  FileText,
  House,
  Inbox,
  LayoutDashboard,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { api, errorMessage, get, money, number } from "@/lib/api";
import type { Inquiry, Post, Property } from "@/lib/types";
import { notify, useAppDispatch, useAppSelector } from "@/store";
import { Empty, ErrorState, Loading, Modal, Protected } from "./ui";

type Lead = {
  id: string;
  name: string;
  email: string;
  address: string;
  sqft: number;
  low: number;
  high: number;
  phone?: string;
};
type DashboardData = {
  listings: Property[];
  inquiries: number;
  leads: Lead[];
  subscribers: number;
};
const listingSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(15000),
  price: z.number().min(0).max(999999999999),
  beds: z.number().int().min(0).max(100),
  baths: z.number().min(0).max(100),
  sqft: z.number().int().min(0),
  addressLine1: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string(),
  postalCode: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "PENDING",
    "SOLD",
    "RENTED",
    "OFF_MARKET",
  ]),
  listingType: z.enum(["SALE", "RENT"]),
  propertyType: z.enum([
    "HOUSE",
    "APT",
    "CONDO",
    "TOWNHOUSE",
    "LAND",
    "COMMERCIAL",
  ]),
  amenities: z.string(),
  features: z.string(),
  imageUrl: z
    .string()
    .refine(
      (s) => !s || (/^https:\/\//.test(s) && URL.canParse(s)),
      "Enter a valid HTTPS image URL.",
    ),
  isPrivateExclusive: z.boolean(),
});
type ListingValues = z.infer<typeof listingSchema>;
function ListingEditor({
  property,
  onSaved,
}: {
  property: Property | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const form = useForm<ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: property
      ? {
          ...property,
          price: Number(property.price),
          amenities: property.amenities.join(", "),
          features: property.features.join(", "),
          imageUrl: "",
          status: property.status as ListingValues["status"],
          propertyType: property.propertyType as ListingValues["propertyType"],
        }
      : {
          title: "",
          description: "",
          status: "DRAFT",
          listingType: "SALE",
          propertyType: "HOUSE",
          price: 0,
          beds: 3,
          baths: 2,
          sqft: 2000,
          addressLine1: "",
          city: "San Francisco",
          state: "CA",
          postalCode: "",
          lat: 37.79,
          lng: -122.44,
          amenities: "",
          features: "",
          imageUrl: "",
          isPrivateExclusive: false,
        },
  });
  const errorFor = (name: keyof ListingValues) =>
    form.formState.errors[name] && (
      <span className="form-error">
        {String(form.formState.errors[name]?.message)}
      </span>
    );
  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const { imageUrl, amenities, features, ...rest } = values;
        const data = {
          ...rest,
          amenities: amenities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          features: features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ...(imageUrl ? { mediaUrls: [imageUrl] } : {}),
        };
        try {
          if (property) await api.patch(`/properties/${property.id}`, data);
          else await api.post("/properties", data);
          dispatch(
            notify(
              property
                ? "Your residence has been updated."
                : "A new possibility, beautifully presented. Listing created.",
            ),
          );
          onSaved();
        } catch (e) {
          setError(errorMessage(e));
        }
      })}
    >
      <div className="form-grid">
        <label>
          Residence name
          <input {...form.register("title")} />
          {errorFor("title")}
        </label>
        <label>
          Asking price (USD)
          <input
            type="number"
            min="0"
            {...form.register("price", { valueAsNumber: true })}
          />
          {errorFor("price")}
        </label>
      </div>
      <label>
        The story of this home
        <textarea rows={5} {...form.register("description")} />
        {errorFor("description")}
      </label>
      <div className="form-grid">
        <label>
          Listing purpose
          <select {...form.register("listingType")}>
            <option value="SALE">For sale</option>
            <option value="RENT">For lease</option>
          </select>
        </label>
        <label>
          Property type
          <select {...form.register("propertyType")}>
            {["HOUSE", "APT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"].map(
              (s) => (
                <option value={s} key={s}>
                  {s === "APT" ? "Apartment" : s.toLowerCase()}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="editor-facts">
        <label>
          Bedrooms
          <input
            type="number"
            min="0"
            {...form.register("beds", { valueAsNumber: true })}
          />
          {errorFor("beds")}
        </label>
        <label>
          Bathrooms
          <input
            type="number"
            min="0"
            step=".5"
            {...form.register("baths", { valueAsNumber: true })}
          />
          {errorFor("baths")}
        </label>
        <label>
          Living area (sq ft)
          <input
            type="number"
            min="0"
            {...form.register("sqft", { valueAsNumber: true })}
          />
          {errorFor("sqft")}
        </label>
      </div>
      <label>
        Street address
        <input {...form.register("addressLine1")} />
        {errorFor("addressLine1")}
      </label>
      <div className="editor-facts">
        <label>
          City
          <input {...form.register("city")} />
          {errorFor("city")}
        </label>
        <label>
          State
          <input {...form.register("state")} />
        </label>
        <label>
          Postal code
          <input {...form.register("postalCode")} />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            {...form.register("lat", { valueAsNumber: true })}
          />
          {errorFor("lat")}
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            {...form.register("lng", { valueAsNumber: true })}
          />
          {errorFor("lng")}
        </label>
      </div>
      <div className="form-grid">
        <label>
          Amenities
          <input
            placeholder="Garden, Parking, Terrace"
            {...form.register("amenities")}
          />
          <span className="field-hint">
            Separate each amenity with a comma.
          </span>
        </label>
        <label>
          Considered details
          <input
            placeholder="Oak floors, Chef’s kitchen"
            {...form.register("features")}
          />
          <span className="field-hint">
            Separate each feature with a comma.
          </span>
        </label>
      </div>
      <label>
        {property ? "Add another image URL" : "Cover image URL"}
        <input
          type="url"
          placeholder="https://images.unsplash.com/…"
          {...form.register("imageUrl")}
        />
        {errorFor("imageUrl")}
        <span className="field-hint">
          Use a publicly accessible HTTPS image URL. An image is required before
          publishing.
        </span>
      </label>
      <div className="form-grid">
        <label>
          Listing status
          <select {...form.register("status")}>
            {["DRAFT", "ACTIVE", "PENDING", "SOLD", "RENTED", "OFF_MARKET"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.toLowerCase().replace("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" {...form.register("isPrivateExclusive")} />
          Haven private exclusive
        </label>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "Saving your residence…"
          : "Save residence"}
        <Check size={18} />
      </button>
    </form>
  );
}
function MediaManager({
  property,
  onSaved,
}: {
  property: Property;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("image");
  return (
    <div className="media-manager">
      <div className="media-manager-grid">
        {property.media.map((m) => (
          <div key={m.id}>
            <div className="media-thumb">
              {m.kind === "image" ? (
                <Image src={m.url} alt={m.alt} fill sizes="160px" unoptimized />
              ) : (
                <FileText size={30} />
              )}
            </div>
            <p>
              {m.kind} · {m.alt || "Residence media"}
            </p>
            <button
              className="subtle-button danger-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.delete(`/properties/${property.id}/media/${m.id}`);
                  onSaved();
                  dispatch(notify("Media removed."));
                } catch (e) {
                  dispatch(notify(errorMessage(e)));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={15} />
              Remove
            </button>
          </div>
        ))}
      </div>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          const data = new FormData(target);
          setBusy(true);
          try {
            await api.post(`/properties/${property.id}/media`, {
              url: String(data.get("url")),
              alt: String(data.get("alt")),
              kind,
            });
            target.reset();
            onSaved();
            dispatch(notify("A new perspective added."));
          } catch (e) {
            dispatch(notify(errorMessage(e)));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Media type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="image">Gallery photograph</option>
              <option value="floorplan">Official floor plan</option>
              <option value="video">Embedded virtual tour</option>
            </select>
          </label>
          <label>
            Description
            <input
              name="alt"
              required
              maxLength={200}
              placeholder="What does this image show?"
            />
          </label>
        </div>
        <label>
          HTTPS URL
          <input
            name="url"
            type="url"
            required
            placeholder={
              kind === "video"
                ? "https://my.matterport.com/show/?m=…"
                : "https://images.unsplash.com/…"
            }
            pattern="https://.*"
          />
        </label>
        {kind === "video" && (
          <p className="form-note">
            Use an embeddable Matterport, YouTube, or Vimeo URL.
          </p>
        )}
        <button className="button" disabled={busy}>
          Add to this residence
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
function PostEditor({
  post,
  onSaved,
}: {
  post: Post | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        if (!data.coverImage) delete data.coverImage;
        setBusy(true);
        setError("");
        try {
          if (post) await api.patch(`/journal/${post.id}`, data);
          else await api.post("/journal", data);
          onSaved();
          dispatch(notify("A story worth sharing. Published."));
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Story title
        <input
          name="title"
          required
          minLength={3}
          maxLength={200}
          defaultValue={post?.title}
        />
      </label>
      <label>
        A short introduction
        <textarea
          name="excerpt"
          required
          minLength={10}
          maxLength={500}
          defaultValue={post?.excerpt}
        />
      </label>
      <label>
        The story
        <textarea
          name="body"
          required
          minLength={20}
          rows={12}
          defaultValue={post?.body}
        />
        <span className="field-hint">
          Start with the category, then a blank line. Separate paragraphs with
          blank lines. Begin section headings with ##.
        </span>
      </label>
      <label>
        Cover image URL
        <input
          name="coverImage"
          type="url"
          pattern="https://.*"
          defaultValue={
            post?.coverImage?.startsWith("https:") ? post.coverImage : ""
          }
        />
        <span className="field-hint">
          {post?.coverImage?.startsWith("/")
            ? "Leave blank to keep the current image."
            : "A publicly accessible HTTPS image."}
        </span>
      </label>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        Publish story
        <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
function DashboardContent({ section }: { section: string }) {
  const user = useAppSelector((s) => s.auth.user)!;
  const admin = user.role === "ADMIN";
  const dispatch = useAppDispatch();
  const client = useQueryClient();
  const [editor, setEditor] = useState<Property | "new" | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    kind: "properties" | "journal";
  } | null>(null);
  const [postEditor, setPostEditor] = useState<Post | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [term, setTerm] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState("ALL");
  const dashboard = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: () => get<DashboardData>("/dashboard"),
  });
  const inbox = useQuery({
    queryKey: ["inquiries", user.id],
    queryFn: () => get<Inquiry[]>("/inquiries"),
  });
  const journal = useQuery({
    queryKey: ["journal"],
    queryFn: () => get<Post[]>("/journal"),
    enabled: admin && section === "journal",
  });
  const refresh = () => {
    client.invalidateQueries({ queryKey: ["dashboard"] });
    client.invalidateQueries({ queryKey: ["properties"] });
    client.invalidateQueries({ queryKey: ["property"] });
    client.invalidateQueries({ queryKey: ["journal"] });
  };
  const sections = [
    { path: "", label: "Overview", icon: LayoutDashboard },
    { path: "listings", label: "Your residences", icon: House },
    { path: "inquiries", label: "Conversations", icon: Inbox },
    ...(admin
      ? [
          { path: "leads", label: "Seller introductions", icon: Users },
          { path: "journal", label: "The journal", icon: FileText },
        ]
      : []),
  ];
  const current = sections.find((s) => s.path === section) ?? sections[0];
  const activeSection = current.path;
  const allHomes = dashboard.data?.listings ?? [];
  const homes = allHomes.filter((p) =>
    `${p.title} ${p.addressLine1} ${p.city}`
      .toLowerCase()
      .includes(term.toLowerCase()),
  );
  const media = allHomes.find((p) => p.id === mediaId);
  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="eyebrow">HAVEN WORKSPACE</span>
          <p>
            A considered approach.
            <br />
            An exceptional result.
          </p>
        </div>
        <nav aria-label="Workspace navigation">
          {sections.map((s) => (
            <Link
              key={s.path}
              href={`/dashboard${s.path ? `/${s.path}` : ""}`}
              className={activeSection === s.path ? "selected" : ""}
            >
              <s.icon size={18} />
              {s.label}
              {s.path === "inquiries" &&
                !!inbox.data?.filter((i) => i.status === "NEW").length && (
                  <span>
                    {inbox.data.filter((i) => i.status === "NEW").length}
                  </span>
                )}
            </Link>
          ))}
        </nav>
        <div className="dashboard-person">
          <div className="avatar-letter">{user.name[0]}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{admin ? "Administrator" : "Property advisor"}</span>
          </div>
          <Link href="/account" aria-label="Your account">
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">
              {new Date()
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}
            </p>
            <h1>
              {activeSection === "" ? (
                <>
                  Good things <em>ahead.</em>
                </>
              ) : (
                current.label
              )}
            </h1>
            <p>
              {activeSection === ""
                ? `Welcome back, ${user.name.split(" ")[0]}. Here’s where things stand.`
                : activeSection === "listings"
                  ? "Every residence. Every detail. In your hands."
                  : activeSection === "inquiries"
                    ? "A good conversation can change everything."
                    : activeSection === "leads"
                      ? "The first step in someone’s next chapter."
                      : "Stories for a life well lived."}
            </p>
          </div>
          <button
            className="button button-small"
            onClick={() =>
              activeSection === "journal"
                ? setPostEditor("new")
                : setEditor("new")
            }
          >
            <Plus size={18} />
            {activeSection === "journal" ? "New story" : "Add a residence"}
          </button>
        </div>
        {dashboard.isLoading ? (
          <Loading />
        ) : dashboard.isError ? (
          <ErrorState retry={() => dashboard.refetch()} />
        ) : (
          <>
            {activeSection === "" && (
              <>
                <div className="dashboard-stats">
                  {[
                    {
                      label: "Active residences",
                      value: allHomes.filter((p) => p.status === "ACTIVE")
                        .length,
                      icon: House,
                      href: "/dashboard/listings",
                    },
                    {
                      label: "Conversations started",
                      value: dashboard.data?.inquiries ?? 0,
                      icon: Inbox,
                      href: "/dashboard/inquiries",
                    },
                    {
                      label: "Sale portfolio",
                      value: money(
                        allHomes
                          .filter(
                            (p) =>
                              p.listingType === "SALE" && p.status === "ACTIVE",
                          )
                          .reduce((a, p) => a + Number(p.price), 0),
                        true,
                      ),
                      icon: Building2,
                      href: "/dashboard/listings",
                    },
                    {
                      label: admin
                        ? "Newsletter subscribers"
                        : "New conversations",
                      value: admin
                        ? (dashboard.data?.subscribers ?? 0)
                        : (inbox.data?.filter((i) => i.status === "NEW")
                            .length ?? 0),
                      icon: Mail,
                      href: "/dashboard/inquiries",
                    },
                  ].map((s) => (
                    <Link
                      className="dashboard-stat"
                      key={s.label}
                      href={s.href}
                    >
                      <div>
                        <span>{s.label}</span>
                        <s.icon size={19} />
                      </div>
                      <strong>{s.value}</strong>
                      <span>
                        Explore the details
                        <ArrowUpRight size={15} />
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="dashboard-section-heading">
                  <h2>Your latest residences</h2>
                  <Link href="/dashboard/listings" className="arrow-link">
                    All residences
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </>
            )}
            {(activeSection === "" || activeSection === "listings") && (
              <>
                {activeSection === "listings" && (
                  <div className="dashboard-list-search">
                    <Search size={18} />
                    <input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Find a residence"
                      aria-label="Find a residence"
                    />
                    <span>{homes.length} residences</span>
                  </div>
                )}
                {homes.length ? (
                  <div className="table-scroll">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Residence</th>
                          <th>Asking price</th>
                          <th>Status</th>
                          <th>Details</th>
                          <th>Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {homes
                          .slice(0, activeSection === "" ? 5 : undefined)
                          .map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="table-home">
                                  <Image
                                    src={p.media[0]?.url || "/images/hero.jpg"}
                                    alt=""
                                    width={70}
                                    height={52}
                                    unoptimized
                                  />
                                  <div>
                                    <strong>{p.title}</strong>
                                    <span>
                                      {p.addressLine1}, {p.city}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="mono">
                                {money(p.price)}
                                {p.listingType === "RENT" && (
                                  <span className="form-note"> / mo</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`pill ${p.status === "ACTIVE" ? "pill-green" : ""}`}
                                >
                                  {p.status.toLowerCase().replace("_", " ")}
                                </span>
                              </td>
                              <td>
                                {p.beds} bd · {p.baths} ba
                                <br />
                                <span className="form-note">
                                  {number(p.sqft)} sq ft
                                </span>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    className="icon-button"
                                    aria-label={`Edit ${p.title}`}
                                    onClick={() => setEditor(p)}
                                  >
                                    <Pencil size={17} />
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={`Manage media for ${p.title}`}
                                    onClick={() => setMediaId(p.id)}
                                  >
                                    <FileText size={17} />
                                  </button>
                                  {!["DRAFT", "OFF_MARKET"].includes(
                                    p.status,
                                  ) && (
                                    <Link
                                      href={`/property/${p.slug}`}
                                      className="icon-button"
                                      aria-label={`View ${p.title}`}
                                    >
                                      <ArrowUpRight size={18} />
                                    </Link>
                                  )}
                                  {admin && (
                                    <button
                                      className="icon-button danger-button"
                                      aria-label={`Delete ${p.title}`}
                                      onClick={() =>
                                        setDeleteTarget({
                                          id: p.id,
                                          title: p.title,
                                          kind: "properties",
                                        })
                                      }
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Your next great listing starts here."
                    text="Add a residence and give its story a place to live."
                  />
                )}
              </>
            )}
            {activeSection === "inquiries" && (
              <>
                <div className="tabs">
                  {["ALL", "NEW", "CONTACTED", "CLOSED"].map((s) => (
                    <button
                      key={s}
                      className={s === inquiryFilter ? "selected" : ""}
                      onClick={() => setInquiryFilter(s)}
                    >
                      {s.toLowerCase()}
                    </button>
                  ))}
                </div>
                {inbox.isLoading ? (
                  <Loading />
                ) : inbox.isError ? (
                  <ErrorState retry={() => inbox.refetch()} />
                ) : inbox.data?.filter(
                    (i) =>
                      inquiryFilter === "ALL" || i.status === inquiryFilter,
                  ).length ? (
                  inbox.data
                    .filter(
                      (i) =>
                        inquiryFilter === "ALL" || i.status === inquiryFilter,
                    )
                    .map((i) => (
                      <div className="inbox-card" key={i.id}>
                        <div className="inbox-card-heading">
                          <div>
                            <h2>{i.name}</h2>
                            <Link href={`/property/${i.property.slug}`}>
                              {i.property.title}
                              <ArrowUpRight size={15} />
                            </Link>
                          </div>
                          <select
                            aria-label={`Status for inquiry from ${i.name}`}
                            value={i.status}
                            disabled={busy}
                            onChange={async (e) => {
                              const status = e.target.value;
                              setBusy(true);
                              try {
                                await api.patch(`/inquiries/${i.id}`, {
                                  status,
                                });
                                await inbox.refetch();
                                dispatch(notify("Conversation updated."));
                              } catch (e) {
                                dispatch(notify(errorMessage(e)));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </div>
                        <p>{i.message}</p>
                        <div className="inbox-card-footer">
                          <a href={`mailto:${i.email}`}>
                            <Mail size={15} />
                            {i.email}
                          </a>
                          {i.phone && (
                            <a href={`tel:${i.phone.replace(/[^+0-9]/g, "")}`}>
                              {i.phone}
                            </a>
                          )}
                          <span>
                            {new Date(i.createdAt).toLocaleDateString("en-US")}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <Empty
                    title="A little quiet, for now."
                    text="When someone reaches out about one of your residences, the conversation will start here."
                  />
                )}
              </>
            )}
            {activeSection === "leads" &&
              (dashboard.data?.leads.length ? (
                dashboard.data.leads.map((l) => (
                  <div className="inbox-card" key={l.id}>
                    <div className="inbox-card-heading">
                      <div>
                        <h2>{l.name}</h2>
                        <p>{l.address}</p>
                      </div>
                      <span className="pill pill-green">
                        Seller introduction
                      </span>
                    </div>
                    <p>
                      {number(l.sqft)} sq ft · Illustrative range {money(l.low)}{" "}
                      – {money(l.high)}
                    </p>
                    <div className="inbox-card-footer">
                      <a href={`mailto:${l.email}`}>
                        <Mail size={15} />
                        {l.email}
                      </a>
                      {l.phone && (
                        <a href={`tel:${l.phone.replace(/[^+0-9]/g, "")}`}>
                          {l.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <Empty
                  title="The next introduction is on its way."
                  text="Seller valuation requests appear here with the details you need to start a personal conversation."
                />
              ))}
            {activeSection === "journal" &&
              (journal.isLoading ? (
                <Loading />
              ) : journal.isError ? (
                <ErrorState retry={() => journal.refetch()} />
              ) : (
                journal.data?.map((p) => (
                  <div className="saved-search-row" key={p.id}>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.excerpt}</p>
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${p.title}`}
                        onClick={() => setPostEditor(p)}
                      >
                        <Pencil size={17} />
                      </button>
                      <Link
                        className="icon-button"
                        aria-label={`Read ${p.title}`}
                        href={`/journal/${p.slug}`}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                      <button
                        className="icon-button danger-button"
                        aria-label={`Delete ${p.title}`}
                        onClick={() =>
                          setDeleteTarget({
                            id: p.id,
                            title: p.title,
                            kind: "journal",
                          })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))
              ))}
          </>
        )}
      </div>
      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={
          editor === "new"
            ? "A new residence. A new story."
            : "Every detail, considered."
        }
        wide
      >
        {editor !== null && (
          <ListingEditor
            key={typeof editor === "string" ? editor : editor.id}
            property={editor === "new" ? null : editor}
            onSaved={() => {
              refresh();
              setEditor(null);
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!media}
        onClose={() => setMediaId(null)}
        title="A beautiful point of view."
        wide
      >
        {media && (
          <MediaManager property={media} onSaved={() => dashboard.refetch()} />
        )}
      </Modal>
      <Modal
        open={postEditor !== null}
        onClose={() => setPostEditor(null)}
        title={
          postEditor === "new"
            ? "A story worth telling."
            : "A fresh perspective."
        }
        wide
      >
        {postEditor !== null && (
          <PostEditor
            post={postEditor === "new" ? null : postEditor}
            onSaved={() => {
              refresh();
              setPostEditor(null);
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Let this story go?"
      >
        <p className="form-note">
          “{deleteTarget?.title}” will be permanently deleted.
          {deleteTarget?.kind === "properties" &&
            " Related inquiries, saved homes, and collection entries will also be removed."}
        </p>
        <div className="row-actions dialog-actions">
          <button
            className="button button-outline"
            onClick={() => setDeleteTarget(null)}
          >
            Keep it
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              if (!deleteTarget) return;
              setBusy(true);
              try {
                await api.delete(`/${deleteTarget.kind}/${deleteTarget.id}`);
                refresh();
                setDeleteTarget(null);
                dispatch(notify("Removed. Room for new possibilities."));
              } catch (e) {
                dispatch(notify(errorMessage(e)));
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete permanently
            <Trash2 size={17} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
export function Dashboard({ section = "" }: { section?: string }) {
  return (
    <Protected agent>
      <DashboardContent section={section} />
    </Protected>
  );
}
