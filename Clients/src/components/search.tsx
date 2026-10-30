"use client";
import dynamic from "next/dynamic";
import Link from "@/components/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Grid2X2,
  ListFilter,
  Map,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { api, errorMessage, get, money } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { notify, setShowMap, useAppDispatch, useAppSelector } from "@/store";
import { Empty, ErrorState, Loading, Modal } from "./ui";
import { ListingCard } from "./listing-card";

const MapPane = dynamic(() => import("./map-pane"), {
  ssr: false,
  loading: () => <Loading label="Getting our bearings…" />,
});
export function SearchPage({ rent = false }: { rent?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const showMap = useAppSelector((s) => s.searchUi.showMap);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [bounds, setBounds] = useState("");
  const base = rent ? "/rent" : "/search";
  const url = params.toString();
  const filters = {
    ...Object.fromEntries(params),
    type: rent ? "RENT" : "SALE",
  };
  const homes = useInfiniteQuery({
    queryKey: ["properties", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      get<PageResult>("/properties", { ...filters, page: pageParam, limit: 6 }),
    getNextPageParam: (last) =>
      last.page < last.pages ? last.page + 1 : undefined,
  });
  const properties = homes.data?.pages.flatMap((p) => p.items) ?? [];
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(url);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.replace(`${base}?${next}`, { scroll: false });
  };
  const save = useMutation({
    mutationFn: (name: string) =>
      api.post("/saved-searches", { name, filters }),
    onSuccess: () => {
      setSaveOpen(false);
      dispatch(notify("Your search is saved. Find it in your account."));
    },
    onError: (e) => dispatch(notify(errorMessage(e))),
  });
  return (
    <div className="search-page">
      <div className="search-toolbar">
        <form
          className="search-query"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: String(new FormData(e.currentTarget).get("q") ?? "") });
          }}
        >
          <SearchIcon size={19} />
          <input
            aria-label="Search by location"
            name="q"
            key={params.get("q")}
            defaultValue={params.get("q") ?? ""}
            placeholder="City, neighborhood, address"
          />
          <button aria-label="Search homes" type="submit">
            <ArrowRight size={18} />
          </button>
        </form>
        <div className="search-type-switch">
          <Link className={!rent ? "selected" : ""} href={`/search?${url}`}>
            Buy
          </Link>
          <Link className={rent ? "selected" : ""} href={`/rent?${url}`}>
            Rent
          </Link>
        </div>
        <select
          aria-label="Maximum asking price"
          value={params.get("maxPrice") ?? ""}
          onChange={(e) => update({ maxPrice: e.target.value })}
        >
          <option value="">Any price</option>
          {(rent
            ? [8000, 10000, 15000]
            : [2000000, 3000000, 5000000, 8000000]
          ).map((n) => (
            <option key={n} value={n}>
              Up to {money(n, true)}
            </option>
          ))}
        </select>
        <select
          aria-label="Minimum bedrooms"
          value={params.get("beds") ?? ""}
          onChange={(e) => update({ beds: e.target.value })}
        >
          <option value="">Beds</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+ beds
            </option>
          ))}
        </select>
        <select
          className="desktop-filter"
          aria-label="Property type"
          value={params.get("propertyType") ?? ""}
          onChange={(e) => update({ propertyType: e.target.value })}
        >
          <option value="">Home type</option>
          {["HOUSE", "APT", "CONDO", "TOWNHOUSE", "LAND", "COMMERCIAL"].map(
            (v) => (
              <option key={v} value={v}>
                {v === "APT" ? "Apartment" : v.toLowerCase()}
              </option>
            ),
          )}
        </select>
        <button className="filter-button" onClick={() => setFiltersOpen(true)}>
          <ListFilter size={17} />
          All filters{params.size > 0 && <span>{params.size}</span>}
        </button>
        <button
          className="save-search"
          aria-label="Save search"
          onClick={() =>
            user
              ? setSaveOpen(true)
              : router.push(
                  `/login?next=${encodeURIComponent(`${base}?${url}`)}`,
                )
          }
        >
          <Bookmark size={17} />
          <span>Save search</span>
        </button>
      </div>
      <div className={`search-body ${showMap ? "mobile-map-visible" : ""}`}>
        <div className="search-results">
          <div className="results-heading">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h1>
              {params.get("q")
                ? `At home in ${params.get("q")}.`
                : rent
                  ? "Room for your next chapter."
                  : "Find a place that feels like you."}
            </h1>
            <div>
              <span>
                {homes.isLoading
                  ? "Discovering homes…"
                  : `${homes.data?.pages[0]?.total ?? 0} thoughtfully selected ${rent ? "rentals" : "homes"}`}
              </span>
              <select
                aria-label="Sort homes"
                value={params.get("sort") ?? "newest"}
                onChange={(e) => update({ sort: e.target.value })}
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="sqft">Most spacious</option>
              </select>
            </div>
          </div>
          {params.size > 0 && (
            <div className="active-filters">
              {Array.from(params)
                .filter(([k]) => k !== "sort" && k !== "type")
                .map(([key, value]) => (
                  <button
                    className="pill"
                    key={key}
                    onClick={() => update({ [key]: "" })}
                  >
                    {key === "maxPrice"
                      ? `Up to ${money(value, true)}`
                      : key === "minPrice"
                        ? `From ${money(value, true)}`
                        : key === "beds"
                          ? `${value}+ beds`
                          : key === "bbox"
                            ? "Map area"
                            : key === "exclusive"
                              ? "Private exclusives"
                              : value.replaceAll("_", " ")}
                    <X size={13} />
                  </button>
                ))}
              <button
                className="subtle-button"
                onClick={() => router.replace(base, { scroll: false })}
              >
                Clear all
              </button>
            </div>
          )}
          {homes.isLoading ? (
            <Loading />
          ) : homes.isError ? (
            <ErrorState retry={() => homes.refetch()} />
          ) : properties.length ? (
            <>
              <div className="search-listing-grid">
                {properties.map((p) => (
                  <ListingCard key={p.id} property={p} compact />
                ))}
              </div>
              {homes.hasNextPage && (
                <div className="load-more">
                  <button
                    className="button button-outline"
                    disabled={homes.isFetchingNextPage}
                    onClick={() => homes.fetchNextPage()}
                  >
                    {homes.isFetchingNextPage
                      ? "Finding more homes…"
                      : "Discover more homes"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              <p className="results-disclosure">
                Illustrative listings. All dimensions and prices are provided
                for demonstration.
              </p>
            </>
          ) : (
            <Empty
              title="A little room to explore."
              text="No homes match just yet. Try a different neighborhood or give your filters a little breathing room."
            />
          )}
          <button
            className="mobile-map-toggle button"
            onClick={() => dispatch(setShowMap(!showMap))}
          >
            {showMap ? <Grid2X2 size={18} /> : <Map size={18} />}
            {showMap ? "Show homes" : "Explore map"}
          </button>
        </div>
        <aside className="search-map">
          <MapPane properties={properties} onBounds={setBounds} />
          {bounds && (
            <button
              className="map-search-area"
              onClick={() => update({ bbox: bounds })}
            >
              <SearchIcon size={15} />
              Search this area
            </button>
          )}
        </aside>
      </div>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="A home, your way."
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            update(
              Object.fromEntries(new FormData(e.currentTarget)) as Record<
                string,
                string
              >,
            );
            setFiltersOpen(false);
          }}
        >
          <div className="form-grid">
            <label>
              Minimum price
              <input
                name="minPrice"
                aria-label="Minimum price"
                type="number"
                min="0"
                defaultValue={params.get("minPrice") ?? ""}
                placeholder="No minimum"
              />
            </label>
            <label>
              Maximum price
              <input
                name="maxPrice"
                aria-label="Maximum price"
                type="number"
                min="0"
                defaultValue={params.get("maxPrice") ?? ""}
                placeholder="No maximum"
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Home type
              <select
                name="propertyType"
                defaultValue={params.get("propertyType") ?? ""}
              >
                <option value="">All home types</option>
                {[
                  "HOUSE",
                  "APT",
                  "CONDO",
                  "TOWNHOUSE",
                  "LAND",
                  "COMMERCIAL",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type === "APT" ? "Apartment" : type.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bedrooms
              <select name="beds" defaultValue={params.get("beds") ?? ""}>
                <option value="">Any beds</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+ bedrooms
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              Bathrooms
              <select name="baths" defaultValue={params.get("baths") ?? ""}>
                <option value="">Any bathrooms</option>
                {[1, 2, 3, 4].map((n) => (
                  <option value={n} key={n}>
                    {n}+ bathrooms
                  </option>
                ))}
              </select>
            </label>
            <label>
              Availability
              <select name="status" defaultValue={params.get("status") ?? ""}>
                <option value="">Available & pending</option>
                <option value="ACTIVE">Available now</option>
                <option value="PENDING">Pending</option>
                <option value={rent ? "RENTED" : "SOLD"}>
                  {rent ? "Rented" : "Sold"}
                </option>
              </select>
            </label>
          </div>
          <label>
            Must-have amenity
            <select
              name="amenities"
              defaultValue={params.get("amenities") ?? ""}
            >
              <option value="">Open to possibilities</option>
              {[
                "Garden",
                "Ocean view",
                "Pool",
                "Parking",
                "Fireplace",
                "Terrace",
                "Elevator",
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            Access
            <select
              name="exclusive"
              defaultValue={params.get("exclusive") ?? ""}
            >
              <option value="">All residences</option>
              <option value="true">Haven private exclusives</option>
            </select>
          </label>
          <button className="button">
            Show matching homes
            <ArrowRight size={18} />
          </button>
        </form>
      </Modal>
      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Keep the possibilities close."
      >
        <p className="form-note">
          Your filters will be saved to your account, ready whenever you are.
        </p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(String(new FormData(e.currentTarget).get("name")));
          }}
        >
          <label>
            Name this search
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={
                params.get("q")
                  ? `${params.get("q")} ${rent ? "rentals" : "homes"}`
                  : "My next chapter"
              }
            />
          </label>
          <button className="button" disabled={save.isPending}>
            Save this search
            <Bookmark size={18} />
          </button>
        </form>
      </Modal>
    </div>
  );
}
