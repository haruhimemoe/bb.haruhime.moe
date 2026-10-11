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
 * @modified Sun Oct 11, 2026
 */

import { osuAvatarSrc } from "@haruhimemoe/next-kit/auth-react";
import { userUrl } from "@haruhimemoe/osu/shapes";
import { ButtonLink, Card, PageHeader, TextLink } from "@haruhimemoe/ui";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ApiKeySection } from "@/components/account/ApiKeySection";
import { DeleteBbDataForm } from "@/components/account/DeleteBbDataForm";
import { HUB_ACCOUNT_URL } from "@/constants/site";
import { RestoreSignedIn } from "@/lib/account";
import { apiKeys } from "@/lib/api-keys";
import { requireUser } from "@/lib/auth-session";
import { listMyTemplates } from "@/services/templates-read";

/** The account page's title; it's never indexed. */
export const metadata: Metadata = { title: "bb settings", robots: { index: false } };

/**
 * @function AccountPage
 * @returns {Promise<JSX.Element>} the signed-in user's osu! account, the API key card and the
 *          delete-my-bb-data form (a visitor goes to sign in)
 */
export default async function AccountPage() {
  const t = await getTranslations("bb.account");
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
        title={t("title")}
        actions={
          <>
            {user.isAdmin ? (
              <ButtonLink href="/admin" variant="secondary">
                {t("admin")}
              </ButtonLink>
            ) : null}
            <ButtonLink href="/me" variant="secondary">
              {t("myTemplates")}
            </ButtonLink>
          </>
        }
      />
      <Card title={t("osuAccount")}>
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image src={avatar} alt="" width={48} height={48} className="rounded-full" />
          ) : null}
          <TextLink href={userUrl(user.osuId)} rel="noopener" variant="plain" className="text-lg">
            {user.username}
          </TextLink>
        </div>
        <p className="mt-3 text-c3 text-sm">
          {t.rich("hubNote", {
            link: (chunks) => <TextLink href={HUB_ACCOUNT_URL}>{chunks}</TextLink>,
          })}
        </p>
      </Card>
      <ApiKeySection initial={apiKey} />
      <Card title={t("deleteTitle")}>
        <DeleteBbDataForm
          username={user.username}
          deletes={t("deletes", { count: templates.length })}
        />
      </Card>
    </div>
  );
}
