"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
} from "lucide-react";
import { get } from "@/lib/api";
import type { Agent, Neighborhood, Post } from "@/lib/types";
import { ArrowLink, Empty, ErrorState, Loading, Reveal } from "./ui";
import { ListingCard } from "./listing-card";
import { JournalCard } from "./home";
import { Reviews } from "./reviews";

const MapPane = dynamic(() => import("./map-pane"), { ssr: false });
export function AgentsPage() {
  const query = useQuery({
    queryKey: ["agents"],
    queryFn: () => get<Agent[]>("/agents"),
  });
  return (
    <div className="container content-page">
      <div className="page-intro">
        <p className="eyebrow">LOCAL KNOWLEDGE. HUMAN CONNECTION.</p>
        <h1>
          Your place.
          <br />
          <em>Your people.</em>
        </h1>
        <p>
          Thoughtful listeners. Tireless advocates. People who care as much
          about your next chapter as you do.
        </p>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : (
        <div className="agent-grid">
          {query.data
            ?.filter((a) => a.id !== "demo-admin")
            .map((a) => (
              <Reveal className="agent-card" key={a.id}>
                <Link href={`/agents/${a.id}`}>
                  <div className="agent-portrait">
                    <Image
                      src={a.avatarUrl || "/images/agent-1.jpg"}
                      alt={a.name}
                      fill
                      sizes="(max-width: 760px) 100vw, 33vw"
                    />
                  </div>
                  <h2>{a.name}</h2>
                </Link>
                <p>Bay Area property advisor</p>
                <p>
                  <MapPin size={14} className="inline-icon" />
                  San Francisco & Marin County · {a._count?.listings ?? 0}{" "}
                  available homes
                </p>
                <ArrowLink href={`/agents/${a.id}`}>
                  Get to know {a.name.split(" ")[0]}
                  <ArrowRight size={18} />
                </ArrowLink>
              </Reveal>
            ))}
        </div>
      )}
    </div>
  );
}
export function AgentProfile({ agent }: { agent: Agent }) {
  return (
    <>
      <div className="container">
        <div className="agent-profile">
          <div className="agent-portrait">
            <Image
              src={agent.avatarUrl || "/images/agent-1.jpg"}
              alt={agent.name}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 40vw"
            />
          </div>
          <Reveal>
            <Link href="/agents" className="back-link">
              <ArrowLeft size={16} />
              Our people
            </Link>
            <p className="eyebrow">YOUR BAY AREA PROPERTY ADVISOR</p>
            <h1>
              {agent.name.split(" ")[0]}
              <br />
              <em>{agent.name.split(" ").slice(1).join(" ")}</em>
            </h1>
            <p>{agent.bio}</p>
            <div className="row-actions">
              <a
                className="button"
                href={`tel:${agent.phone?.replace(/[^+0-9]/g, "")}`}
              >
                <Phone size={18} />
                Let’s talk
                <ArrowUpRight size={18} />
              </a>
              {agent.listings?.[0] && (
                <ArrowLink href={`/property/${agent.listings[0].slug}#inquiry`}>
                  Send a message
                </ArrowLink>
              )}
            </div>
            <p className="form-note">
              {agent.phone} · San Francisco & Marin County
            </p>
          </Reveal>
        </div>
        <div className="agent-philosophy">
          <p className="eyebrow">THE HAVEN APPROACH</p>
          <h2>
            “The right home is the one
            <br />
            that feels <em>entirely like you.</em>”
          </h2>
          <p>{agent.name}, Haven property advisor</p>
        </div>
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A THOUGHTFUL SELECTION</p>
              <h2>
                In good <em>company.</em>
              </h2>
            </div>
            <span className="form-note">
              Residences represented by {agent.name.split(" ")[0]}
            </span>
          </div>
          {agent.listings?.length ? (
            <div className="grid-three">
              {agent.listings.map((p) => (
                <ListingCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="New possibilities are on their way."
              text="Get in touch to hear about upcoming residences."
            />
          )}
        </section>
        <Reviews agentId={agent.id} />
      </div>
    </>
  );
}
export function JournalPage() {
  const query = useQuery({
    queryKey: ["journal"],
    queryFn: () => get<Post[]>("/journal"),
  });
  return (
    <div className="container content-page">
      <div className="page-intro">
        <p className="eyebrow">THE HAVEN JOURNAL</p>
        <h1>
          A home is a place.
          <br />
          <em>Living is an art.</em>
        </h1>
        <p>
          Considered spaces. Interesting people. Little discoveries that make a
          life well lived.
        </p>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : (
        <div className="grid-three journal-grid">
          {query.data?.map((p) => (
            <JournalCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
export function JournalArticle({ post }: { post: Post }) {
  const paragraphs = post.body.split("\n\n");
  return (
    <article>
      <div className="container page-intro article-intro">
        <Link href="/journal" className="back-link">
          <ArrowLeft size={16} />
          The journal
        </Link>
        <p className="eyebrow">{paragraphs[0].toUpperCase()}</p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div className="article-meta">
          <span>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span>By the Haven editorial team</span>
          <span>5 min read</span>
        </div>
      </div>
      <div className="container article-hero">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="container">
        <div className="article-body">
          {paragraphs
            .slice(1)
            .map((text, i) =>
              text.startsWith("## ") ? (
                <h2 key={i}>{text.slice(3)}</h2>
              ) : (
                <p key={i}>{text}</p>
              ),
            )}
          <div className="article-end">
            <p className="eyebrow">FIND YOUR OWN INSPIRATION</p>
            <ArrowLink href="/search">
              Discover a home that feels like you
            </ArrowLink>
          </div>
        </div>
      </div>
    </article>
  );
}
export function NeighborhoodPage({
  neighborhood: n,
}: {
  neighborhood: Neighborhood;
}) {
  return (
    <>
      <section className="neighborhood-hero">
        <Image
          src={n.heroImage}
          alt={`${n.name}, ${n.city}`}
          fill
          priority
          sizes="100vw"
        />
        <div className="container">
          <p className="eyebrow">SAN FRANCISCO, CALIFORNIA</p>
          <h1>
            {n.name}.<br />
            <em>Make yourself at home.</em>
          </h1>
        </div>
      </section>
      <div className="container">
        <div className="neighborhood-copy">
          <div>
            <p className="eyebrow">{n.statsJson.character.toUpperCase()}</p>
            <h2>
              A neighborhood.
              <br />
              <em>A feeling.</em>
            </h2>
          </div>
          <p>{n.description}</p>
        </div>
        <div className="neighborhood-stats">
          {[
            ["Walkability", n.statsJson.walk, "For your everyday discoveries"],
            ["Transit", n.statsJson.transit, "Connected to the city"],
            ["Biking", n.statsJson.bike, "A different way to explore"],
          ].map(([label, score, text]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                {score}
                <small>/100</small>
              </strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="form-note score-disclaimer">
          Neighborhood scores are illustrative placeholders, not verified
          ratings. For school information, consult the local school district.
        </p>
        <div className="neighborhood-map">
          <MapPane properties={n.properties ?? []} />
        </div>
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR PLACE IN THE NEIGHBORHOOD</p>
              <h2>
                Stay a <em>little longer.</em>
              </h2>
            </div>
            <ArrowLink href={`/search?q=${encodeURIComponent(n.city)}`}>
              Explore local homes
            </ArrowLink>
          </div>
          <div className="grid-three">
            {n.properties?.map((p) => (
              <ListingCard key={p.id} property={p} />
            ))}
          </div>
        </section>
        {!!n.posts?.length && (
          <section className="section neighborhood-journal">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AROUND THE NEIGHBORHOOD</p>
                <h2>
                  Local <em>perspectives.</em>
                </h2>
              </div>
            </div>
            <div className="grid-three">
              {n.posts.map((p) => (
                <JournalCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
