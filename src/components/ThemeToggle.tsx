"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(theme);
  html.dataset.theme = theme;
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // ignore quota / private mode
  }
}

// Pill-style switch with sun on the left, moon on the right. Click flips
// the theme; persists to localStorage; no flash on next page load thanks
// to the bootstrap script in app/layout.tsx.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  // Render a stable shell server-side so hydration matches; the actual
  // active state populates after mount.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggle}
      className="relative inline-flex h-7 w-[58px] shrink-0 items-center rounded-full border border-ink-on-page/15 bg-ink-on-page/5 px-1 transition-colors hover:bg-ink-on-page/10"
    >
      {/* Sun icon */}
      <span
        aria-hidden
        className={`relative z-10 flex h-5 w-5 items-center justify-center text-[11px] transition-colors ${
          mounted && theme === "light" ? "text-ink" : "text-ink-on-page/45"
        }`}
      >
        ☀
      </span>
      {/* Moon icon */}
      <span
        aria-hidden
        className={`relative z-10 ml-auto flex h-5 w-5 items-center justify-center text-[11px] transition-colors ${
          mounted && theme === "dark" ? "text-ink" : "text-ink-on-page/45"
        }`}
      >
        ☾
      </span>
      {/* Sliding thumb */}
      <span
        aria-hidden
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-surface shadow-soft transition-transform duration-200 ${
          mounted && theme === "dark" ? "translate-x-[28px]" : "translate-x-[1px]"
        }`}
      />
    </button>
  );
}
