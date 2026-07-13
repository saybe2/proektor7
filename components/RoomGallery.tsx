"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconProjector } from "@/components/icons";

type Props = {
  images: string[];
  roomName: string;
};

export default function RoomGallery({ images, roomName }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!fullscreen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setFullscreen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [fullscreen]);

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
          <button key={src} type="button" onClick={() => { setZoom(1); setFullscreen(true); }} className="relative aspect-[4/3] min-w-full snap-center cursor-zoom-in">
            <Image
              src={src}
              alt={`${roomName}, фотография ${index + 1} из ${images.length}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={index === 0}
            />
          </button>
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

      <button type="button" onClick={() => { setZoom(1); setFullscreen(true); }} className="absolute left-3 top-3 bg-[#fffefa] border-2 border-[#111118] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_#111118]">
        Открыть фото
      </button>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-[#111118]/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`Просмотр фотографий: ${roomName}`}>
          <div className="flex items-center justify-between gap-3 p-3 text-white">
            <div className="font-black text-sm">{roomName} · {current + 1} / {images.length}</div>
            <div className="flex gap-2">
              <button type="button" className="photo-viewer-button" onClick={() => setZoom((value) => Math.max(1, value - 0.5))} aria-label="Уменьшить">−</button>
              <button type="button" className="photo-viewer-button" onClick={() => setZoom((value) => Math.min(3, value + 0.5))} aria-label="Увеличить">+</button>
              <button type="button" className="photo-viewer-button" onClick={() => setFullscreen(false)} aria-label="Закрыть">×</button>
            </div>
          </div>
          <div className="relative flex-1 overflow-auto touch-pan-x touch-pan-y" onDoubleClick={() => setZoom((value) => value === 1 ? 2 : 1)}>
            <div className="relative min-h-full min-w-full transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
              <Image src={images[current]} alt={`${roomName}, увеличенная фотография ${current + 1}`} fill sizes="100vw" className="object-contain" />
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-3 p-4">
              <button type="button" className="btn-outline !bg-white !min-h-0" onClick={() => { showImage(current - 1); setZoom(1); }}>Предыдущее</button>
              <button type="button" className="btn-outline !bg-white !min-h-0" onClick={() => { showImage(current + 1); setZoom(1); }}>Следующее</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
