"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Photo } from "@/components/ui";
import { MAX_FLASH_DURATION_SECONDS, readVideoDuration } from "@/lib/community-video";
import { readImageFile } from "@/lib/files";

export interface CommunityMediaSelection {
  image: string;
  video: File | null;
}

export function CommunityMediaInput({
  value,
  onChange,
}: {
  value: CommunityMediaSelection;
  onChange: (selection: CommunityMediaSelection) => void;
}) {
  const [videoPreview, setVideoPreview] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value.video) {
      setVideoPreview("");
      return;
    }
    const url = URL.createObjectURL(value.video);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.video]);

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      if (file.type.startsWith("image/")) {
        const image = await readImageFile(file, 900);
        onChange({ image, video: null });
      } else {
        const duration = await readVideoDuration(file);
        if (duration > MAX_FLASH_DURATION_SECONDS) {
          throw new Error(`Flashes must be ${MAX_FLASH_DURATION_SECONDS} seconds or shorter.`);
        }
        onChange({ image: "", video: file });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read that media file.");
    } finally {
      setProcessing(false);
    }
  }

  function removeMedia() {
    setError("");
    onChange({ image: "", video: null });
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        aria-label="Choose a photo or Flash video"
        disabled={processing}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          void chooseFile(file);
        }}
      />
      {processing ? <p className="text-xs text-mute">Preparing media…</p> : null}
      {value.image ? <Photo src={value.image} alt="Community post preview" className="max-h-96 w-full object-contain" /> : null}
      {value.video && videoPreview ? (
        <video src={videoPreview} controls muted playsInline preload="metadata" className="max-h-96 w-full bg-black object-contain" />
      ) : null}
      {value.image || value.video ? (
        <Button type="button" variant="secondary" onClick={removeMedia}>Remove media</Button>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <p className="text-xs text-mute">Photos or MP4/WebM Flashes up to 60 seconds. Videos stay in this browser for the demo.</p>
    </div>
  );
}
