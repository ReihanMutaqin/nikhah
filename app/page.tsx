import Link from "next/link";

export const metadata = {
  title: "Ruang Temu — Undangan Pernikahan Digital Premium",
  description: "Undangan pernikahan digital premium dengan fitur RSVP, Amplop Digital, Buku Tamu, Hitung Mundur, dan Pemutar Musik.",
};

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="topbar">
        <Link className="brand" href="/">
          <span>RT</span> Ruang Temu
        </Link>
        <div className="nav-links">
          <a href="#fitur">Fitur Utama</a>
          <a href="#cara">Cara Pakai</a>
          <Link href="/edit" style={{ opacity: 0.5, fontSize: "0.8rem" }}>
            🔒 Admin
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">UNDANGAN DIGITAL • PERSONAL &amp; LUXURY</p>
          <h1>
            Satu hari istimewa, disampaikan dengan <em>cara yang berkesan.</em>
          </h1>
          <p className="hero-lead">
            Lengkap dengan Hitung Mundur, Konfirmasi RSVP, Amplop Digital &amp; Salin Rekening, Pemutar Musik, Buku Tamu,
            dan Add to Google Calendar dalam satu tautan eksklusif.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/reihan&pasangan">
              ✨ Lihat Pratinjau Undangan
            </Link>
            <Link className="button secondary" href="/edit">
              ⚙️ Pengaturan Undangan
            </Link>
          </div>
          <div className="trust-row">
            <span>✓ 100% Mobile Friendly</span>
            <span>✓ Fitur Lengkap &amp; Bebas Dummy</span>
            <span>✓ Tautan Tamu Personal</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Preview undangan pernikahan">
          <div className="arch-card">
            <div className="arch-photo" />
            <div className="arch-content">
              <small>THE WEDDING OF</small>
              <strong>
                Aruna <i>&amp;</i> Bima
              </strong>
              <span>12 . 12 . 2026</span>
            </div>
          </div>
          <div className="floating-note">
            <b>Untuk Reihan &amp; Pasangan</b>
            <span>Dengan penuh sukacita, kami mengundang Anda.</span>
          </div>
        </div>
      </section>

      <section className="feature-section" id="fitur">
        <p className="eyebrow">FITUR UNDANGAN MELEBIHI STANDAR</p>
        <h2>Lengkap, elegan, dan tanpa kompromi.</h2>
        <div className="feature-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <article>
            <span>01</span>
            <h3>RSVP &amp; Presensi QR Code</h3>
            <p>Tamu dapat mengonfirmasi kehadiran &amp; jumlah pax, dilengkapi QR Code e-Ticket untuk check-in di lokasi.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Amplop Digital &amp; Salin Rekening</h3>
            <p>Fitur transfer via BCA, Mandiri, e-Wallet dengan tombol salin rekening instan &amp; alamat kado fisik.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Buku Tamu &amp; Doa Restu</h3>
            <p>Wadah interaktif bagi keluarga dan sahabat untuk menyampaikan ucapan selamat dan doa restu secara langsung.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Pemutar Musik &amp; Hitung Mundur</h3>
            <p>Latar lagu romantis beranimasi vinyl disc serta countdown timer real-time menuju hari Akad &amp; Resepsi.</p>
          </article>
          <article>
            <span>05</span>
            <h3>Add to Google Calendar &amp; Maps</h3>
            <p>Navigasi lokasi langsung ke Google Maps &amp; fitur simpan tanggal otomatis ke kalender ponsel tamu.</p>
          </article>
          <article>
            <span>06</span>
            <h3>Dashboard Admin Visual (/edit)</h3>
            <p>Kelola seluruh isi undangan, foto galeri, lagu, hingga pantau rekap data RSVP dan pesan dari tamu.</p>
          </article>
        </div>
      </section>

      <section className="how-section" id="cara">
        <p className="eyebrow">CARA MEMBAGIKAN</p>
        <h2>Nama tamu, langsung di dalam tautan.</h2>
        <div className="url-demo">
          <span>nikhah.vercel.app/</span>
          <b>reihan&amp;pasangan</b>
        </div>
        <p>Bagian setelah domain akan otomatis diubah menjadi “Reihan &amp; Pasangan” pada sampul pembuka undangan.</p>
      </section>

      <footer>
        <Link className="brand" href="/">
          <span>RT</span> Ruang Temu
        </Link>
        <p>Merayakan cerita cinta yang menemukan rumahnya.</p>
      </footer>
    </main>
  );
}
