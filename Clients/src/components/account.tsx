"use client";
import Link from "@/components/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  FolderHeart,
  LogOut,
  Trash2,
} from "lucide-react";
import { api, errorMessage, get } from "@/lib/api";
import type { Inquiry, Property, SavedSearch } from "@/lib/types";
import {
  notify,
  session,
  setFavorites,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import { Empty, ErrorState, Loading, Protected } from "./ui";
import { ListingCard } from "./listing-card";

function AccountContent() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const client = useQueryClient();
  const [tab, setTab] = useState("homes");
  const favorites = useQuery({
    queryKey: ["favorites", user.id],
    queryFn: () => get<{ id: string; property: Property }[]>("/favorites"),
  });
  const searches = useQuery({
    queryKey: ["saved-searches", user.id],
    queryFn: () => get<SavedSearch[]>("/saved-searches"),
  });
  const inquiries = useQuery({
    queryKey: ["account-inquiries", user.id],
    queryFn: () => get<Inquiry[]>("/account/inquiries"),
  });
  return (
    <div className="container content-page">
      <div className="page-intro account-head">
        <div>
          <p className="eyebrow">YOUR HAVEN</p>
          <h1>
            Good to see you,
            <br />
            <em>{user.name.split(" ")[0]}.</em>
          </h1>
          <p className="form-note">
            The homes you love. The possibilities ahead.
          </p>
        </div>
        <div className="row-actions">
          <Link
            className="button button-outline button-small"
            href="/collections"
          >
            <FolderHeart size={18} />
            Your collections
          </Link>
          {user.role !== "BUYER" && (
            <Link className="button button-small" href="/dashboard">
              Agent workspace
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      </div>
      <div className="account-meta">
        <div>
          <span>Your name</span>
          <strong>{user.name}</strong>
        </div>
        <div>
          <span>Email address</span>
          <strong>{user.email}</strong>
        </div>
        <button
          className="subtle-button"
          onClick={() => {
            sessionStorage.removeItem("haven-token");
            dispatch(session(null));
            dispatch(setFavorites([]));
            client.clear();
            router.push("/");
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label="Your account">
        <button
          role="tab"
          aria-selected={tab === "homes"}
          className={tab === "homes" ? "selected" : ""}
          onClick={() => setTab("homes")}
        >
          Saved homes ({favorites.data?.length ?? 0})
        </button>
        <button
          role="tab"
          aria-selected={tab === "searches"}
          className={tab === "searches" ? "selected" : ""}
          onClick={() => setTab("searches")}
        >
          Saved searches ({searches.data?.length ?? 0})
        </button>
        <button
          role="tab"
          aria-selected={tab === "inquiries"}
          className={tab === "inquiries" ? "selected" : ""}
          onClick={() => setTab("inquiries")}
        >
          Your conversations ({inquiries.data?.length ?? 0})
        </button>
      </div>
      <div role="tabpanel">
        {tab === "homes" &&
          (favorites.isLoading ? (
            <Loading />
          ) : favorites.isError ? (
            <ErrorState retry={() => favorites.refetch()} />
          ) : favorites.data?.length ? (
            <div className="grid-three">
              {favorites.data.map((f) => (
                <ListingCard key={f.id} property={f.property} />
              ))}
            </div>
          ) : (
            <Empty
              title="A home will catch your eye."
              text="Tap the heart on a home you love. We’ll keep it right here for you."
              href="/search"
            />
          ))}
        {tab === "searches" &&
          (searches.isLoading ? (
            <Loading />
          ) : searches.isError ? (
            <ErrorState retry={() => searches.refetch()} />
          ) : searches.data?.length ? (
            searches.data.map((s) => (
              <div className="saved-search-row" key={s.id}>
                <div>
                  <h3>{s.name}</h3>
                  <p>
                    {Object.entries(s.filters)
                      .filter(([, v]) => !!v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ") || "All possibilities"}
                  </p>
                </div>
                <div className="row-actions">
                  <Link
                    className="arrow-link"
                    href={`${s.filters.type === "RENT" ? "/rent" : "/search"}?${new URLSearchParams(s.filters)}`}
                  >
                    See what’s new
                    <ArrowRight size={17} />
                  </Link>
                  <button
                    className="icon-button"
                    aria-label={`Delete saved search ${s.name}`}
                    onClick={async () => {
                      try {
                        await api.delete(`/saved-searches/${s.id}`);
                        await searches.refetch();
                        dispatch(notify("Search removed."));
                      } catch (e) {
                        dispatch(notify(errorMessage(e)));
                      }
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Your search, remembered."
              text="Find your favorite filters, then save your search to pick up where you left off."
              href="/search"
            />
          ))}
        {tab === "inquiries" &&
          (inquiries.isLoading ? (
            <Loading />
          ) : inquiries.isError ? (
            <ErrorState retry={() => inquiries.refetch()} />
          ) : inquiries.data?.length ? (
            inquiries.data.map((i) => (
              <div className="inquiry-row" key={i.id}>
                <div>
                  <Link href={`/property/${i.property.slug}`}>
                    <h3>{i.property.title}</h3>
                  </Link>
                  <p>{i.message}</p>
                  <p>
                    {new Date(i.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="pill pill-green">
                  {i.status === "NEW"
                    ? "Sent to advisor"
                    : i.status.toLowerCase()}
                </span>
              </div>
            ))
          ) : (
            <Empty
              title="Start a conversation."
              text="Have a question about a home? Your advisor is a message away."
              href="/search"
            />
          ))}
      </div>
    </div>
  );
}
export function Account() {
  return (
    <Protected>
      <AccountContent />
    </Protected>
  );
}
