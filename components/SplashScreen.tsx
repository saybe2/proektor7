"use client";

import { useEffect, useState, type CSSProperties } from "react";

const STORAGE_KEY = "p7splash";
const PLAY_MS = 6800;
const FADE_MS = 450;

const LETTERS = "ПРОЕКТОР".split("");

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
    const playMs = reduced ? 900 : PLAY_MS;
    const fadeTimer = window.setTimeout(() => setPhase("fade"), playMs);
    const goneTimer = window.setTimeout(() => setPhase("gone"), playMs + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      id="site-splash"
      className={`splash${phase === "fade" ? " splash--fade" : ""}`}
      role="status"
      aria-label="Загрузка сайта"
      onClick={() => setPhase("gone")}
    >
      <div className="splash-inner">
        <div className="splash-icons">
          <div className="splash-nic splash-nic--hookah">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/hookah.svg" alt="" />
          </div>
          <div className="splash-nic splash-nic--mic">
            <svg viewBox="0 0 64 64" stroke="currentColor">
              <rect x="25" y="7" width="14" height="24" rx="7" />
              <path d="M28 14 h8 M28 20 h8 M28 26 h8" />
              <path d="M19 27 a13 13 0 0 0 26 0" />
              <path d="M32 40 v9" />
              <path d="M23 53 h18" />
            </svg>
          </div>
          <div className="splash-nic splash-nic--bar">
            <svg viewBox="0 0 64 64" stroke="currentColor">
              <path d="M15 13 h34 l-17 19 z" />
              <path d="M32 32 v15" />
              <path d="M22 51 h20" />
              <path d="M40 9 l7 -7" />
              <circle cx="25" cy="18" r="3" />
            </svg>
          </div>
          <div className="splash-nic splash-nic--pad">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/gamepad.svg" alt="" />
          </div>
        </div>
        <div className="splash-word">
          {LETTERS.map((letter, i) => (
            <span key={i} style={{ "--d": `${i * 0.11}s` } as CSSProperties}>
              {letter}
            </span>
          ))}
          <span
            className="splash-accent"
            style={{ "--d": "0.9s", marginLeft: "0.35em" } as CSSProperties}
          >
            7
          </span>
        </div>
        <div className="splash-tag">ТАЙМ-КАФЕ</div>
        <div className="splash-feats">Кальян · Караоке · Бар · PS 5</div>
      </div>
    </div>
  );
}
