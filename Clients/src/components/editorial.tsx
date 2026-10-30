"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Compass,
  HeartHandshake,
  KeyRound,
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
  const advisors =
    query.data?.filter((agent) => agent.id !== "demo-admin") ?? [];
  return (
    <div className="container content-page team-page">
      <div className="page-intro team-intro">
        <div>
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
          <a href="#team-advisors" className="button">
            Find your advisor <ArrowUpRight size={18} />
          </a>
        </div>
        <aside className="team-intro-note">
          <span className="team-icon">
            <MapPin size={24} aria-hidden="true" />
          </span>
          <p className="eyebrow">ROOTED HERE. FOCUSED ON YOU.</p>
          <h2>
            A local perspective.
            <br />
            <em>A personal connection.</em>
          </h2>
          <p>
            From the city streets to the quieter corners of Marin, we help you
            see a place through the life you want to live.
          </p>
          <span className="team-location">San Francisco & Marin County</span>
        </aside>
      </div>

      <section className="team-story" aria-labelledby="team-story-title">
        <div className="team-story-image">
          <Image
            src="/images/interior-2.jpg"
            alt="A welcoming, sunlit living space opening onto a garden"
            fill
            sizes="(max-width: 760px) 100vw, 45vw"
          />
          <span>ROOM FOR YOUR NEXT CHAPTER</span>
        </div>
        <div className="team-story-copy">
          <p className="eyebrow">THE PEOPLE BEHIND THE PLACE</p>
          <h2 id="team-story-title">
            Good homes start
            <br />
            with <em>good people.</em>
          </h2>
          <p>
            A home search is personal. So is the way we work. We take time to
            understand your everyday rituals, your bigger plans, and the details
            that make a place feel right.
          </p>
          <p>
            Whether you are finding your first city apartment, making room for
            more, or preparing to sell, you will have a thoughtful partner for
            the conversations and decisions ahead.
          </p>
          <div className="team-service-links" aria-label="Ways we can help">
            <Link href="/search">
              Find a home <ArrowUpRight size={15} />
            </Link>
            <Link href="/sell">
              Plan your sale <ArrowUpRight size={15} />
            </Link>
            <Link href="/rent">
              Explore rentals <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="team-advisors"
        className="team-directory"
        aria-labelledby="team-advisors-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR PEOPLE, RIGHT HERE</p>
            <h2 id="team-advisors-title">
              Meet your <em>next-door experts.</em>
            </h2>
          </div>
          <p className="section-heading-aside">
            Different perspectives. A shared belief that your next move should
            feel like you.
          </p>
        </div>
        {query.isLoading ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : !advisors.length ? (
          <Empty
            title="Good people are on their way."
            text="Our advisor directory is being updated. Explore the homes while we get ready to introduce you."
            href="/search"
          />
        ) : (
          <div className="agent-grid">
            {advisors.map((a) => (
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
                  <h3>{a.name}</h3>
                </Link>
                <p>Bay Area property advisor</p>
                <p>
                  <MapPin size={14} className="inline-icon" />
                  San Francisco & Marin County · {a._count?.listings ?? 0}{" "}
                  available homes
                </p>
                {a.bio && <p className="team-advisor-bio">{a.bio}</p>}
                <ArrowLink href={`/agents/${a.id}`}>
                  Get to know {a.name.split(" ")[0]}
                </ArrowLink>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="team-approach" aria-labelledby="team-approach-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE HAVEN WAY</p>
            <h2 id="team-approach-title">
              A little more care.
              <br />
              <em>At every step.</em>
            </h2>
          </div>
          <p className="section-heading-aside">
            Clear conversations, considered advice, and room to make a decision
            in your own time.
          </p>
        </div>
        <div className="team-values">
          {[
            {
              icon: HeartHandshake,
              title: "Listen first.",
              text: "Your story comes before a shortlist. We start with what matters to you, from a morning commute to a little more room for everyone.",
            },
            {
              icon: Compass,
              title: "Know the details.",
              text: "We bring a local eye to the search and help you ask the right questions about a home, a neighborhood, and the steps ahead.",
            },
            {
              icon: KeyRound,
              title: "Stay by your side.",
              text: "From the first viewing to your next decision, we help make the process easier to follow with clear next steps and a familiar person to turn to.",
            },
          ].map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="team-value-card">
              <div className="team-value-top">
                <span className="team-icon">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span>0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="team-faq" aria-labelledby="team-faq-title">
        <div>
          <p className="eyebrow">BEFORE WE SAY HELLO</p>
          <h2 id="team-faq-title">
            A few things
            <br />
            <em>you might wonder.</em>
          </h2>
          <p>
            No perfect brief needed. Just bring your questions and a sense of
            what comes next.
          </p>
        </div>
        <div className="team-faq-list">
          {[
            {
              question: "How do I choose the right advisor?",
              answer:
                "Start with the people above. Read their stories, explore the homes they represent, and see whose approach feels like a good fit. Their profile has a contact number and links to their current listings.",
            },
            {
              question: "Can you help me buy and sell?",
              answer:
                "You can explore homes with us and share your selling plans through the seller introduction form. Tell your advisor about both sides of your move so you can talk through your priorities and timing together.",
            },
            {
              question: "What happens after I get in touch?",
              answer:
                "Your inquiry goes to the advisor representing the home. Share a little about your plans or request a viewing, and the advisor can follow up to discuss the property and confirm availability. Viewing requests need the advisor’s confirmation.",
            },
            {
              question: "Can I start with a rental?",
              answer:
                "Of course. Our rental search has the same location, budget, and bedroom filters. Find a home you like and contact the advisor through the listing to ask questions or request a viewing.",
            },
          ].map(({ question, answer }) => (
            <details key={question} name="team-questions">
              <summary>
                {question}
                <ChevronDown size={19} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="team-cta" aria-labelledby="team-cta-title">
        <div>
          <p className="eyebrow">THE RIGHT PLACE. THE RIGHT PEOPLE.</p>
          <h2 id="team-cta-title">
            Your next chapter deserves
            <br />
            <em>good company.</em>
          </h2>
          <p>Let’s start with a conversation, and see where it takes you.</p>
        </div>
        <div className="team-cta-actions">
          <a href="#team-advisors" className="button button-paper">
            Meet your advisor <ArrowUpRight size={18} />
          </a>
          <Link href="/search" className="button button-outline">
            Explore homes <ArrowRight size={18} />
          </Link>
        </div>
      </section>
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
