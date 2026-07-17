import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Martian_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { DemoStateProvider } from "@/state/demo-state";
import "./globals.css";

// Prose and dense UI. A technical grotesk with tighter apertures than the
// system stack, which keeps 14px table text legible without reading as chrome.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

// Figures, unit labels, and identifiers only. Martian Mono is drawn for
// technical readouts, so it carries the instrument voice where the numbers are.
// It is too wide for running prose — do not set body copy in it.
const martianMono = Martian_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Almanac",
    template: "%s · Almanac",
  },
  description:
    "Human-approved warehouse inventory allocation and disruption recovery for food banks.",
  applicationName: "Almanac",
  openGraph: {
    title: "Almanac",
    description:
      "Human-approved warehouse inventory allocation and disruption recovery for food banks.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c2830",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${martianMono.variable}`}>
      <body>
        <DemoStateProvider>
          <AppShell>{children}</AppShell>
        </DemoStateProvider>
      </body>
    </html>
  );
}
