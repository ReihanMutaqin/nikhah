"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultWedding, defaultWishes, type BankAccount, type RSVPItem, type WeddingData, type WishItem } from "../wedding-data";
import { RSVP_STORAGE_KEY, STORAGE_KEY, WISHES_STORAGE_KEY } from "../WeddingInvitation";

export default function EditorPage() {
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>(defaultWishes);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try { setData(JSON.parse(savedData)); } catch (e) { console.warn(e); }
      }

      const savedRsvps = localStorage.getItem(RSVP_STORAGE_KEY);
      if (savedRsvps) {
        try { setRsvps(JSON.parse(savedRsvps)); } catch (e) { console.warn(e); }
      }

      const savedWishes = localStorage.getItem(WISHES_STORAGE_KEY);
      if (savedWishes) {
        try { setWishes(JSON.parse(savedWishes)); } catch (e) { console.warn(e); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const patch = (key: keyof WeddingData, value: WeddingData[keyof WeddingData]) =>
    setData((d) => ({ ...d, [key]: value }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(wishes));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const upload = (file: File, index?: number) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (typeof index === "number") {
        patch("gallery", data.gallery.map((x, i) => (i === index ? url : x)));
      } else {
        patch("heroImage", url);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportData = () => {
    const fullData = { wedding: data, rsvps, wishes };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ruang-temu-wedding-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Bank account helpers
  const addBankAccount = () => {
    const newAcc: BankAccount = {
      id: "bank-" + Date.now(),
      bank: "BCA",
      accountNumber: "1234567890",
      accountHolder: data.bride,
      logoText: "BCA",
    };
    patch("bankAccounts", [...data.bankAccounts, newAcc]);
  };

  const updateBankAccount = (id: string, field: keyof BankAccount, val: string) => {
    patch(
      "bankAccounts",
      data.bankAccounts.map((b) => (b.id === id ? { ...b, [field]: val } : b))
    );
  };

  const deleteBankAccount = (id: string) => {
    patch(
      "bankAccounts",
      data.bankAccounts.filter((b) => b.id !== id)
    );
  };

  const deleteWish = (id: string) => {
    const updated = wishes.filter((w) => w.id !== id);
    setWishes(updated);
    localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteRSVP = (id: string) => {
    const updated = rsvps.filter((r) => r.id !== id);
    setRsvps(updated);
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(updated));
  };

  const totalAttending = rsvps
    .filter((r) => r.attendance === "hadir")
    .reduce((sum, r) => sum + (r.guestCount || 1), 0);

  return (
    <main className="editor-shell">
      <aside className="editor-side">
        <Link className="brand" href="/">
          <span>RT</span> Ruang Temu
        </Link>
        <div>
          <p>ADMIN CONTROL PANEL</p>
          <h1>Manajer Undangan</h1>
          <span>Semua perubahan tersimpan otomatis di browser ini. Gunakan ekspor data untuk cadangan.</span>
        </div>
        <nav>
          <a href="#utama">1. Informasi Mempelai</a>
          <a href="#acara-edit">2. Detail Acara</a>
          <a href="#amplop-edit">3. Rekening &amp; Kado</a>
          <a href="#musik-edit">4. Musik &amp; Media</a>
          <a href="#foto">5. Galeri Foto</a>
          <a href="#rsvp-admin">6. Data RSVP Tamu ({rsvps.length})</a>
          <a href="#wishes-admin">7. Buku Tamu ({wishes.length})</a>
        </nav>
        <Link className="preview-link" href="/reihan&pasangan">
          Lihat Pratinjau Undangan ↗
        </Link>
      </aside>

      <section className="editor-main">
        <div className="editor-top">
          <div>
            <p className="eyebrow">WEDDING CONTENT MANAGER</p>
            <h2>Pengaturan Undangan Complete</h2>
          </div>
          <div className="editor-actions">
            <button onClick={exportData}>💾 Ekspor Data JSON</button>
            <button className="save-button" onClick={save}>
              {saved ? "Tersimpan ✓" : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* 1. Informasi Utama */}
        <div className="form-card" id="utama">
          <div className="form-title">
            <span>01</span>
            <div>
              <h3>Informasi Mempelai &amp; Waktu</h3>
              <p>Nama pasangan, nama orang tua, dan tanggal hari-H.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Nama Mempelai Wanita
              <input value={data.bride} onChange={(e) => patch("bride", e.target.value)} />
            </label>
            <label>
              Keterangan Orang Tua Mempelai Wanita
              <input value={data.brideParents} onChange={(e) => patch("brideParents", e.target.value)} />
            </label>

            <label>
              Nama Mempelai Pria
              <input value={data.groom} onChange={(e) => patch("groom", e.target.value)} />
            </label>
            <label>
              Keterangan Orang Tua Mempelai Pria
              <input value={data.groomParents} onChange={(e) => patch("groomParents", e.target.value)} />
            </label>

            <label>
              Tanggal Tampilan Singkat
              <input value={data.date} onChange={(e) => patch("date", e.target.value)} />
            </label>
            <label>
              Tanggal Tampilan Lengkap
              <input value={data.dateLong} onChange={(e) => patch("dateLong", e.target.value)} />
            </label>

            <label className="wide">
              Waktu Countdown Timer (Format: YYYY-MM-DDTHH:mm:ss)
              <input
                value={data.countdownDate || "2026-12-12T08:00:00"}
                onChange={(e) => patch("countdownDate", e.target.value)}
              />
            </label>

            <label className="wide">
              Kutipan / Ayat Suci
              <textarea rows={2} value={data.quote} onChange={(e) => patch("quote", e.target.value)} />
            </label>
            <label className="wide">
              Sumber Kutipan (Contoh: QS. Ar-Rum: 21)
              <input value={data.quoteSource || ""} onChange={(e) => patch("quoteSource", e.target.value)} />
            </label>

            <label className="wide">
              Cerita Singkat Perjalanan Cinta
              <textarea rows={4} value={data.story} onChange={(e) => patch("story", e.target.value)} />
            </label>
          </div>
        </div>

        {/* 2. Detail Acara */}
        <div className="form-card" id="acara-edit">
          <div className="form-title">
            <span>02</span>
            <div>
              <h3>Rangkaian Acara (Akad &amp; Resepsi)</h3>
              <p>Atur jadwal, lokasi venue, dan link Google Maps.</p>
            </div>
          </div>
          {data.events.map((ev, i) => (
            <div className="event-edit" key={i}>
              <h4>{ev.title || `Acara ke-${i + 1}`}</h4>
              <div className="form-grid">
                <label>
                  Nama Acara
                  <input
                    value={ev.title}
                    onChange={(e) =>
                      patch(
                        "events",
                        data.events.map((x, j) => (j === i ? { ...x, title: e.target.value } : x))
                      )
                    }
                  />
                </label>
                <label>
                  Waktu Acara
                  <input
                    value={ev.time}
                    onChange={(e) =>
                      patch(
                        "events",
                        data.events.map((x, j) => (j === i ? { ...x, time: e.target.value } : x))
                      )
                    }
                  />
                </label>

                <label>
                  Nama Tempat / Hall
                  <input
                    value={ev.place}
                    onChange={(e) =>
                      patch(
                        "events",
                        data.events.map((x, j) => (j === i ? { ...x, place: e.target.value } : x))
                      )
                    }
                  />
                </label>
                <label>
                  Alamat Lengkap
                  <input
                    value={ev.address}
                    onChange={(e) =>
                      patch(
                        "events",
                        data.events.map((x, j) => (j === i ? { ...x, address: e.target.value } : x))
                      )
                    }
                  />
                </label>

                <label className="wide">
                  URL Google Maps
                  <input
                    value={ev.mapsUrl || ""}
                    onChange={(e) =>
                      patch(
                        "events",
                        data.events.map((x, j) => (j === i ? { ...x, mapsUrl: e.target.value } : x))
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Amplop Digital & Rekening */}
        <div className="form-card" id="amplop-edit">
          <div className="form-title">
            <span>03</span>
            <div>
              <h3>Amplop Digital &amp; Alamat Kado</h3>
              <p>Kelola nomor rekening bank / e-wallet dan alamat pengiriman kado fisik.</p>
            </div>
          </div>
          {data.bankAccounts.map((b) => (
            <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 0.8fr auto", gap: "10px", marginBottom: "15px", alignItems: "end" }}>
              <label>
                Bank / e-Wallet
                <input value={b.bank} onChange={(e) => updateBankAccount(b.id, "bank", e.target.value)} />
              </label>
              <label>
                Nomor Rekening
                <input value={b.accountNumber} onChange={(e) => updateBankAccount(b.id, "accountNumber", e.target.value)} />
              </label>
              <label>
                Atas Nama
                <input value={b.accountHolder} onChange={(e) => updateBankAccount(b.id, "accountHolder", e.target.value)} />
              </label>
              <label>
                Label Logo
                <input value={b.logoText || ""} onChange={(e) => updateBankAccount(b.id, "logoText", e.target.value)} />
              </label>
              <button
                type="button"
                onClick={() => deleteBankAccount(b.id)}
                style={{ padding: "12px 14px", background: "#fde8e8", color: "#9b2c2c", borderRadius: "8px" }}
              >
                Hapus
              </button>
            </div>
          ))}
          <button type="button" onClick={addBankAccount} className="button secondary" style={{ fontSize: "0.8rem", marginTop: "10px" }}>
            ＋ Tambah Rekening Bank / e-Wallet
          </button>

          <hr style={{ margin: "25px 0", border: "0", borderTop: "1px dashed var(--line)" }} />

          <h4 style={{ margin: "0 0 15px", font: "500 1.2rem 'Playfair Display', serif" }}>Alamat Kado Fisik</h4>
          <div className="form-grid">
            <label>
              Nama Penerima Kado
              <input
                value={data.giftAddress?.recipient || ""}
                onChange={(e) => patch("giftAddress", { ...data.giftAddress, recipient: e.target.value })}
              />
            </label>
            <label>
              Nomor HP Penerima
              <input
                value={data.giftAddress?.phone || ""}
                onChange={(e) => patch("giftAddress", { ...data.giftAddress, phone: e.target.value })}
              />
            </label>
            <label className="wide">
              Alamat Lengkap Pengiriman Kado
              <textarea
                rows={2}
                value={data.giftAddress?.address || ""}
                onChange={(e) => patch("giftAddress", { ...data.giftAddress, address: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* 4. Musik & Media */}
        <div className="form-card" id="musik-edit">
          <div className="form-title">
            <span>04</span>
            <div>
              <h3>Lagu Latar (Audio Background)</h3>
              <p>Masukkan URL audio MP3 lagu pernikahan kesukaan pasangan.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="wide">
              URL File Audio (.mp3)
              <input value={data.musicUrl || ""} onChange={(e) => patch("musicUrl", e.target.value)} />
            </label>
          </div>
        </div>

        {/* 5. Galeri Foto */}
        <div className="form-card" id="foto">
          <div className="form-title">
            <span>05</span>
            <div>
              <h3>Foto Sampul &amp; Galeri</h3>
              <p>Klik foto untuk mengganti. Mendukung hingga 8 foto kenangan.</p>
            </div>
          </div>
          <div className="photo-editor">
            <label className="hero-upload" style={{ backgroundImage: `url('${data.heroImage}')` }}>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <span>Ganti Foto Utama (Hero)</span>
            </label>
            <div className="thumb-grid">
              {data.gallery.map((src, i) => (
                <div className="thumb" key={i}>
                  <img src={src} alt="" />
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], i)}
                    />
                    Ganti
                  </label>
                  <button onClick={() => patch("gallery", data.gallery.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {data.gallery.length < 8 && (
                <label className="add-photo">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => patch("gallery", [...data.gallery, String(r.result)]);
                      r.readAsDataURL(f);
                    }}
                  />
                  <b>＋</b>
                  <span>Tambah Foto</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* 6. Data RSVP Tamu */}
        <div className="form-card" id="rsvp-admin">
          <div className="form-title">
            <span>06</span>
            <div>
              <h3>Daftar Konfirmasi Kehadiran (RSVP)</h3>
              <p>Total Tamu Terkonfirmasi Hadir: <strong>{totalAttending} Orang</strong></p>
            </div>
          </div>
          {rsvps.length === 0 ? (
            <p style={{ color: "#87938c", fontSize: "0.85rem" }}>Belum ada data RSVP dari tamu.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama Tamu</th>
                  <th>Status</th>
                  <th>Jumlah Pax</th>
                  <th>Pesan / Catatan</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.guestName}</strong></td>
                    <td>
                      <span className={`badge-attendance ${r.attendance}`}>
                        {r.attendance === "hadir" ? "✓ Hadir" : r.attendance === "tidak" ? "✕ Tidak" : "? Ragu"}
                      </span>
                    </td>
                    <td>{r.attendance === "hadir" ? `${r.guestCount} Orang` : "-"}</td>
                    <td>{r.message || "-"}</td>
                    <td>{r.timestamp}</td>
                    <td>
                      <button onClick={() => deleteRSVP(r.id)} style={{ color: "#9b2c2c" }}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 7. Data Buku Tamu */}
        <div className="form-card" id="wishes-admin">
          <div className="form-title">
            <span>07</span>
            <div>
              <h3>Buku Tamu / Doa &amp; Ucapan ({wishes.length})</h3>
              <p>Semua doa restu dan ucapan hangat dari sahabat &amp; keluarga.</p>
            </div>
          </div>
          {wishes.length === 0 ? (
            <p style={{ color: "#87938c", fontSize: "0.85rem" }}>Belum ada ucapan.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Hubungan</th>
                  <th>Ucapan</th>
                  <th>Waktu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {wishes.map((w) => (
                  <tr key={w.id}>
                    <td><strong>{w.name}</strong></td>
                    <td>{w.relation}</td>
                    <td>“{w.message}”</td>
                    <td>{w.timestamp}</td>
                    <td>
                      <button onClick={() => deleteWish(w.id)} style={{ color: "#9b2c2c" }}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
