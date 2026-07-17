import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DemoStateProvider } from "@/state/demo-state";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ChoiceGrid",
    template: "%s · ChoiceGrid",
  },
  description:
    "Human-approved warehouse inventory allocation and disruption recovery for food banks.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoStateProvider>
          <AppShell>{children}</AppShell>
        </DemoStateProvider>
      </body>
    </html>
  );
}
