"use client";

import { useEffect, useRef, useState } from "react";
import { loadCommunityVideo } from "@/lib/community-video";

export function FlashVideo({ videoId, caption, className }: { videoId: string; caption: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setSource("");
    setError("");
    setAutoplayBlocked(false);
    void loadCommunityVideo(videoId)
      .then((blob) => {
        if (!blob) throw new Error("This Flash is not available in this browser.");
        objectUrl = URL.createObjectURL(blob);
        if (active) setSource(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load this Flash.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        void video.play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => setAutoplayBlocked(true));
      } else {
        video.pause();
      }
    }, { threshold: 0.6 });
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [source]);

  if (error) {
    return <p role="alert" className="bg-panel p-6 text-sm text-mist">{error}</p>;
  }
  if (!source) {
    return <div aria-busy="true" className={`grid min-h-48 place-items-center bg-panel text-sm text-mute ${className ?? ""}`}>Loading Flash…</div>;
  }

  return (
    <div>
      <video
        ref={videoRef}
        src={source}
        aria-label={`Flash: ${caption}`}
        controls
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
      />
      {autoplayBlocked ? <p className="px-4 py-2 text-xs text-mute">Autoplay was blocked. Use the video controls to play this Flash.</p> : null}
    </div>
  );
}
