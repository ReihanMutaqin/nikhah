"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { defaultWedding, defaultWishes, type RSVPItem, type WeddingData, type WishItem, type CheckInItem } from "./wedding-data";
import { subscribeWeddingData, subscribeWishes, subscribeCheckIns, addWishToFirebase, addRSVPToFirebase } from "./firebase";

export const STORAGE_KEY = "ruang-temu-wedding-data";
export const RSVP_STORAGE_KEY = "ruang-temu-rsvp-list";
export const WISHES_STORAGE_KEY = "ruang-temu-wishes-list";

export function getGuest(slug: string) {
  try {
    return decodeURIComponent(slug)
      .replace(/[-_+]/g, " ")
      .replace(/&/g, " & ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Tamu Undangan";
  }
}

// Generate Google Calendar Link
function getGoogleCalendarUrl(title: string, details: string, location: string, startIso?: string, endIso?: string) {
  const start = startIso || "20261212T010000Z";
  const end = endIso || "20261212T030000Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${start}/${end}`;
}

// ═══════════════════════════════════════════════════════════════════
// LUSH BOTANICAL GARDEN VECTOR COLLECTION (Inspired by Viding #183)
// Pink Hibiscus, Vine Branches, Butterflies, Golden Frames, Peacock
// ═══════════════════════════════════════════════════════════════════

// Large Pink Hibiscus Flower Cluster (Corner Decoration)
function FloralCornerOrnament({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  return (
    <div className={`floral-corner floral-corner-${position}`}>
      <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main vine branch */}
        <path d="M5 5C30 15 55 35 75 65C90 90 100 120 110 155C115 170 118 178 120 180" stroke="#5a7a4a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5 5C15 30 35 55 65 75C90 90 120 100 155 110" stroke="#5a7a4a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        {/* Secondary vine */}
        <path d="M15 8C25 20 40 38 50 55C58 68 62 78 68 95" stroke="#6d8c5a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Large pink hibiscus flower 1 */}
        <circle cx="42" cy="42" r="22" fill="#f0a0b0" opacity="0.3" />
        <path d="M42 16C48 28 55 35 62 38C55 44 48 55 42 68C36 55 29 44 22 38C29 35 36 28 42 16Z" fill="#e87da0" />
        <path d="M26 26C34 22 38 28 36 36C28 36 24 32 26 26Z" fill="#f5b8c8" />
        <path d="M58 26C50 22 46 28 48 36C56 36 60 32 58 26Z" fill="#f5b8c8" />
        <path d="M26 58C34 62 38 56 36 48C28 48 24 52 26 58Z" fill="#f5b8c8" />
        <path d="M58 58C50 62 46 56 48 48C56 48 60 52 58 58Z" fill="#f5b8c8" />
        <circle cx="42" cy="42" r="7" fill="#fce4ec" />
        <circle cx="42" cy="42" r="3" fill="#c2185b" opacity="0.6" />
        {/* Small pink bud 2 */}
        <path d="M85 35C92 28 100 32 96 42C88 40 84 37 85 35Z" fill="#e87da0" />
        <path d="M82 42C76 34 80 26 90 30C88 38 85 42 82 42Z" fill="#7cb342" />
        {/* Green leaves along vine */}
        <path d="M25 70C18 80 22 92 35 88C34 78 30 72 25 70Z" fill="#66bb6a" opacity="0.8" />
        <path d="M70 25C80 18 92 22 88 35C78 34 72 30 70 25Z" fill="#66bb6a" opacity="0.8" />
        <path d="M55 85C48 95 52 107 65 103C64 93 60 87 55 85Z" fill="#4caf50" opacity="0.7" />
        <path d="M95 55C105 48 117 52 113 65C103 64 97 60 95 55Z" fill="#4caf50" opacity="0.7" />
        {/* Small berries */}
        <circle cx="78" cy="68" r="3" fill="#ffb74d" />
        <circle cx="68" cy="78" r="2.5" fill="#ffb74d" />
        <circle cx="88" cy="48" r="2" fill="#ef5350" opacity="0.7" />
        {/* Tiny flower bud 3 */}
        <path d="M110 75C118 68 128 72 124 84C114 82 110 78 110 75Z" fill="#f48fb1" opacity="0.8" />
        <circle cx="115" cy="78" r="3" fill="#fce4ec" />
        {/* Second large hibiscus */}
        <circle cx="90" cy="110" r="18" fill="#f0a0b0" opacity="0.2" />
        <path d="M90 90C94 100 100 106 108 108C100 112 94 120 90 130C86 120 80 112 72 108C80 106 86 100 90 90Z" fill="#ec407a" opacity="0.85" />
        <circle cx="90" cy="110" r="5" fill="#fce4ec" />
        <circle cx="90" cy="110" r="2" fill="#c2185b" opacity="0.5" />
      </svg>
    </div>
  );
}

// Ornate Golden Botanical Divider with Flowers
function BotanicalDivider() {
  return (
    <div className="floral-divider-container">
      <svg className="floral-divider-svg" viewBox="0 0 340 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left vine line */}
        <path d="M10 25C30 25 50 22 80 25C95 26 105 24 120 25" stroke="#5a7a4a" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right vine line */}
        <path d="M220 25C235 24 245 26 260 25C290 22 310 25 330 25" stroke="#5a7a4a" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left leaves */}
        <path d="M40 22C36 16 28 18 32 26C38 26 42 24 40 22Z" fill="#66bb6a" />
        <path d="M70 28C66 34 58 32 62 24C68 24 72 26 70 28Z" fill="#4caf50" />
        {/* Right leaves */}
        <path d="M270 28C274 34 282 32 278 24C272 24 268 26 270 28Z" fill="#4caf50" />
        <path d="M300 22C304 16 312 18 308 26C302 26 298 24 300 22Z" fill="#66bb6a" />
        {/* Center ornate golden frame */}
        <ellipse cx="170" cy="25" rx="28" ry="22" fill="#f6efe2" stroke="#c5a059" strokeWidth="2" />
        {/* Center hibiscus flower */}
        <path d="M170 8C174 16 178 20 184 22C178 26 174 32 170 42C166 32 162 26 156 22C162 20 166 16 170 8Z" fill="#e87da0" />
        <circle cx="170" cy="22" r="5" fill="#fce4ec" />
        <circle cx="170" cy="22" r="2" fill="#c2185b" opacity="0.5" />
        {/* Small bud left */}
        <path d="M142 25C146 18 152 22 148 28C144 28 142 27 142 25Z" fill="#f48fb1" opacity="0.7" />
        {/* Small bud right */}
        <path d="M198 25C194 18 188 22 192 28C196 28 198 27 198 25Z" fill="#f48fb1" opacity="0.7" />
        {/* Golden dots */}
        <circle cx="100" cy="25" r="3" fill="#c5a059" />
        <circle cx="240" cy="25" r="3" fill="#c5a059" />
        <circle cx="55" cy="25" r="2" fill="#c5a059" opacity="0.5" />
        <circle cx="285" cy="25" r="2" fill="#c5a059" opacity="0.5" />
        {/* Tiny berries */}
        <circle cx="85" cy="20" r="2" fill="#ffb74d" />
        <circle cx="255" cy="20" r="2" fill="#ffb74d" />
      </svg>
    </div>
  );
}

// 3D Wax Seal Stamp with Floral Wreath
function WaxSealBadgeSVG() {
  return (
    <svg className="wax-seal-badge" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer seal ring */}
      <circle cx="60" cy="60" r="54" fill="#8b6914" />
      <circle cx="60" cy="60" r="50" fill="#c5a059" />
      <circle cx="60" cy="60" r="46" fill="#d4b06a" />
      {/* Decorative border */}
      <circle cx="60" cy="60" r="42" stroke="#f6efe2" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
      {/* Small floral wreath around center */}
      <path d="M40 30C44 24 50 28 46 34C42 34 40 32 40 30Z" fill="#f48fb1" opacity="0.6" />
      <path d="M80 30C76 24 70 28 74 34C78 34 80 32 80 30Z" fill="#f48fb1" opacity="0.6" />
      <path d="M40 90C44 96 50 92 46 86C42 86 40 88 40 90Z" fill="#66bb6a" opacity="0.5" />
      <path d="M80 90C76 96 70 92 74 86C78 86 80 88 80 90Z" fill="#66bb6a" opacity="0.5" />
      {/* Center embossed flower */}
      <path d="M60 34C64 46 72 52 80 56C72 60 64 68 60 82C56 68 48 60 40 56C48 52 56 46 60 34Z" fill="#f6efe2" />
      <circle cx="60" cy="56" r="7" fill="#d4b06a" />
      <circle cx="60" cy="56" r="3" fill="#f6efe2" />
    </svg>
  );
}

// Torn Paper Edge (Realistic Cutout Effect)
function TornPaperEdgeTopSVG({ color = "#fcfbf7" }: { color?: string }) {
  return (
    <svg className="torn-paper-edge-top" viewBox="0 0 1200 24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
      <path d="M0 24L30 14L60 20L100 8L150 22L200 10L260 20L310 12L370 24L420 14L480 22L540 10L600 20L660 8L720 22L780 12L840 24L900 14L960 22L1020 8L1080 20L1140 12L1200 24V0H0V24Z" fill="currentColor" />
    </svg>
  );
}

// Animated Butterfly SVG
function ButterflySVG({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={style} className="cute-doodle-flower" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left wing */}
      <ellipse cx="18" cy="16" rx="14" ry="12" fill="#ce93d8" opacity="0.7" />
      <ellipse cx="16" cy="28" rx="10" ry="8" fill="#ba68c8" opacity="0.6" />
      <circle cx="18" cy="14" r="3" fill="#f3e5f5" opacity="0.8" />
      {/* Right wing */}
      <ellipse cx="42" cy="16" rx="14" ry="12" fill="#ce93d8" opacity="0.7" />
      <ellipse cx="44" cy="28" rx="10" ry="8" fill="#ba68c8" opacity="0.6" />
      <circle cx="42" cy="14" r="3" fill="#f3e5f5" opacity="0.8" />
      {/* Body */}
      <ellipse cx="30" cy="20" rx="2.5" ry="14" fill="#4a148c" opacity="0.7" />
      {/* Antennae */}
      <path d="M29 6C26 2 22 1 20 2" stroke="#4a148c" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M31 6C34 2 38 1 40 2" stroke="#4a148c" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <circle cx="20" cy="2" r="1.5" fill="#ce93d8" />
      <circle cx="40" cy="2" r="1.5" fill="#ce93d8" />
    </svg>
  );
}

// Vine Branch Horizontal SVG Separator
function VineBranchSVG() {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", margin: "10px 0" }}>
      <svg viewBox="0 0 300 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "min(80%, 300px)", height: "auto" }}>
        <path d="M10 15C50 15 80 10 120 15C140 18 160 12 180 15C220 20 250 15 290 15" stroke="#5a7a4a" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 14C36 8 28 10 32 18C38 18 42 16 40 14Z" fill="#66bb6a" />
        <path d="M90 16C86 22 78 20 82 12C88 12 92 14 90 16Z" fill="#4caf50" />
        <path d="M150 14C146 8 138 10 142 18C148 18 152 16 150 14Z" fill="#66bb6a" />
        <path d="M210 16C206 22 198 20 202 12C208 12 212 14 210 16Z" fill="#4caf50" />
        <path d="M260 14C256 8 248 10 252 18C258 18 262 16 260 14Z" fill="#66bb6a" />
        <circle cx="65" cy="12" r="3" fill="#f48fb1" opacity="0.7" />
        <circle cx="130" cy="18" r="2.5" fill="#ef5350" opacity="0.6" />
        <circle cx="180" cy="12" r="3" fill="#f48fb1" opacity="0.7" />
        <circle cx="240" cy="18" r="2.5" fill="#ffb74d" opacity="0.7" />
      </svg>
    </div>
  );
}

// Floating Animated Rose Petals + Butterflies Background
function FloatingPetals() {
  const items = [
    { left: "6%", delay: "0s", duration: "11s", type: "petal" },
    { left: "20%", delay: "3s", duration: "13s", type: "petal" },
    { left: "38%", delay: "1s", duration: "10s", type: "butterfly" },
    { left: "55%", delay: "4s", duration: "14s", type: "petal" },
    { left: "72%", delay: "2s", duration: "12s", type: "petal" },
    { left: "88%", delay: "5s", duration: "15s", type: "butterfly" },
    { left: "15%", delay: "6s", duration: "16s", type: "petal" },
    { left: "65%", delay: "7s", duration: "12s", type: "petal" },
  ];

  return (
    <div className="falling-petals-container">
      {items.map((p, i) => (
        <div
          key={i}
          className="falling-petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.type === "butterfly" ? "transparent" : undefined,
            borderRadius: p.type === "butterfly" ? "0" : undefined,
          }}
        />
      ))}
    </div>
  );
}

// Generate simple SVG QR Code pattern
function renderSimpleQrCode(text: string) {
  const hash = Array.from(text || "Tamu").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const size = 7;
  const rects = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r === 0 || r === size - 1 || c === 0 || c === size - 1) && !(r === 1 && c === 1)) {
        rects.push(<rect key={`${r}-${c}`} x={c * 20 + 10} y={r * 20 + 10} width="16" height="16" fill="#1b382d" rx="2" />);
      } else if ((r + c + hash) % 3 === 0) {
        rects.push(<rect key={`${r}-${c}`} x={c * 20 + 10} y={r * 20 + 10} width="16" height="16" fill="#c5a059" rx="3" />);
      }
    }
  }
  return (
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="160" fill="#ffffff" rx="12" />
      {rects}
      <circle cx="80" cy="80" r="14" fill="#1b382d" />
      <circle cx="80" cy="80" r="6" fill="#ffffff" />
    </svg>
  );
}

export default function WeddingInvitation({ slug }: { slug: string }) {
  const [opened, setOpened] = useState(false);
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const [wishes, setWishes] = useState<WishItem[]>(defaultWishes);
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Audio / Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // RSVP State
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    attendance: "hadir" as "hadir" | "tidak" | "ragu",
    guestCount: 1,
    message: "",
  });

  // Wish Form State
  const [wishForm, setWishForm] = useState({
    name: "",
    relation: "Sahabat",
    message: "",
  });

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const guest = useMemo(() => getGuest(slug || "tamu-undangan"), [slug]);
  const currentSlug = useMemo(() => (slug || "").toLowerCase().replace(/[-_+]/g, "-"), [slug]);

  // Check if this guest is checked-in by Palawari
  const isCheckedIn = useMemo(() => {
    return checkIns.some((c) => {
      const cSlug = (c.slug || "").toLowerCase();
      const cName = (c.guestName || "").toLowerCase();
      const targetName = guest.toLowerCase();
      return cSlug === currentSlug || cName === targetName;
    });
  }, [checkIns, currentSlug, guest]);

  // Robust safe getters
  const brideName = data?.bride || defaultWedding.bride;
  const groomName = data?.groom || defaultWedding.groom;
  const couple = `${brideName} & ${groomName}`;
  const brideInitial = brideName ? brideName[0] : "A";
  const groomInitial = groomName ? groomName[0] : "B";
  const eventsList = data?.events?.length ? data.events : defaultWedding.events;
  const galleryList = data?.gallery?.length ? data.gallery : defaultWedding.gallery;
  const bankList = data?.bankAccounts?.length ? data.bankAccounts : defaultWedding.bankAccounts;
  const giftAddressInfo = data?.giftAddress || defaultWedding.giftAddress;

  // Generate ISO Standard QR Code for Guest E-Ticket
  useEffect(() => {
    if (guest) {
      QRCode.toDataURL(guest, {
        width: 260,
        margin: 1,
        color: { dark: "#1b382d", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [guest]);

  // Dynamic document title update for browser tab
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `The Wedding of ${brideName} & ${groomName}`;
    }
  }, [brideName, groomName]);

  // Subscribe to Firebase Realtime Sync
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData({
          ...defaultWedding,
          ...parsed,
          events: parsed.events || defaultWedding.events,
          bankAccounts: parsed.bankAccounts || defaultWedding.bankAccounts,
          gallery: parsed.gallery || defaultWedding.gallery,
          giftAddress: parsed.giftAddress || defaultWedding.giftAddress,
        });
        setIsLoading(false);
      }
    } catch (e) {}

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const unsubscribeWedding = subscribeWeddingData((fbData) => {
      if (fbData) {
        setData({
          ...defaultWedding,
          ...fbData,
          events: fbData.events || defaultWedding.events,
          bankAccounts: fbData.bankAccounts || defaultWedding.bankAccounts,
          gallery: fbData.gallery || defaultWedding.gallery,
          giftAddress: fbData.giftAddress || defaultWedding.giftAddress,
        });
      }
      setIsLoading(false);
    });

    const unsubscribeWishes = subscribeWishes((fbWishes) => {
      if (fbWishes && fbWishes.length > 0) {
        setWishes(fbWishes);
      }
    });

    const unsubscribeCheckIns = subscribeCheckIns((fbCheckIns) => {
      if (fbCheckIns) {
        setCheckIns(fbCheckIns);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribeWedding();
      unsubscribeWishes();
      unsubscribeCheckIns();
    };
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    const targetDateStr = data?.countdownDate || defaultWedding.countdownDate;
    const targetDate = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.countdownDate]);

  // Audio Handler & Autoplay Logic
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Audio play blocked", err));
    }
  };

  const handleOpenInvitation = () => {
    setOpened(true);
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  useEffect(() => {
    if (!opened || isPlaying) return;
    const handleFirstUserInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstUserInteraction, { once: true });
    window.addEventListener("scroll", handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("touchstart", handleFirstUserInteraction);
      window.removeEventListener("scroll", handleFirstUserInteraction);
    };
  }, [opened, isPlaying]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} berhasil disalin ke clipboard!`);
    }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRSVP: RSVPItem = {
      id: "rsvp-" + Date.now(),
      guestName: guest,
      attendance: rsvpForm.attendance,
      guestCount: Number(rsvpForm.guestCount),
      message: rsvpForm.message,
      timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    await addRSVPToFirebase(newRSVP);
    setRsvpSubmitted(true);
    showToast("Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.");
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishForm.name || !wishForm.message) return;

    const newWish: WishItem = {
      id: "w-" + Date.now(),
      name: wishForm.name,
      relation: wishForm.relation,
      message: wishForm.message,
      timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    };

    await addWishToFirebase(newWish);
    setWishForm({ name: "", relation: "Sahabat", message: "" });
    showToast("Doa & ucapan Anda berhasil dikirim!");
  };

  // Fullscreen Monogram Loading Screen while fetching initial Firebase data
  if (isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--forest)",
          color: "white",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div className="animated-fade-in" style={{ display: "grid", gap: "16px", justifyItems: "center" }}>
          <div className="monogram" style={{ animation: "bloomPulse 2s ease-in-out infinite", margin: 0 }}>
            {brideInitial} <i>&amp;</i> {groomInitial}
          </div>
          <p style={{ font: "500 1.5rem 'Playfair Display', serif", margin: "10px 0 0", color: "var(--gold-light)" }}>
            Mempersiapkan Momen Kebahagiaan...
          </p>
          <span style={{ fontSize: "0.74rem", opacity: 0.8, letterSpacing: "0.22em" }}>
            THE WEDDING OF {brideName.toUpperCase()} &amp; {groomName.toUpperCase()}
          </span>
        </div>
      </main>
    );
  }

  const coverBg = `url('/images/garden_cover_bg.png')`;

  // Covered View (Opening Envelope)
  if (!opened) {
    return (
      <main
        className="cover"
        style={{
          backgroundImage: coverBg,
        }}
      >
        <img className="garden-gate-cover" src="/garden-gate.svg" alt="" />
        <img className="botanical-corner-art botanical-corner-art-left" src="/botanical-corner.svg" alt="" />
        <img className="botanical-corner-art botanical-corner-art-right" src="/botanical-corner.svg" alt="" />
        <FloralCornerOrnament position="tl" />
        <FloralCornerOrnament position="tr" />
        <FloralCornerOrnament position="bl" />
        <FloralCornerOrnament position="br" />
        <FloatingPetals />

        <div className="cover-inner animated-fade-in" style={{ position: "relative" }}>
          <div style={{ marginBottom: "12px" }}>
            <WaxSealBadgeSVG />
          </div>

          <span className="cute-font" style={{ color: "var(--gold-light)", fontSize: "2.3rem", display: "block", marginBottom: "4px" }}>
            ✨ Save The Date! Kita Mau Nikah Niih! ✨
          </span>
          <p style={{ letterSpacing: "0.25em", opacity: 0.9, margin: 0 }}>THE WEDDING OF</p>
          <h1 style={{ marginTop: "4px" }}>
            {brideName} <i>&amp;</i> {groomName}
          </h1>
          <div className="guest-card" style={{ position: "relative", border: "2px dashed rgba(255,255,255,0.4)" }}>
            <div className="washi-tape-top" />
            <small style={{ fontSize: "0.78rem" }}>Spesial Untuk Sahabat / Keluarga Kami:</small>
            <strong style={{ fontSize: "1.45rem", color: "var(--forest)" }}>{guest}</strong>
            <span style={{ fontSize: "0.78rem" }}>Mohon doa restunya yaa! Buka undangannya di bawah ini 💌</span>
          </div>
          <button className="button light" onClick={handleOpenInvitation} style={{ borderRadius: "99px", padding: "14px 32px", fontSize: "0.95rem" }}>
            💌 Buka Undangan Pernikahan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="invitation" style={{ position: "relative" }}>
      <FloatingPetals />
      {/* Background Audio */}
      {data?.musicUrl && <audio ref={audioRef} src={data.musicUrl} autoPlay loop />}

      {/* Floating Music Player Widget */}
      {data?.musicUrl && (
        <button className="music-player-widget" onClick={toggleMusic} title={isPlaying ? "Jeda Musik" : "Putar Musik"}>
          <div className={`vinyl-disc ${isPlaying ? "spinning" : ""}`} />
          <div className="music-info">
            <b>{isPlaying ? "Musik Diputar 🎵" : "Musik Di-pause 🔇"}</b>
            <span>Sentuh untuk {isPlaying ? "jeda" : "putar"}</span>
          </div>
        </button>
      )}

      {/* Toast Notification */}
      {toastMsg && <div className="toast-notification">✓ {toastMsg}</div>}

      {/* Desktop Navigation Topbar */}
      <nav className="invite-nav">
        <Link className="brand" href="/">
          <span>{brideInitial}{groomInitial}</span>
        </Link>
        <div className="nav-desktop-links">
          <a href="#mempelai">Mempelai</a>
          <a href="#galeri">Galeri</a>
          <a href="#acara">Acara</a>
          <a href="#rsvp">RSVP</a>
          <a href="#amplop">Amplop</a>
          <a href="#ucapan">Buku Tamu</a>
        </div>
      </nav>

      {/* Native Mobile Bottom Tab Navigation */}
      <nav className="mobile-bottom-nav">
        <a href="#mempelai">
          <span>💍</span>
          <small>Mempelai</small>
        </a>
        <a href="#galeri">
          <span>🖼️</span>
          <small>Galeri</small>
        </a>
        <a href="#acara">
          <span>📅</span>
          <small>Acara</small>
        </a>
        <a href="#rsvp">
          <span>💌</span>
          <small>RSVP</small>
        </a>
        <a href="#ucapan">
          <span>📖</span>
          <small>Buku Tamu</small>
        </a>
      </nav>

      {/* Hero Banner */}
      <header
        className="invite-hero garden-invite-hero"
        style={{
          backgroundImage: coverBg,
        }}
      >
        <img className="garden-gate-cover" src="/garden-gate.svg" alt="" />
        <div className="animated-fade-in">
          <p>WE ARE GETTING MARRIED</p>
          <h1>
            {brideName} <i>&</i> {groomName}
          </h1>
          <span>{data?.date || defaultWedding.date}</span>
        </div>
      </header>

      {/* Vine Branch Separator */}
      <VineBranchSVG />

      {/* Welcome & Mempelai Parents */}
      <section className="welcome" id="mempelai" style={{ position: "relative", backgroundImage: "url('/images/garden_section_bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <ButterflySVG style={{ position: "absolute", top: "20px", right: "10%", width: "42px", opacity: 0.6 }} />
        {data?.heroImage && <div className="couple-portrait" style={{ backgroundImage: `url('${data.heroImage}')` }} aria-label={`Foto ${brideName} dan ${groomName}`} />}
        <p className="eyebrow">DEAR, {guest.toUpperCase()}</p>
        <h2>
          Dengan penuh sukacita,
          <br />
          kami mengundang Anda.
        </h2>
        <p>
          Maha Suci Allah SWT yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon rahmat dan ridho-Nya,
          kami bermaksud menyelenggarakan pernikahan kami.
        </p>

        <BotanicalDivider />

        <div className="couple-parents-grid">
          <div className="couple-card">
            <h3>{brideName}</h3>
            <p>{data?.brideParents || defaultWedding.brideParents}</p>
          </div>
          <div className="couple-divider">&amp;</div>
          <div className="couple-card">
            <h3>{groomName}</h3>
            <p>{data?.groomParents || defaultWedding.groomParents}</p>
          </div>
        </div>
      </section>

      {/* Vine Branch Separator */}
      <VineBranchSVG />

      {/* Gallery Section (Positioned Elegantly after Mempelai) */}
      <section className="gallery-section" id="galeri" style={{ position: "relative", backgroundImage: "url('/images/garden_section_bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <ButterflySVG style={{ position: "absolute", top: "30px", left: "8%", width: "38px", opacity: 0.5, transform: "rotate(-15deg)" }} />
        <div className="section-head">
          <div>
            <p className="eyebrow">GALERI FOTO PRE-WEDDING</p>
            <h2>
              Dalam setiap bingkai,
              <br />
              <em>ada cerita.</em>
            </h2>
          </div>
          <p>Potongan kecil dari perjalanan indah yang membawa kami sampai ke hari pernikahan ini.</p>
        </div>

        <div className="gallery-grid">
          {galleryList.map((src, i) => (
            <div
              className="cute-polaroid-frame"
              key={`${src}-${i}`}
              onClick={() => setLightboxIndex(i)}
              style={{ cursor: "pointer" }}
            >
              <div className="washi-tape-top" />
              <img
                src={src}
                alt={`Momen ${couple} ${i + 1}`}
                style={{ width: "100%", height: "260px", objectFit: "cover", borderRadius: "10px" }}
              />
              <span className="cute-font" style={{ display: "block", marginTop: "10px", textAlign: "center", fontSize: "1.55rem" }}>
                #OurStory0{i + 1} 💕
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Vine Branch Separator */}
      <VineBranchSVG />

      {/* Holy Quote Block */}
      <section className="quote-block" style={{ position: "relative" }}>
        <ButterflySVG style={{ position: "absolute", top: "15px", right: "12%", width: "36px", opacity: 0.45, transform: "rotate(10deg)" }} />
        <FloralCornerOrnament position="tl" />
        <FloralCornerOrnament position="br" />
        <div className="monogram">
          {brideInitial} <i>&</i> {groomInitial}
        </div>
        <blockquote>“{data?.quote || defaultWedding.quote}”</blockquote>
        <span>— {data?.quoteSource || defaultWedding.quoteSource}</span>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div>
          <p className="eyebrow">CERITA KAMI</p>
          <h2>
            Dua perjalanan,
            <br />
            <em>satu tujuan.</em>
          </h2>
        </div>
        <p>{data?.story || defaultWedding.story}</p>
      </section>

      {/* Countdown Timer Section */}
      <section className="countdown-section">
        <p className="eyebrow" style={{ color: "#b3c4bc" }}>HITUNG MUNDUR HARI H</p>
        <h2 className="section-title" style={{ color: "white" }}>Menghitung Waktu Berharga</h2>
        <div className="countdown-grid">
          <div className="count-card">
            <b>{String(timeLeft.days).padStart(2, "0")}</b>
            <span>Hari</span>
          </div>
          <div className="count-card">
            <b>{String(timeLeft.hours).padStart(2, "0")}</b>
            <span>Jam</span>
          </div>
          <div className="count-card">
            <b>{String(timeLeft.minutes).padStart(2, "0")}</b>
            <span>Menit</span>
          </div>
          <div className="count-card">
            <b>{String(timeLeft.seconds).padStart(2, "0")}</b>
            <span>Detik</span>
          </div>
        </div>
      </section>

      {/* Event Details & Add to Calendar */}
      <section className="event-section" id="acara">
        <p className="eyebrow">RANGKAIAN ACARA</p>
        <h2>{data?.dateLong || defaultWedding.dateLong}</h2>

        <BotanicalDivider />

        <div className="event-grid">
          {eventsList.map((ev, i) => (
            <article key={(ev?.title || "event") + i}>
              <span>✦</span>
              <h3>{ev.title}</h3>
              <b>{ev.time}</b>
              <p>
                <strong>{ev.place}</strong>
                <br />
                {ev.address}
              </p>

              <div className="event-actions">
                <a className="action-btn" href={ev.mapsUrl || "https://maps.google.com"} target="_blank" rel="noreferrer">
                  📍 Google Maps ↗
                </a>
                <a
                  className="action-btn"
                  href={getGoogleCalendarUrl(
                    `${ev.title} - ${couple}`,
                    `Pernikahan ${couple} di ${ev.place}`,
                    ev.address,
                    ev.calendarStart,
                    ev.calendarEnd
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  📅 Add to Calendar ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* RSVP Section */}
      <section className="rsvp-section" id="rsvp">
        <p className="eyebrow">KONFIRMASI KEHADIRAN</p>
        <h2 className="section-title">RSVP Tamu Undangan</h2>

        <div className="rsvp-container">
          {rsvpSubmitted ? (
            <div className="rsvp-success-card">
              <h4>Konfirmasi Kehadiran Terkirim! ✨</h4>
              <p>Terima kasih <strong>{guest}</strong> atas konfirmasinya. Kehadiran Anda sangat berarti bagi kami.</p>
              <button className="button primary" onClick={() => setRsvpSubmitted(false)}>
                Ubah Konfirmasi
              </button>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={handleRSVPSubmit}>
              <label>
                Nama Tamu
                <input type="text" value={guest} disabled />
              </label>

              <label>
                Konfirmasi Kehadiran
                <div className="attendance-options">
                  <button
                    type="button"
                    className={`option-btn ${rsvpForm.attendance === "hadir" ? "active" : ""}`}
                    onClick={() => setRsvpForm((f) => ({ ...f, attendance: "hadir" }))}
                  >
                    ✓ Hadir
                  </button>
                  <button
                    type="button"
                    className={`option-btn ${rsvpForm.attendance === "ragu" ? "active" : ""}`}
                    onClick={() => setRsvpForm((f) => ({ ...f, attendance: "ragu" }))}
                  >
                    ? Masih Ragu
                  </button>
                  <button
                    type="button"
                    className={`option-btn ${rsvpForm.attendance === "tidak" ? "active" : ""}`}
                    onClick={() => setRsvpForm((f) => ({ ...f, attendance: "tidak" }))}
                  >
                    ✕ Tidak Hadir
                  </button>
                </div>
              </label>

              {rsvpForm.attendance === "hadir" && (
                <label>
                  Jumlah Tamu Hadir
                  <select
                    value={rsvpForm.guestCount}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, guestCount: Number(e.target.value) }))}
                  >
                    <option value={1}>1 Orang</option>
                    <option value={2}>2 Orang</option>
                    <option value={3}>3 Orang atau Lebih</option>
                  </select>
                </label>
              )}

              <label>
                Pesan / Catatan Khusus (Opsional)
                <textarea
                  rows={3}
                  placeholder="Contoh: Datang bersama pasangan / ucapan singkat..."
                  value={rsvpForm.message}
                  onChange={(e) => setRsvpForm((f) => ({ ...f, message: e.target.value }))}
                />
              </label>

              <button type="submit" className="button primary" style={{ width: "100%", marginTop: "10px" }}>
                Kirim Konfirmasi Kehadiran
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Amplop Digital & Gift Section */}
      <section className="envelope-section" id="amplop">
        <p className="eyebrow">TANDA KASIH</p>
        <h2 className="section-title">Amplop Digital &amp; Kado</h2>
        <p style={{ maxWidth: "600px", margin: "15px auto 0", color: "#6a7b72" }}>
          Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih, dapat melalui rekening/e-wallet di bawah ini:
        </p>

        <div className="bank-cards-grid">
          {bankList.map((bank) => (
            <div className="bank-card" key={bank.id || bank.accountNumber}>
              <div className="bank-logo">{bank.logoText || bank.bank}</div>
              <div className="account-number">{bank.accountNumber}</div>
              <div className="account-holder">a.n. {bank.accountHolder}</div>
              <button className="copy-btn" onClick={() => handleCopy(bank.accountNumber, `Nomor rekening ${bank.bank}`)}>
                📋 Salin Nomor Rekening
              </button>
            </div>
          ))}
        </div>

        {giftAddressInfo && (
          <div className="gift-address-card">
            <h4>📦 Pengiriman Kado Fisik</h4>
            <p>
              <strong>Penerima:</strong> {giftAddressInfo.recipient} ({giftAddressInfo.phone})<br />
              <strong>Alamat:</strong> {giftAddressInfo.address}
            </p>
            <button className="copy-btn" onClick={() => handleCopy(giftAddressInfo.address, "Alamat kado")}>
              📋 Salin Alamat Pengiriman
            </button>
          </div>
        )}
      </section>

      {/* Wishes & Guestbook Section */}
      <section className="wishes-section" id="ucapan">
        <p className="eyebrow">BUKU TAMU</p>
        <h2 className="section-title">Doa &amp; Ucapan Restu</h2>

        <div className="wishes-container">
          <div className="wish-form-card">
            <form className="wish-form" onSubmit={handleWishSubmit}>
              <div className="wish-inputs-grid">
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={wishForm.name}
                  onChange={(e) => setWishForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <select
                  value={wishForm.relation}
                  onChange={(e) => setWishForm((f) => ({ ...f, relation: e.target.value }))}
                >
                  <option value="Sahabat">Sahabat</option>
                  <option value="Keluarga">Keluarga</option>
                  <option value="Rekan Kerja">Rekan Kerja</option>
                  <option value="Teman Sekolah/Kuliah">Teman Sekolah/Kuliah</option>
                  <option value="Tamu Undangan">Tamu Undangan</option>
                </select>
              </div>
              <textarea
                rows={3}
                placeholder="Tuliskan doa & ucapan manis untuk kedua mempelai..."
                value={wishForm.message}
                onChange={(e) => setWishForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
              <button type="submit" className="button primary">
                💌 Kirim Ucapan
              </button>
            </form>
          </div>

          <div className="wishes-feed">
            {(wishes || []).map((w) => (
              <div className="wish-card" key={w.id}>
                <div className="wish-header">
                  <span className="wish-name">{w.name}</span>
                  <span className="wish-badge">{w.relation}</span>
                </div>
                <p className="wish-msg">“{w.message}”</p>
                <span className="wish-time">{w.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Code Check-in Ticket with Realtime Palawari Status */}
      <section className="ticket-section">
        <p className="eyebrow" style={{ color: "#b3c4bc" }}>PRESENSI DIGITIAL</p>
        <h2 className="section-title" style={{ color: "white" }}>E-Ticket &amp; Scan QR</h2>

        <div className="ticket-card">
          <div className="ticket-header">
            <h4>{couple}</h4>
            <p>UNDANGAN EXCLUSIVE CHECK-IN</p>
          </div>
          <div className="qr-box">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code ${guest}`} style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#666" }}>Generating QR...</div>
            )}
          </div>
          <div className="ticket-footer">
            Tamu: <strong>{guest}</strong>
          </div>

          {/* REALTIME PALAWARI CHECK-IN STATUS BADGE */}
          {isCheckedIn ? (
            <div className="checkin-status-badge checked-in">
              <span>✓ SUDAH HADIR / CHECKED IN</span>
            </div>
          ) : (
            <div className="checkin-status-badge pending">
              <span>? TAMPILKAN KODE QR PADA PALAWARI saat TIBA</span>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="lightbox-modal" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
              ✕
            </button>
            <img src={galleryList[lightboxIndex] || galleryList[0]} alt="Enlarged photo" />
            <div className="lightbox-nav">
              <button
                className="lightbox-btn"
                onClick={() =>
                  setLightboxIndex((prev) => (prev === null || prev === 0 ? galleryList.length - 1 : prev - 1))
                }
              >
                ◀ Sebelum
              </button>
              <span>
                {lightboxIndex + 1} / {galleryList.length}
              </span>
              <button
                className="lightbox-btn"
                onClick={() =>
                  setLightboxIndex((prev) => (prev === null || prev === galleryList.length - 1 ? 0 : prev + 1))
                }
              >
                Sesudah ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closing */}
      <section className="closing">
        <p>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>
        <h2>
          {brideName} <i>&</i> {groomName}
        </h2>
        <span>{data?.dateLong || defaultWedding.dateLong}</span>
      </section>

      {/* Footer */}
      <footer className="invite-footer">
        <p>Made with ❤️ for {couple}</p>
        <Link href="/edit" title="Ruang Edit (Khusus Pemilik)" style={{ opacity: 0.35, fontSize: "0.7rem" }}>
          🔒
        </Link>
      </footer>
    </main>
  );
}
