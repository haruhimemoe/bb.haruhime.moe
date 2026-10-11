/**
 * @file src/app/layout.tsx
 * @desc Root layout: Nunito font variable, site metadata, dark osu!-web body, the library
 *       PageShell frame around the bb header and footer, the command palette (mounted once so
 *       its Ctrl K / Cmd K hotkey works from any page), and @haruhimemoe/bbcode's stylesheet for
 *       every preview (loaded once, here).
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

import { pwaMetadata, pwaViewport, ServiceWorkerRegister } from "@haruhimemoe/next-kit/pwa";
import { siteMetadata } from "@haruhimemoe/next-kit/seo";
import { PageShell } from "@haruhimemoe/ui";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { AppPalette } from "@/components/layout/AppPalette";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PWA } from "@/constants/pwa";
import { SEO_SITE } from "@/constants/seo";
import "@haruhimemoe/bbcode/styles.css";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

/** The site's default title and "%s · bb.haruhime.moe" template, description and link preview. */
export const metadata: Metadata = { ...siteMetadata(SEO_SITE), ...pwaMetadata(PWA) };

/** The page color as the browser's theme color, the app's color scheme, zoom left on. */
export const viewport: Viewport = pwaViewport(PWA);

/**
 * @function RootLayout
 * @param props {{ children: ReactNode }} the page
 * @returns {Promise<JSX.Element>} the html frame: header, the page and the footer
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const ui = await getTranslations("ui");
  return (
    <html lang={locale} className={nunito.variable}>
      <body className="bg-b5 font-sans text-c2 antialiased">
        <NextIntlClientProvider>
          <AppPalette />
          <PageShell header={<Header />} footer={<Footer />} skipLabel={ui("shell.skip")}>
            {children}
          </PageShell>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
