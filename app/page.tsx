import Link from "next/link";

export const metadata = {
  title: "Ruang Temu — Undangan Pernikahan Digital",
  description: "Undangan pernikahan digital yang personal, hangat, dan mudah dibagikan.",
};

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="topbar">
        <Link className="brand" href="/"><span>RT</span> Ruang Temu</Link>
        <div className="nav-links"><a href="#fitur">Fitur</a><a href="#cara">Cara pakai</a><Link className="nav-cta" href="/edit">Mode edit</Link></div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">UNDANGAN DIGITAL • PERSONAL & ELEGAN</p>
          <h1>Satu hari istimewa, disampaikan dengan <em>cara yang berkesan.</em></h1>
          <p className="hero-lead">Bagikan cerita, detail acara, galeri, dan undangan personal dalam satu tautan indah yang nyaman dibuka di semua perangkat.</p>
          <div className="hero-actions"><Link className="button primary" href="/reihan&pasangan">Lihat contoh undangan</Link><Link className="button secondary" href="/edit">Sesuaikan undangan</Link></div>
          <div className="trust-row"><span>✓ Mobile friendly</span><span>✓ Siap Vercel</span><span>✓ URL tamu personal</span></div>
        </div>
        <div className="hero-visual" aria-label="Preview undangan pernikahan">
          <div className="arch-card"><div className="arch-photo"/><div className="arch-content"><small>THE WEDDING OF</small><strong>Aruna <i>&</i> Bima</strong><span>12 . 12 . 2026</span></div></div>
          <div className="floating-note"><b>Untuk Reihan & Pasangan</b><span>Dengan penuh sukacita, kami mengundang Anda.</span></div>
        </div>
      </section>
      <section className="feature-section" id="fitur">
        <p className="eyebrow">DIBUAT UNTUK MEMUDAHKAN</p><h2>Lengkap, tanpa terasa rumit.</h2>
        <div className="feature-grid">
          <article><span>01</span><h3>Tautan personal</h3><p>Nama tamu otomatis tampil dari alamat yang Anda bagikan.</p></article>
          <article><span>02</span><h3>Editor visual</h3><p>Ganti foto, susunan galeri, nama, tanggal, dan detail acara dengan mudah.</p></article>
          <article><span>03</span><h3>Siap diterbitkan</h3><p>Struktur ringan, responsif, dan siap dipasang di Vercel dengan domain sendiri.</p></article>
        </div>
      </section>
      <section className="how-section" id="cara"><p className="eyebrow">CARA MEMBAGIKAN</p><h2>Nama tamu, langsung di dalam tautan.</h2><div className="url-demo"><span>wedding.com/</span><b>reihan&amp;pasangan</b></div><p>Bagian setelah domain akan otomatis diubah menjadi “Reihan & Pasangan” pada halaman pembuka undangan.</p></section>
      <footer><Link className="brand" href="/"><span>RT</span> Ruang Temu</Link><p>Merayakan cerita yang menemukan rumahnya.</p></footer>
    </main>
  );
}
