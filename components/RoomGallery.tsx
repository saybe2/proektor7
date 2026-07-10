"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { IconProjector } from "@/components/icons";

type Props = {
  images: string[];
  roomName: string;
};

export default function RoomGallery({ images, roomName }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  function showImage(index: number) {
    const next = (index + images.length) % images.length;
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
    setCurrent(next);
  }

  function syncCurrentImage() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-[#d9ddf2] flex items-center justify-center">
        <IconProjector className="w-16 h-16 text-brand/40" />
      </div>
    );
  }

  return (
    <div className="room-gallery relative bg-[#d9ddf2]">
      <div
        ref={trackRef}
        onScroll={syncCurrentImage}
        className="room-gallery-track flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        aria-label={`Фотографии: ${roomName}`}
      >
        {images.map((src, index) => (
          <div key={src} className="relative aspect-[4/3] min-w-full snap-center">
            <Image
              src={src}
              alt={`${roomName}, фотография ${index + 1} из ${images.length}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => showImage(current - 1)}
            className="gallery-arrow left-3"
            aria-label="Предыдущая фотография"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => showImage(current + 1)}
            className="gallery-arrow right-3"
            aria-label="Следующая фотография"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#111118]/75 px-3 py-2" aria-label={`Фотография ${current + 1} из ${images.length}`}>
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => showImage(index)}
                className={`h-1.5 transition-all ${current === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                aria-label={`Показать фотографию ${index + 1}`}
                aria-current={current === index ? "true" : undefined}
              />
            ))}
          </div>

          <div className="absolute top-3 right-3 bg-[#111118] text-white px-2.5 py-1 text-xs font-black tabular-nums">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
