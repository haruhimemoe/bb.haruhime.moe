/**
 * @file src/lib/account.ts
 * @desc The browser side of the hub session, from @haruhimemoe/next-kit/auth-react: the shared
 *       `haruhime-signed-in` marker (the hub sets and clears it on .haruhime.moe; bb only reads
 *       it), and one page-wide account store with its hook and RestoreSignedIn. The store asks
 *       bb's GET /api/session only when the marker is there, once per page load, so anonymous
 *       visitors cost no request. "Sign in" goes through /signin, which sends the visitor straight
 *       to osu! by way of the hub's /api/signin/osu and back to this page. "Sign out" posts to
 *       bb's own /api/signout (its server ends the session on the hub and clears the cookies,
 *       src/lib/signout.ts) and reloads the page in place. A cross-origin POST from the browser
 *       to the hub isn't used: the hub sends no CORS headers.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

"use client";

import {
  type Account,
  type BoundAccountMenuProps,
  createAccountStore,
  createSignedInMarker,
  AccountMenu as KitAccountMenu,
  RestoreSignedIn as KitRestoreSignedIn,
  type SessionData,
  useAccount as useKitAccount,
} from "@haruhimemoe/next-kit/auth-react";
import { createElement, type ReactNode } from "react";
import { SIGNED_IN_COOKIE } from "@/constants/site";

export type { Account };

/** The marker cookie: `has(cookieHeader)` (bb never clears it: only the hub writes it). */
export const signedInMarker = createSignedInMarker(SIGNED_IN_COOKIE);

/**
 * @function fetchSession
 * @returns {Promise<SessionData | null>} who /api/session says is signed in, or null
 * @throws when bb can't be reached or answers an error (the store reads that as signed out)
 */
const fetchSession = async (): Promise<SessionData | null> => {
  const response = await fetch("/api/session", { cache: "no-store" });
  if (!response.ok) throw new Error(`session ${response.status}`);
  const body = (await response.json()) as { user: SessionData["user"] | null };
  return body.user ? { user: body.user } : null;
};

/** The page-wide account store. */
export const accountStore = createAccountStore({
  getSession: fetchSession,
  readCookie: () => document.cookie,
  hasMarker: signedInMarker.has,
  // The marker lives on .haruhime.moe and belongs to the hub: a stale one just costs a request.
  clearMarker: () => undefined,
});

/**
 * @function useAccount
 * @returns {Account} who is signed in: loading, signed-out, or signed-in with id, username and
 *          avatar
 */
export const useAccount = (): Account => useKitAccount(accountStore);

/**
 * @function signOut
 * @returns {Promise<never>} posts to /api/signout, then reloads this page signed out; never
 *          settles, so nothing shows signed out before the reload
 * @throws when bb answers an error (still signed in; the menu shows it failed)
 */
export const signOut = async (): Promise<never> => {
  const response = await fetch("/api/signout", { method: "POST", cache: "no-store" });
  if (!response.ok) throw new Error(`signout ${response.status}`);
  window.location.reload();
  return new Promise<never>(() => undefined);
};

/**
 * @function RestoreSignedIn
 * @param props {{ next?: string; pending?: ReactNode }} where to go on once the session is read
 * @returns {ReactNode} next-kit's RestoreSignedIn bound to bb's store and the shared marker
 */
export const RestoreSignedIn = (props: { next?: string; pending?: ReactNode }): ReactNode =>
  createElement(KitRestoreSignedIn, {
    ...props,
    store: accountStore,
    hasMarker: signedInMarker.has,
  });

/**
 * @function AccountMenu
 * @param props {BoundAccountMenuProps} the menu's links and words
 * @returns {ReactNode} the header's account area: sign in (through /signin to the hub), or the
 *          avatar menu with `items` and Sign out
 */
export const AccountMenu = (props: BoundAccountMenuProps): ReactNode =>
  createElement(KitAccountMenu, {
    ...props,
    account: useAccount(),
    signOut,
    onSignedOut: () => undefined,
  });
