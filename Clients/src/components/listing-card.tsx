"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bath, BedDouble, Heart, Scan } from "lucide-react";
import { api, errorMessage, get, money, number } from "@/lib/api";
import type { Property } from "@/lib/types";
import {
  hoverProperty,
  notify,
  toggleFavorite,
  useAppDispatch,
  useAppSelector,
} from "@/store";

export function FavoriteButton({
  property,
  className = "",
}: {
  property: Property;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const client = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const saved = useAppSelector((s) => s.favorites.ids.includes(property.id));
  const ready = useAppSelector((s) => s.auth.ready);
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => get<{ propertyId: string }[]>("/favorites"),
    enabled: !!user,
  });
  const favoritesReady = !user || favorites.isSuccess;
  const mutation = useMutation({
    mutationFn: (wasSaved: boolean) =>
      wasSaved
        ? api.delete(`/favorites/${property.id}`)
        : api.post("/favorites", { propertyId: property.id }),
    onMutate: () => dispatch(toggleFavorite(property.id)),
    onError: (error) => {
      dispatch(toggleFavorite(property.id));
      dispatch(notify(errorMessage(error)));
    },
    onSuccess: (_, wasSaved) => {
      client.invalidateQueries({ queryKey: ["favorites"] });
      dispatch(
        notify(
          wasSaved
            ? "Home removed from your saved homes."
            : "A little closer to home. Saved.",
        ),
      );
    },
  });
  return (
    <button
      className={`favorite-button ${saved ? "is-saved" : ""} ${className}`}
      aria-label={saved ? `Unsave ${property.title}` : `Save ${property.title}`}
      aria-pressed={saved}
      disabled={!ready || !favoritesReady || mutation.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          router.push(
            `/login?next=${encodeURIComponent(`/property/${property.slug}`)}`,
          );
          return;
        }
        mutation.mutate(saved);
      }}
    >
      <Heart size={20} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
export function ListingCard({
  property: p,
  compact = false,
}: {
  property: Property;
  compact?: boolean;
}) {
  const dispatch = useAppDispatch();
  const hovered = useAppSelector((s) => s.searchUi.hoveredId === p.id);
  const Heading = compact ? 'h2' : 'h3';
  return (
    <article
      className={`listing-card ${compact ? "compact" : ""} ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => dispatch(hoverProperty(p.id))}
      onMouseLeave={() => dispatch(hoverProperty(null))}
    >
      <div className="listing-image">
        <Link href={`/property/${p.slug}`} aria-label={`View ${p.title}`}>
          <Image
            src={p.media[0]?.url || "/images/hero.jpg"}
            alt={p.media[0]?.alt || p.title}
            fill
            sizes={
              compact
                ? "(max-width: 800px) 100vw, 30vw"
                : "(max-width: 700px) 100vw, 33vw"
            }
          />
          <span className="image-corner">
            <ArrowUpRight size={20} />
          </span>
        </Link>
        <span
          className={`listing-badge ${p.isPrivateExclusive ? "exclusive" : ""}`}
        >
          {p.status !== 'ACTIVE' ? p.status.replaceAll('_', ' ') : p.isPrivateExclusive
            ? "HAVEN PRIVATE"
            : p.listingType === "RENT"
              ? "FOR LEASE"
              : "JUST LISTED"}
        </span>
        <FavoriteButton property={p} />
      </div>
      <div className="listing-info">
        <div className="listing-price">
          <span>
            {money(p.price)}
            {p.listingType === "RENT" && <small> / mo</small>}
          </span>
          <span className="listing-type">
            {p.propertyType.toLowerCase().replace("apt", "Apartment")}
          </span>
        </div>
        <Link href={`/property/${p.slug}`}>
          <Heading>{p.title}</Heading>
        </Link>
        <p>
          {p.addressLine1}, {p.city}, {p.state}
        </p>
        <div className="listing-facts">
          <span>
            <BedDouble size={16} />
            {p.beds} beds
          </span>
          <span>
            <Bath size={16} />
            {p.baths} baths
          </span>
          <span>
            <Scan size={16} />
            {number(p.sqft)} sq ft
          </span>
        </div>
      </div>
    </article>
  );
}
