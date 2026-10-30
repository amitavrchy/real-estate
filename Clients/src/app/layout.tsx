import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header, Footer, CommandPalette } from "@/components/layout";
import { Toast } from "@/components/ui";

const sans = localFont({ src: [
  { path: '../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', weight: '400' },
  { path: '../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', weight: '500' },
  { path: '../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', weight: '600' },
], variable: '--font-body', display: 'swap', fallback: ['Arial'], adjustFontFallback: 'Arial' });
const serif = localFont({ src: [
  { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
  { path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
], variable: '--font-display', display: 'swap', fallback: ['Georgia'], adjustFontFallback: 'Times New Roman' });
const mono = localFont({ src: '../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', variable: '--font-data', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
  ),
  title: {
    default: "Haven — A place to call your own.",
    template: "%s | Haven",
  },
  description:
    "Extraordinary homes. A more personal approach. Discover thoughtfully selected residences and exceptional property advisors across the San Francisco Bay Area.",
  openGraph: {
    title: "Haven — A place to call your own.",
    description:
      "Find a home that feels inevitable. Discover exceptional Bay Area residences with Haven.",
    images: ["/images/hero.jpg"],
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CommandPalette />
          <Toast />
        </Providers>
      </body>
    </html>
  );
}
