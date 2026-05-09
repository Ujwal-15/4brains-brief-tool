import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Body / UI face — Inter (≈ Helvetica Now).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Editorial serif for hero italic accents and section numerals.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "4Brains Brief Tool",
  description: "Internal project brief tool for 4Brains Technologies",
};

// Inline script that runs BEFORE first paint to set the right theme class
// on <html> based on saved preference. Prevents FOUC (light flash on dark
// boot, or vice versa). Default theme is dark.
const themeBootstrap = `
  (function () {
    try {
      var saved = localStorage.getItem('theme');
      var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
      var html = document.documentElement;
      html.classList.remove('light', 'dark');
      html.classList.add(theme);
      html.dataset.theme = theme;
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
