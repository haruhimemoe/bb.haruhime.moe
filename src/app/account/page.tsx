/**
 * @file src/app/account/page.tsx
 * @desc /account, bb's own settings: the signed-in user's osu! name and avatar (linking their
 *       osu! profile), a link to /admin for admins, a link to their templates, the API key card,
 *       and "Delete my bb data" with the typed-username confirmation. The haruhime account
 *       itself (sessions, deleting it) lives on haruhime.moe/account: this card's one link to it
 *       is the only one on bb.
 *       Sign-in otherwise; never indexed. Catches the header up when its store missed the
 *       session.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Tue Oct 6, 2026
 */

import { osuAvatarSrc } from "@haruhimemoe/next-kit/auth-react";
import { userUrl } from "@haruhimemoe/osu/shapes";
import { ButtonLink, Card, PageHeader, TextLink } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import Image from "next/image";
import { ApiKeySection } from "@/components/account/ApiKeySection";
import { DeleteBbDataForm } from "@/components/account/DeleteBbDataForm";
import { HUB_ACCOUNT_URL } from "@/constants/site";
import { RestoreSignedIn } from "@/lib/account";
import { apiKeys } from "@/lib/api-keys";
import { requireUser } from "@/lib/auth-session";
import { listMyTemplates } from "@/services/templates-read";
import { deletesSentence } from "@/utils/account-copy";

/** The account page's title; it's never indexed. */
export const metadata: Metadata = { title: "bb settings", robots: { index: false } };

/**
 * @function AccountPage
 * @returns {Promise<JSX.Element>} the signed-in user's osu! account, the API key card and the
 *          delete-my-bb-data form (a visitor goes to sign in)
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  const avatar = osuAvatarSrc(user.avatarUrl);
  const [templates, apiKey] = await Promise.all([
    listMyTemplates(user.osuId),
    apiKeys.info(user.id),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <RestoreSignedIn />
      <PageHeader
        title="bb settings"
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
          </>
        }
      />
      <Card title="Your osu! account">
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image src={avatar} alt="" width={48} height={48} className="rounded-full" />
          ) : null}
          <TextLink href={userUrl(user.osuId)} rel="noopener" variant="plain" className="text-lg">
            {user.username}
          </TextLink>
        </div>
        <p className="mt-3 text-c3 text-sm">
          Your devices and deleting your haruhime account are on{" "}
          <TextLink href={HUB_ACCOUNT_URL}>haruhime.moe/account</TextLink>.
        </p>
      </Card>
      <ApiKeySection initial={apiKey} />
      <Card title="Delete my bb data">
        <DeleteBbDataForm username={user.username} deletes={deletesSentence(templates.length)} />
      </Card>
    </div>
  );
}
