import type { Metadata } from "next";
import { AppProviders } from "../src/providers/app-providers";
import { withBasePath } from "../src/lib/routing/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "AB Ignite",
  description: "Ideas that light the way",
  icons: { icon: withBasePath("/favicon.svg") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
