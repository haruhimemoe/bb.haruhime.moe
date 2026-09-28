/**
 * @file src/components/collab/ImageUrlForm.tsx
 * @desc The collab maker's image URL: http or https only (anything else is refused with a
 *       message), loaded on submit. An http image gets a note that this page can't show it.
 * @author David @dvhsh (https://dvh.sh)
 * @created Mon Sep 28, 2026
 * @modified Mon Sep 28, 2026
 */

"use client";

import { Button, Notice, TextInput } from "@haruhimemoe/ui";
import { type FormEvent, useState } from "react";
import { HTTP_IMAGE } from "@/constants/collab";
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
  const [error, setError] = useState<string | undefined>();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageUrlKind(text)) {
      setError("Use an http:// or https:// link to the image, without spaces.");
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
          label="Image URL"
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
        <Button type="submit">Load image</Button>
      </div>
      {imageUrlKind(image) === "http" ? <Notice tone="warning">{HTTP_IMAGE}</Notice> : null}
    </form>
  );
}
