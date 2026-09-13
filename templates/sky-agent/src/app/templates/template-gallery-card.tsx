"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface TemplateGalleryCardProps {
  description: string;
  name: string;
  previewImage: string;
  previewVideo: string;
}

export function TemplateGalleryCard({
  description,
  name,
  previewImage,
  previewVideo,
}: TemplateGalleryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(false);
  const [videoVisible, setVideoVisible] = useState(false);

  const playPreview = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const video = videoRef.current;
    if (!video) return;

    activeRef.current = true;
    const playback = video.play();
    if (!playback) return;

    playback
      .then(() => {
        if (activeRef.current) setVideoVisible(true);
      })
      .catch(() => {
        activeRef.current = false;
        setVideoVisible(false);
      });
  }, []);

  const stopPreview = useCallback(() => {
    activeRef.current = false;
    setVideoVisible(false);

    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }, []);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#121212]">
      <div
        className="relative aspect-[36/25] w-full bg-[#0b0b0b]"
        onBlur={stopPreview}
        onFocus={playPreview}
        onMouseEnter={playPreview}
        onMouseLeave={stopPreview}
        tabIndex={0}
      >
        <Image
          alt={`${name} template preview`}
          className="object-contain"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 480px"
          src={previewImage}
        />
        <video
          ref={videoRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ${
            videoVisible ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="metadata"
          src={previewVideo}
        />
      </div>
      <div className="space-y-2 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-[#f7f7f2]">{name}</h2>
        <p className="text-sm leading-relaxed text-[#a8a89e]">{description}</p>
      </div>
    </article>
  );
}
