"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { api, errorMessage, money } from "@/lib/api";
import { useAppSelector } from "@/store";
import { Reveal } from "./ui";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  address: z
    .string()
    .trim()
    .min(5, "Please enter the property address.")
    .max(300),
  sqft: z
    .number()
    .int()
    .min(100, "Enter at least 100 square feet.")
    .max(100000),
  phone: z.string().max(30).optional(),
});
type Values = z.infer<typeof schema>;
export function SellPage({ valuation = false }: { valuation?: boolean }) {
  const user = useAppSelector((s) => s.auth.user);
  const [result, setResult] = useState<{ low: number; high: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });
  return (
    <div className="container sell-layout">
      <Reveal className="sell-copy">
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS AT HOME</p>
        <h1>
          {valuation ? (
            <>
              Every home
              <br />
              has a <em>story.</em>
            </>
          ) : (
            <>
              Good things
              <br />
              are <em>ahead.</em>
            </>
          )}
        </h1>
        <p>
          {valuation
            ? "Discover what yours might be worth. A thoughtful starting point for whatever comes next."
            : "Moving on is a meaningful moment. With local expertise, beautiful presentation, and a deeply personal approach, we’ll make your next move feel right."}
        </p>
        <div className="sell-promises">
          <span>
            <Check size={18} />
            Local knowledge, considered advice
          </span>
          <span>
            <Check size={18} />
            Photography that tells your home’s story
          </span>
          <span>
            <Check size={18} />A dedicated advisor from start to finish
          </span>
        </div>
        <div className="sell-image">
          <Image
            src="/images/interior-1.jpg"
            alt="A beautifully presented residence with considered details"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </Reveal>
      <div className="sell-form">
        {result ? (
          <div className="valuation-result" role="status">
            <span className="pill pill-green">
              <Check size={15} />
              Your next chapter is taking shape
            </span>
            <h2>
              A little perspective
              <br />
              on <em>your place.</em>
            </h2>
            <p className="form-note">Illustrative estimated value range</p>
            <h3>
              {money(result.low, true)} — {money(result.high, true)}
            </h3>
            <p className="form-note">
              Your details and estimate have been saved for the Haven team. An
              advisor can help you understand the details that make your home
              unique.
            </p>
            <p className="valuation-disclaimer">
              This is a demo estimate based only on square footage ($740–$980 /
              sq ft). It is not an appraisal, market valuation, or offer. A
              local assessment is needed for accurate pricing.
            </p>
            <Link href="/agents" className="button">
              Get a personal perspective
              <ArrowUpRight size={18} />
            </Link>
            <button className="subtle-button" onClick={() => setResult(null)}>
              Explore another property
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <h2>
              What’s your home’s
              <br />
              <em>next possibility?</em>
            </h2>
            <p>A few details. A fresh perspective. No obligation.</p>
            <form
              className="form-stack"
              onSubmit={form.handleSubmit(async (values) => {
                setError("");
                try {
                  const { data } = await api.post<{
                    low: number;
                    high: number;
                  }>("/valuation", values);
                  setResult(data);
                } catch (e) {
                  setError(errorMessage(e));
                }
              })}
            >
              <label>
                Property address
                <input
                  autoComplete="street-address"
                  placeholder="Where does your story begin?"
                  {...form.register("address")}
                  aria-invalid={!!form.formState.errors.address}
                />
                {form.formState.errors.address && (
                  <p className="form-error">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </label>
              <label>
                Approximate living area (sq ft)
                <input
                  type="number"
                  min="100"
                  max="100000"
                  placeholder="e.g. 2,400"
                  {...form.register("sqft", { valueAsNumber: true })}
                  aria-invalid={!!form.formState.errors.sqft}
                />
                {form.formState.errors.sqft && (
                  <p className="form-error">
                    Please enter a living area between 100 and 100,000 sq ft.
                  </p>
                )}
              </label>
              <div className="form-grid">
                <label>
                  Your name
                  <input
                    autoComplete="name"
                    {...form.register("name")}
                    aria-invalid={!!form.formState.errors.name}
                  />
                  {form.formState.errors.name && (
                    <p className="form-error">
                      {form.formState.errors.name.message}
                    </p>
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
                    <p className="form-error">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </label>
              </div>
              <label>
                Phone <span className="form-note">(optional)</span>
                <input
                  autoComplete="tel"
                  type="tel"
                  {...form.register("phone")}
                />
              </label>
              {error && (
                <p className="form-alert" role="alert">
                  {error}
                </p>
              )}
              <button className="button" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Considering the possibilities…"
                  : "Discover your home’s potential"}
                <ArrowUpRight size={18} />
              </button>
              <p className="form-note">
                Your information stays with us. By continuing, you agree to our{" "}
                <Link href="/privacy" className="text-link">
                  privacy policy
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
