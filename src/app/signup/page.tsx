"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";

const schema = z
  .object({
    name: z.string().min(2, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don’t match",
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // When email confirmation is enabled in Supabase, signup returns
  // success but the session isn't created until the user clicks the
  // emailed link. We surface that state so they don't think it failed.
  const [confirmEmailSent, setConfirmEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setConfirmEmailSent(null);

    if (!values.email.toLowerCase().endsWith("@4brains.in")) {
      setServerError("Sign up with your @4brains.in email only.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Stored on auth.users — used by the profile-trigger to populate
        // the public.profiles row. Falls back to email if missing.
        data: { name: values.name },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // Two outcomes:
    //   - Email confirmations ON  → data.session is null, user must click
    //     the link in their inbox before signing in.
    //   - Email confirmations OFF → session is live, redirect to dashboard.
    if (!data.session) {
      setConfirmEmailSent(values.email);
      return;
    }
    router.push("/");
    router.refresh();
  };

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

          {confirmEmailSent ? (
            // Post-signup success state when email confirmation is on.
            <div className="space-y-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">
                Check your inbox
              </div>
              <h1 className="h-display-sm text-ink">
                Almost{" "}
                <span className="italic text-primary">there.</span>
              </h1>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">
                We sent a confirmation link to{" "}
                <span className="font-medium text-ink">{confirmEmailSent}</span>
                . Click it, then come back here and sign in.
              </p>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-white shadow-glow-primary transition-all hover:-translate-y-px hover:bg-primary-hover"
              >
                Go to sign in →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">
                Join the team
              </div>
              <h1 className="h-display-sm mb-2 text-ink">
                Create an{" "}
                <span className="italic text-primary">account.</span>
              </h1>
              <p className="mb-7 text-[13px] text-ink-soft">
                Only @4brains.in emails can sign up.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Aditi Rao"
                    {...register("name")}
                    className={inputClass}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
                  >
                    Work email
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
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    {...register("password")}
                    className={inputClass}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft/80"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirm")}
                    className={inputClass}
                  />
                  {errors.confirm && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.confirm.message}
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
                  {isSubmitting ? "Creating…" : "Create account"}
                </button>
              </form>

              <p className="mt-6 border-t border-black/[0.06] pt-5 text-center text-[12.5px] text-ink-soft">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
