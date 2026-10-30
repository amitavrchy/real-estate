"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { User } from "@/lib/types";
import { notify, session, useAppDispatch } from "@/store";

export function AuthPage({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const schema = z.object({
    name: register
      ? z.string().trim().min(2, "Please enter your full name.").max(100)
      : z.string().optional(),
    email: z.email("Please enter a valid email address."),
    password: z
      .string()
      .min(
        register ? 10 : 1,
        register
          ? "Choose a password with at least 10 characters."
          : "Please enter your password.",
      )
      .max(72, "Please keep your password under 73 characters.")
      .refine(value => new TextEncoder().encode(value).length <= 72,
        "Please use a shorter password when including emoji or other multi-byte characters."),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const next = params.get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : null;
  return (
    <div className="auth-layout">
      <div className="auth-image">
        <Image
          src="/images/interior-3.jpg"
          alt="A peaceful, light-filled home interior"
          fill
          priority
          sizes="50vw"
        />
        <div>
          <p className="eyebrow">A NEW CHAPTER STARTS HERE</p>
          <h2>
            A little closer
            <br />
            to <em>your own.</em>
          </h2>
          <p>
            Good homes. Good people.
            <br />
            Possibilities worth keeping close.
          </p>
        </div>
      </div>
      <div className="auth-panel">
        <p className="eyebrow">YOUR HAVEN</p>
        <h1>
          {register ? (
            <>
              Make room for
              <br />
              <em>what’s next.</em>
            </>
          ) : (
            <>
              Welcome
              <br />
              <em>home.</em>
            </>
          )}
        </h1>
        <p>
          {register
            ? "A place for your favorite homes and your next big idea."
            : "Your favorite places. Your next possibilities. All right here."}
        </p>
        <form
          className="form-stack"
          onSubmit={form.handleSubmit(async (values) => {
            setError("");
            try {
              const { data } = await api.post<{
                user: User;
                accessToken: string;
              }>(
                `/auth/${register ? "register" : "login"}`,
                register
                  ? values
                  : { email: values.email, password: values.password },
              );
              sessionStorage.setItem("haven-token", data.accessToken);
              dispatch(session(data.user));
              dispatch(
                notify(
                  register
                    ? "Welcome to Haven. Make yourself at home."
                    : `Good to see you, ${data.user.name.split(" ")[0]}.`,
                ),
              );
              router.replace(
                safeNext ??
                  (data.user.role === "BUYER" ? "/account" : "/dashboard"),
              );
            } catch (e) {
              setError(errorMessage(e));
            }
          })}
        >
          {register && (
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
          )}
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
          <label>
            Password
            <div className="password-wrap">
              <input
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <span className="form-error">
                {form.formState.errors.password.message}
              </span>
            )}
            {register && (
              <p className="field-hint">
                At least 10 characters. A phrase you’ll remember works
                beautifully.
              </p>
            )}
          </label>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Opening the door…"
              : register
                ? "Create your account"
                : "Come on in"}
            <ArrowUpRight size={18} />
          </button>
          {register && (
            <p className="form-note">
              By creating an account, you agree to our{" "}
              <Link className="text-link" href="/terms">
                terms
              </Link>{" "}
              and{" "}
              <Link className="text-link" href="/privacy">
                privacy policy
              </Link>
              .
            </p>
          )}
        </form>
        <p className="auth-switch">
          {register ? "Already found your way here?" : "New around here?"}
          <Link
            href={`/${register ? "login" : "register"}${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
          >
            {register ? "Sign in" : "Make yourself at home"}
          </Link>
        </p>
      </div>
    </div>
  );
}
