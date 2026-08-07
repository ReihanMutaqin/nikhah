"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultWedding, defaultWishes, type RSVPItem, type WeddingData, type WishItem } from "./wedding-data";
import { subscribeWeddingData, subscribeWishes, addWishToFirebase, addRSVPToFirebase } from "./firebase";

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Dynamic document title update for browser tab
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `The Wedding of ${brideName} & ${groomName}`;
    }
  }, [brideName, groomName]);

  // 1. Subscribe to Firebase Realtime Database for global cross-device sync
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
      }
    } catch (e) {
      console.warn("LocalStorage load error", e);
    }

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fbData));
      }
    });

    const unsubscribeWishes = subscribeWishes((fbWishes) => {
      if (fbWishes && fbWishes.length > 0) {
        setWishes(fbWishes);
        localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(fbWishes));
      }
    });

    return () => {
      unsubscribeWedding();
      unsubscribeWishes();
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
        .catch((err) => console.warn("Audio play blocked by browser", err));
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

  // Autoplay trigger on first touch/click/scroll anywhere on page
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

  // Submit RSVP to Firebase
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

  // Submit Wish to Firebase
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

  // Covered View (Opening Envelope)
  if (!opened) {
    return (
      <main
        className="cover"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(16,28,24,.3), rgba(16,28,24,.78)), url('${data?.heroImage || defaultWedding.heroImage}')`,
        }}
      >
        <div className="cover-inner">
          <p>THE WEDDING OF</p>
          <h1>
            {brideName} <i>&</i> {groomName}
          </h1>
          <div className="guest-card">
            <small>Kepada Yth. Bapak/Ibu/Saudara/i</small>
            <strong>{guest}</strong>
            <span>Mohon maaf apabila ada kesalahan penulisan nama atau gelar.</span>
          </div>
          <button className="button light" onClick={handleOpenInvitation}>
            ✉️ Buka Undangan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="invitation">
      {/* Background Audio with Autoplay */}
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

      {/* Navigation */}
      <nav className="invite-nav">
        <Link className="brand" href="/">
          <span>{brideInitial}{groomInitial}</span>
        </Link>
        <div>
          <a href="#mempelai">Mempelai</a>
          <a href="#galeri">Galeri</a>
          <a href="#acara">Acara</a>
          <a href="#rsvp">RSVP</a>
          <a href="#amplop">Amplop</a>
          <a href="#ucapan">Buku Tamu</a>
        </div>
      </nav>

      {/* Hero Banner */}
      <header
        className="invite-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(12,25,20,.15), rgba(12,25,20,.65)), url('${data?.heroImage || defaultWedding.heroImage}')`,
        }}
      >
        <div>
          <p>WE ARE GETTING MARRIED</p>
          <h1>
            {brideName} <i>&</i> {groomName}
          </h1>
          <span>{data?.date || defaultWedding.date}</span>
        </div>
      </header>

      {/* Welcome & Mempelai Parents */}
      <section className="welcome" id="mempelai">
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

      {/* Gallery Section (Moved right after Mempelai for standard elegant flow) */}
      <section className="gallery-section" id="galeri">
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
            <div className="gallery-item" key={`${src}-${i}`} onClick={() => setLightboxIndex(i)}>
              <img src={src} alt={`Momen ${couple} ${i + 1}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Holy Quote Block */}
      <section className="quote-block">
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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

      {/* QR Code Check-in Ticket */}
      <section className="ticket-section">
        <p className="eyebrow" style={{ color: "#b3c4bc" }}>PRESENSI DIGITIAL</p>
        <h2 className="section-title" style={{ color: "white" }}>E-Ticket &amp; Scan QR</h2>

        <div className="ticket-card">
          <div className="ticket-header">
            <h4>{couple}</h4>
            <p>UNDANGAN EXCLUSIVE CHECK-IN</p>
          </div>
          <div className="qr-box">{renderSimpleQrCode(guest)}</div>
          <div className="ticket-footer">
            Tamu: <strong>{guest}</strong>
          </div>
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
