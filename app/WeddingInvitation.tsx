"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultWedding, type WeddingData } from "./wedding-data";

const STORAGE_KEY = "ruang-temu-wedding-data";
export function getGuest(slug: string) {
  try { return decodeURIComponent(slug).replace(/[-_+]/g, " ").replace(/&/g, " & ").replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()); }
  catch { return "Tamu Undangan"; }
}

export default function WeddingInvitation({ slug }: { slug: string }) {
  const [opened, setOpened] = useState(false);
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const guest = useMemo(() => getGuest(slug || "tamu-undangan"), [slug]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) try { setData(JSON.parse(saved)); } catch (error) { console.warn("Data undangan lokal tidak dapat dibaca.", error); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const couple = `${data.bride} & ${data.groom}`;
  if (!opened) return <main className="cover" style={{ backgroundImage: `linear-gradient(180deg, rgba(16,28,24,.18), rgba(16,28,24,.66)), url('${data.heroImage}')` }}><div className="cover-inner"><p>THE WEDDING OF</p><h1>{data.bride} <i>&</i> {data.groom}</h1><div className="guest-card"><small>Kepada Yth.</small><strong>{guest}</strong><span>Mohon maaf apabila ada kesalahan penulisan nama atau gelar.</span></div><button className="button light" onClick={() => setOpened(true)}>Buka Undangan</button></div></main>;
  return <main className="invitation">
    <nav className="invite-nav"><Link className="brand" href="/"><span>RT</span></Link><div><a href="#cerita">Cerita</a><a href="#acara">Acara</a><a href="#galeri">Galeri</a></div></nav>
    <header className="invite-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(12,25,20,.08), rgba(12,25,20,.58)), url('${data.heroImage}')` }}><div><p>WE ARE GETTING MARRIED</p><h1>{data.bride} <i>&</i> {data.groom}</h1><span>{data.date}</span></div></header>
    <section className="welcome"><p className="eyebrow">DEAR, {guest.toUpperCase()}</p><h2>Dengan penuh sukacita,<br/>kami mengundang Anda.</h2><p>Kehadiran dan doa restu Anda akan menjadi bagian yang indah dalam awal perjalanan kami.</p></section>
    <section className="quote-block"><div className="monogram">{data.bride[0]} <i>&</i> {data.groom[0]}</div><blockquote>“{data.quote}”</blockquote><span>— QS. Ar-Rum: 21</span></section>
    <section className="story-section" id="cerita"><div><p className="eyebrow">CERITA KAMI</p><h2>Dua perjalanan,<br/><em>satu tujuan.</em></h2></div><p>{data.story}</p></section>
    <section className="event-section" id="acara"><p className="eyebrow">SIMPAN TANGGALNYA</p><h2>{data.dateLong}</h2><div className="event-grid">{data.events.map((event) => <article key={event.title}><span>✦</span><h3>{event.title}</h3><b>{event.time}</b><p>{event.place}<br/>{event.address}</p><a href="https://maps.google.com" target="_blank" rel="noreferrer">Buka petunjuk arah ↗</a></article>)}</div></section>
    <section className="gallery-section" id="galeri"><div className="section-head"><div><p className="eyebrow">GALERI</p><h2>Dalam setiap bingkai,<br/><em>ada cerita.</em></h2></div><p>Potongan kecil dari perjalanan yang membawa kami sampai ke hari ini.</p></div><div className="gallery-grid">{data.gallery.map((src, i) => <img key={`${src}-${i}`} src={src} alt={`Momen ${couple} ${i + 1}`} />)}</div></section>
    <section className="closing"><p>Terima kasih atas doa dan kehadiran Anda.</p><h2>{data.bride} <i>&</i> {data.groom}</h2><span>{data.dateLong}</span></section>
    <footer className="invite-footer"><p>Made with love for {couple}</p><Link href="/edit">Edit undangan</Link></footer>
  </main>;
}

export { STORAGE_KEY };
