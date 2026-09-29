/**
 * @file src/app/layout.tsx
 * @desc Root layout: Nunito font variable, site metadata, dark osu!-web body, the library
 *       PageShell frame around the bb header and footer, and @haruhimemoe/bbcode's stylesheet for
 *       every preview (loaded once, here).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { siteMetadata } from "@haruhimemoe/next-kit/seo";
import { PageShell } from "@haruhimemoe/ui";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SEO_SITE } from "@/constants/seo";
import "@haruhimemoe/bbcode/styles.css";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

/** The site's default title and "%s · bb.haruhime.moe" template, description and link preview. */
export const metadata = siteMetadata(SEO_SITE);

/**
 * @function RootLayout
 * @param props {{ children: ReactNode }} the page
 * @returns {JSX.Element} the html frame: header, the page and the footer
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="bg-b5 font-sans text-c2 antialiased">
        <PageShell header={<Header />} footer={<Footer />}>
          {children}
        </PageShell>
      </body>
    </html>
  );
}
