"use client";
import Link from "@/components/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { api, errorMessage, get } from "@/lib/api";
import { notify, useAppDispatch, useAppSelector } from "@/store";
import { ErrorState, Loading } from "./ui";

type Review = {
  id: string;
  rating: number;
  body: string;
  author: { name: string };
  createdAt: string;
};
export function Reviews({ agentId }: { agentId: string }) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const reviews = useQuery({
    queryKey: ["reviews", agentId],
    queryFn: () => get<Review[]>(`/agents/${agentId}/reviews`),
  });
  return (
    <section className="reviews-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE PEOPLE BEHIND THE POSSIBILITIES</p>
          <h2>
            A personal <em>perspective.</em>
          </h2>
        </div>
        {!!reviews.data?.length && (
          <span className="pill">
            <Star size={16} />
            {(
              reviews.data.reduce((sum, r) => sum + r.rating, 0) /
              reviews.data.length
            ).toFixed(1)}{" "}
            · {reviews.data.length}{" "}
            {reviews.data.length === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>
      <div className="reviews-layout">
        <div>
          {reviews.isLoading ? (
            <Loading label="Opening the conversation…" />
          ) : reviews.isError ? (
            <ErrorState retry={() => reviews.refetch()} />
          ) : reviews.data?.length ? (
            reviews.data.map((r) => (
              <div className="review-card" key={r.id}>
                <div
                  aria-label={`${r.rating} out of 5 stars`}
                  className="review-stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={17}
                      fill={i < r.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p>{r.body}</p>
                <div>
                  <strong>{r.author.name}</strong>
                  <span>
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="review-card">
              <h3>Every conversation matters.</h3>
              <p>
                No client reviews yet. Worked with this advisor? Your
                perspective could help someone find their way home.
              </p>
            </div>
          )}
        </div>
        <div className="review-form">
          {user?.role === "BUYER" ? (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                const body = String(new FormData(target).get("body")).trim();
                setBusy(true);
                try {
                  await api.post(`/agents/${agentId}/reviews`, {
                    rating,
                    body,
                  });
                  await reviews.refetch();
                  target.reset();
                  dispatch(notify("Thank you for sharing your perspective."));
                } catch (e) {
                  dispatch(notify(errorMessage(e)));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h3>Your experience. Your words.</h3>
              <label>
                Your rating
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "star" : "stars"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                A personal perspective
                <textarea
                  name="body"
                  minLength={10}
                  maxLength={2000}
                  required
                  placeholder="What was it like to work together?"
                />
              </label>
              <p className="form-note">
                Your name will appear with your review. Submitting again updates
                your existing review.
              </p>
              <button className="button" disabled={busy}>
                Share your experience
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <>
              <h3>Have a story to share?</h3>
              <p className="form-note">
                Buyer accounts can share a review of their experience with this
                advisor.
              </p>
              {!user && (
                <Link
                  href={`/login?next=${encodeURIComponent(`/agents/${agentId}`)}`}
                  className="arrow-link"
                >
                  Sign in to share
                  <ArrowRight size={18} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
