/**
 * @file src/components/collab/ImageUrlForm.tsx
 * @desc The collab maker's image URL: http or https only (anything else is refused with a
 *       message), loaded on submit. An http image gets a note that this page can't show it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Sun Oct 11, 2026
 */

"use client";

import { Button, Notice, TextInput } from "@haruhimemoe/ui";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { imageUrlKind } from "@/utils/collab";

type ImageUrlFormProps = {
  image: string;
  onImage: (image: string) => void;
};

/**
 * @function ImageUrlForm
 * @param props {ImageUrlFormProps} the current image URL and its change handler
 * @returns {JSX.Element} the URL field, Load and any message
 */
export function ImageUrlForm({ image, onImage }: ImageUrlFormProps) {
  const [text, setText] = useState(image);
  const t = useTranslations("bb.collab");
  const [error, setError] = useState<string | undefined>();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageUrlKind(text)) {
      setError(t("badUrl"));
      return;
    }
    setError(undefined);
    onImage(text.trim());
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <TextInput
          id="collab-image"
          label={t("imageUrl")}
          type="url"
          inputMode="url"
          placeholder="https://i.imgur.com/example.png"
          value={text}
          error={error}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
          wrapperClassName="min-w-0 flex-1 basis-64"
        />
        <Button type="submit">{t("load")}</Button>
      </div>
      {imageUrlKind(image) === "http" ? <Notice tone="warning">{t("httpImage")}</Notice> : null}
    </form>
  );
}
