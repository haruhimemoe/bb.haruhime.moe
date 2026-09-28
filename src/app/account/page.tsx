/**
 * @file src/app/account/page.tsx
 * @desc /account: the signed-in user's osu! name and avatar (linking their osu! profile), sign
 *       out, a link to /admin for admins, a link to their templates, and "Delete my account"
 *       with the typed-username confirmation. Sign-in otherwise; never indexed. Restores the
 *       header's signed-in marker for a session that has none.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

import { userUrl } from "@haruhimemoe/osu/shapes";
import { ButtonLink, Card, PageHeader } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import Image from "next/image";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { RestoreSignedIn } from "@/lib/account";
import { requireUser } from "@/lib/auth-session";
import { listMyTemplates } from "@/services/templates-read";
import { avatarSrc } from "@/utils/avatar";

/** The account page's title; it's never indexed. */
export const metadata: Metadata = { title: "Account", robots: { index: false } };

/**
 * @function AccountPage
 * @returns {Promise<JSX.Element>} the signed-in user's osu! account and the delete form (a
 *          visitor goes to sign in)
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  const avatar = avatarSrc(user.avatarUrl);
  const templates = await listMyTemplates(user.osuId);
  return (
    <div className="flex flex-col gap-6">
      <RestoreSignedIn />
      <PageHeader
        title="Account"
        actions={
          <>
            {user.isAdmin ? (
              <ButtonLink href="/admin" variant="secondary">
                Admin
              </ButtonLink>
            ) : null}
            <ButtonLink href="/me" variant="secondary">
              My templates
            </ButtonLink>
            <SignOutButton />
          </>
        }
      />
      <Card title="Your osu! account">
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image src={avatar} alt="" width={48} height={48} className="rounded-full" />
          ) : null}
          <a
            href={userUrl(user.osuId)}
            rel="noopener"
            className="font-bold text-c1 text-lg underline-offset-2 hover:underline"
          >
            {user.username}
          </a>
        </div>
      </Card>
      <Card title="Delete my account">
        <DeleteAccountForm username={user.username} templateCount={templates.length} />
      </Card>
    </div>
  );
}
