"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultWedding, defaultWishes, type RSVPItem, type WeddingData, type WishItem } from "./wedding-data";

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
  const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
  const couple = `${data.bride} & ${data.groom}`;

  // Load custom data & wishes from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try { setData(JSON.parse(savedData)); } catch (e) { console.warn("Failed to load saved wedding data", e); }
      }

      const savedWishes = localStorage.getItem(WISHES_STORAGE_KEY);
      if (savedWishes) {
        try { setWishes(JSON.parse(savedWishes)); } catch (e) { console.warn("Failed to load saved wishes", e); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Countdown Timer Logic
  useEffect(() => {
    const targetDate = new Date(data.countdownDate || "2026-12-12T08:00:00").getTime();
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
  }, [data.countdownDate]);

  // Audio Handler
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
    // Auto-play music on invitation open if audio exists
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin ke clipboard!`);
  };

  // Submit RSVP
  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRSVP: RSVPItem = {
      id: "rsvp-" + Date.now(),
      guestName: guest,
      attendance: rsvpForm.attendance,
      guestCount: Number(rsvpForm.guestCount),
      message: rsvpForm.message,
      timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    const existing: RSVPItem[] = JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) || "[]");
    const updated = [newRSVP, ...existing];
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(updated));
    setRsvpSubmitted(true);
    showToast("Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.");
  };

  // Submit Wish
  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishForm.name || !wishForm.message) return;

    const newWish: WishItem = {
      id: "w-" + Date.now(),
      name: wishForm.name,
      relation: wishForm.relation,
      message: wishForm.message,
      timestamp: "Baru saja",
    };

    const updated = [newWish, ...wishes];
    setWishes(updated);
    localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(updated));
    setWishForm({ name: "", relation: "Sahabat", message: "" });
    showToast("Doa & ucapan Anda berhasil dikirim!");
  };

  // Covered View (Opening Envelope)
  if (!opened) {
    return (
      <main
        className="cover"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(16,28,24,.3), rgba(16,28,24,.78)), url('${data.heroImage}')`,
        }}
      >
        <div className="cover-inner">
          <p>THE WEDDING OF</p>
          <h1>
            {data.bride} <i>&</i> {data.groom}
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
      {/* Background Audio */}
      {data.musicUrl && <audio ref={audioRef} src={data.musicUrl} loop />}

      {/* Floating Music Player Widget */}
      {data.musicUrl && (
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
          <span>RT</span>
        </Link>
        <div>
          <a href="#mempelai">Mempelai</a>
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
          backgroundImage: `linear-gradient(180deg, rgba(12,25,20,.15), rgba(12,25,20,.65)), url('${data.heroImage}')`,
        }}
      >
        <div>
          <p>WE ARE GETTING MARRIED</p>
          <h1>
            {data.bride} <i>&</i> {data.groom}
          </h1>
          <span>{data.date}</span>
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
            <h3>{data.bride}</h3>
            <p>{data.brideParents}</p>
          </div>
          <div className="couple-divider">&amp;</div>
          <div className="couple-card">
            <h3>{data.groom}</h3>
            <p>{data.groomParents}</p>
          </div>
        </div>
      </section>

      {/* Holy Quote Block */}
      <section className="quote-block">
        <div className="monogram">
          {data.bride[0]} <i>&</i> {data.groom[0]}
        </div>
        <blockquote>“{data.quote}”</blockquote>
        <span>— {data.quoteSource}</span>
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
        <p>{data.story}</p>
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
        <h2>{data.dateLong}</h2>

        <div className="event-grid">
          {data.events.map((ev, i) => (
            <article key={ev.title + i}>
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
          {data.bankAccounts.map((bank) => (
            <div className="bank-card" key={bank.id}>
              <div className="bank-logo">{bank.logoText || bank.bank}</div>
              <div className="account-number">{bank.accountNumber}</div>
              <div className="account-holder">a.n. {bank.accountHolder}</div>
              <button className="copy-btn" onClick={() => handleCopy(bank.accountNumber, `Nomor rekening ${bank.bank}`)}>
                📋 Salin Nomor Rekening
              </button>
            </div>
          ))}
        </div>

        {data.giftAddress && (
          <div className="gift-address-card">
            <h4>📦 Pengiriman Kado Fisik</h4>
            <p>
              <strong>Penerima:</strong> {data.giftAddress.recipient} ({data.giftAddress.phone})<br />
              <strong>Alamat:</strong> {data.giftAddress.address}
            </p>
            <button className="copy-btn" onClick={() => handleCopy(data.giftAddress.address, "Alamat kado")}>
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
            {wishes.map((w) => (
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

      {/* Gallery Section */}
      <section className="gallery-section" id="galeri">
        <div className="section-head">
          <div>
            <p className="eyebrow">GALERI FOTO</p>
            <h2>
              Dalam setiap bingkai,
              <br />
              <em>ada cerita.</em>
            </h2>
          </div>
          <p>Potongan kecil dari perjalanan indah yang membawa kami sampai ke hari pernikahan ini.</p>
        </div>

        <div className="gallery-grid">
          {data.gallery.map((src, i) => (
            <div className="gallery-item" key={`${src}-${i}`} onClick={() => setLightboxIndex(i)}>
              <img src={src} alt={`Momen ${couple} ${i + 1}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="lightbox-modal" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
              ✕
            </button>
            <img src={data.gallery[lightboxIndex]} alt="Enlarged photo" />
            <div className="lightbox-nav">
              <button
                className="lightbox-btn"
                onClick={() =>
                  setLightboxIndex((prev) => (prev === null || prev === 0 ? data.gallery.length - 1 : prev - 1))
                }
              >
                ◀ Sebelum
              </button>
              <span>
                {lightboxIndex + 1} / {data.gallery.length}
              </span>
              <button
                className="lightbox-btn"
                onClick={() =>
                  setLightboxIndex((prev) => (prev === null || prev === data.gallery.length - 1 ? 0 : prev + 1))
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
          {data.bride} <i>&</i> {data.groom}
        </h2>
        <span>{data.dateLong}</span>
      </section>

      {/* Footer */}
      <footer className="invite-footer">
        <p>Made with ❤️ for {couple}</p>
        <Link href="/edit">⚙️ Edit Data Undangan</Link>
      </footer>
    </main>
  );
}
