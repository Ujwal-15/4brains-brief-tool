"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

// Wrapping the form in <Suspense> is required by Next.js when a client
// component reads useSearchParams() — without it the static-prerender
// step at build time bails because params can only be resolved at request
// time.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <BackgroundBlobs />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const reason = searchParams.get("reason");
  const [serverError, setServerError] = useState<string | null>(
    // If middleware bounced a non-@4brains.in user back here, surface why.
    reason === "domain"
      ? "Only @4brains.in accounts can use this tool."
      : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    if (!values.email.toLowerCase().endsWith("@4brains.in")) {
      setServerError("Sign in with your @4brains.in email.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "Invalid email or password"
          : error.message,
      );
      return;
    }
    router.push(next);
    router.refresh();
  };

  // Auth card sits on a LIGHT cream surface in both themes, so eyebrow
  // and meta text need a fixed dark color (text-ink-soft) — the global
  // .eyebrow class flips to champagne in dark mode for navy chrome,
  // which would be invisible on this light card.
  const inputClass =
    "w-full rounded-lg border border-black/[0.08] bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-shadow placeholder:text-ink-soft/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <BackgroundBlobs />
      <div className="relative w-full max-w-sm overflow-hidden rounded-hero bg-surface p-8 shadow-elevated sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-primary-glow"
        />
        <div className="relative">
          <div className="mb-7 flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-support shadow-glow-primary"
            >
              <span className="font-display text-[15px] italic leading-none text-white">
                4
              </span>
            </span>
            <span className="text-[13px] font-medium tracking-tight text-ink">
              4Brains
              <span className="ml-1.5 text-ink-soft">Brief Tool</span>
            </span>
          </div>

          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">
            Welcome back
          </div>
          <h1 className="h-display-sm mb-2 text-ink">
            Sign <span className="italic text-primary">in.</span>
          </h1>
          <p className="mb-7 text-[13px] text-ink-soft">
            Use your @4brains.in email and password.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@4brains.in"
                {...register("email")}
                className={inputClass}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={inputClass}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-xs text-red-600">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-full bg-primary px-3 py-2.5 text-[13.5px] font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 border-t border-black/[0.06] pt-5 text-center text-[12px] leading-relaxed text-ink-soft">
            Accounts are pre-created for the 4Brains team.
            <br />
            Ask Ujwal if you don’t have access yet.
          </p>
        </div>
      </div>
    </div>
  );
}
