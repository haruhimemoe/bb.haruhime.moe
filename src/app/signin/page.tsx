/**
 * @file src/app/signin/page.tsx
 * @desc /signin?next=: sign-in lives on haruhime.moe, so this only sends the visitor to the hub's
 *       sign-in page, coming back to `next` (a safe bb path, /me otherwise) on bb. Kept so every
 *       "Sign in" link (the header, the command palette, old bookmarks) can stay a plain bb path
 *       while the hub's address comes from HUB_URL on the server.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hubSignInHref } from "@/lib/auth-session";

/** /signin's title; it's never indexed. */
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/**
 * @function SignInPage
 * @param props {PageProps<"/signin">} `next`
 * @returns {Promise<never>} a redirect to the hub's sign-in
 */
export default async function SignInPage({ searchParams }: PageProps<"/signin">): Promise<never> {
  const { next } = await searchParams;
  redirect(hubSignInHref(typeof next === "string" ? next : null));
}
