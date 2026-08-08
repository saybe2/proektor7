"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "p7splash";
const PLAY_MS = 2600;
const FADE_MS = 450;

export default function SplashScreen() {
  const [phase, setPhase] = useState<"play" | "fade" | "gone">("play");

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      seen = false;
    }
    if (seen) {
      const t = window.setTimeout(() => setPhase("gone"), 0);
      return () => window.clearTimeout(t);
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playMs = reduced ? 700 : PLAY_MS;
    const fadeTimer = window.setTimeout(() => setPhase("fade"), playMs);
    const goneTimer = window.setTimeout(() => setPhase("gone"), playMs + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  const letters = "ПРОЕКТОР".split("");

  return (
    <div
      id="site-splash"
      className={`splash${phase === "fade" ? " splash--fade" : ""}`}
      role="status"
      aria-label="Загрузка сайта"
      onClick={() => setPhase("gone")}
    >
      <div className="splash-ring" />
      <div className="splash-word">
        {letters.map((letter, i) => (
          <span key={i} style={{ animationDelay: `${0.05 + i * 0.11}s` }}>
            {letter}
          </span>
        ))}
        <span className="splash-accent" style={{ animationDelay: "1s", marginLeft: "0.35em" }}>
          7
        </span>
      </div>
      <div className="splash-tagline">ТАЙМ-КАФЕ</div>
    </div>
  );
}
