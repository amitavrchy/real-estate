import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/property";
import { serverGet } from "@/lib/server";
import { money } from "@/lib/api";
import type { Property } from "@/lib/types";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await serverGet<Property>(`/properties/${slug}`);
  if (!p) return { title: "Discover a remarkable residence" };
  return {
    title: `${p.title} — ${money(p.price)}`,
    description: p.description.slice(0, 160),
    openGraph: {
      title: p.title,
      description: `${p.beds} beds · ${p.baths} baths · ${p.sqft} sq ft in ${p.city}`,
      images: p.media[0] ? [p.media[0].url] : [],
    },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await serverGet<Property>(`/properties/${slug}`);
  if (!p) notFound();
  const data = p
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: p.title,
        description: p.description,
        image: p.media[0]?.url,
        datePosted: p.publishedAt,
        offers: { "@type": "Offer", price: p.price, priceCurrency: "USD" },
        mainEntity: {
          "@type": "Residence",
          name: p.title,
          numberOfRooms: p.beds,
          floorSize: {
            "@type": "QuantitativeValue",
            value: p.sqft,
            unitCode: "FTK",
          },
          address: {
            "@type": "PostalAddress",
            streetAddress: p.addressLine1,
            addressLocality: p.city,
            addressRegion: p.state,
          },
          geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
        },
      }
    : null;
  return (
    <>
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
          }}
        />
      )}
      <PropertyDetail slug={slug} initial={p} />
    </>
  );
}
