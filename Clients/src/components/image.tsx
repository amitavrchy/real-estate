"use client";
import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

export default function Image(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  const source = failed ? "/image-placeholder.svg" : props.src;
  const remote =
    typeof source === "string" &&
    source.startsWith("https://") &&
    new URL(source).hostname !== "images.unsplash.com";
  return (
    <NextImage
      {...props}
      src={source}
      alt={failed ? "Photography unavailable" : props.alt}
      unoptimized={props.unoptimized || remote}
      onError={(event) => {
        setFailed(true);
        props.onError?.(event);
      }}
    />
  );
}
