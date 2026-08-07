"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultWedding, defaultWishes, type BankAccount, type RSVPItem, type WeddingData, type WishItem } from "../wedding-data";
import { RSVP_STORAGE_KEY, STORAGE_KEY, WISHES_STORAGE_KEY } from "../WeddingInvitation";
import {
  subscribeWeddingData,
  subscribeRSVPs,
  subscribeWishes,
  saveWeddingDataToFirebase,
  deleteRSVPFromFirebase,
  deleteWishFromFirebase,
} from "../firebase";

type BulkGuest = {
  id: string;
  name: string;
  slug: string;
  url: string;
  waText: string;
  waUrl: string;
};

export default function EditorPage() {
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>(defaultWishes);
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Security / PIN Auth State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Bulk Invitation Generator State
  const [bulkInput, setBulkInput] = useState(
    "Bapak Ahmad & Keluarga\nIbu Siti & Suami\nDimas & Partner\nSahabat Alumnus SMA 1\nRian Hidayat"
  );
  const [domainUrl, setDomainUrl] = useState("https://nikhah.vercel.app");
  const [waTemplate, setWaTemplate] = useState(
    "Kepada Yth. {nama}\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:\n\n{mempelai}\n\nBerikut tautan undangan personal Anda:\n{link}\n\nMerupakan suatu kehormatan & kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih."
  );
  const [generatedGuests, setGeneratedGuests] = useState<BulkGuest[]>([]);

  useEffect(() => {
    // Detect origin
    if (typeof window !== "undefined") {
      setDomainUrl(window.location.origin);
    }

    // LocalStorage fallback cache
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
      console.warn(e);
    }

    // Realtime Firebase Subscriptions
    const unsubWedding = subscribeWeddingData((fbData) => {
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
    });

    const unsubRSVPs = subscribeRSVPs((fbRsvps) => {
      if (fbRsvps) setRsvps(fbRsvps);
    });

    const unsubWishes = subscribeWishes((fbWishes) => {
      if (fbWishes) setWishes(fbWishes);
    });

    const auth = sessionStorage.getItem("ruang-temu-auth");
    if (auth === "true") {
      setIsAuthorized(true);
    }

    return () => {
      unsubWedding();
      unsubRSVPs();
      unsubWishes();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = data.adminPin || "1234";
    if (inputPin === correctPin) {
      setIsAuthorized(true);
      sessionStorage.setItem("ruang-temu-auth", "true");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("ruang-temu-auth");
    setInputPin("");
  };

  const patch = (key: keyof WeddingData, value: WeddingData[keyof WeddingData]) =>
    setData((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSavingLoading(true);
    // Save to Firebase Realtime Database
    const success = await saveWeddingDataToFirebase(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSavingLoading(false);

    if (success) {
      setSaved(true);
      showToast("Tersimpan di Cloud Firebase! Semua HP & Perangkat otomatis ter-update.");
      setTimeout(() => setSaved(false), 2500);
    } else {
      showToast("Gagal menyimpan ke Firebase. Cek koneksi internet.");
    }
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
    const fullData = { wedding: data, rsvps, wishes, bulkGuests: generatedGuests };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ruang-temu-wedding-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Generate Bulk Links & Messages
  const handleGenerateBulk = () => {
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const coupleName = `${data.bride} & ${data.groom}`;

    const list: BulkGuest[] = lines.map((name, idx) => {
      const slug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "dan"));
      const link = `${domainUrl}/${slug}`;
      const waText = waTemplate
        .replace(/{nama}/g, name)
        .replace(/{mempelai}/g, coupleName)
        .replace(/{link}/g, link);
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

      return {
        id: `guest-${idx}-${Date.now()}`,
        name,
        slug,
        url: link,
        waText,
        waUrl,
      };
    });

    setGeneratedGuests(list);
    showToast(`Berhasil me-generate ${list.length} link undangan masal!`);
  };

  const copyAllLinks = () => {
    if (generatedGuests.length === 0) return;
    const text = generatedGuests.map((g) => `${g.name}: ${g.url}`).join("\n");
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
    showToast("Semua tautan berhasil disalin ke clipboard!");
  };

  const copySingleText = (text: string, label: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
    showToast(`${label} disalin!`);
  };

  const exportBulkCsv = () => {
    if (generatedGuests.length === 0) return;
    let csv = "Nama Tamu,Tautan Personal,Link WhatsApp\n";
    generatedGuests.forEach((g) => {
      csv += `"${g.name.replace(/"/g, '""')}","${g.url}","${g.waUrl}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `daftar-undangan-masal-${data.bride}-${data.groom}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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

  const handleDeleteWish = async (id: string) => {
    await deleteWishFromFirebase(id);
    showToast("Ucapan berhasil dihapus dari Firebase.");
  };

  const handleDeleteRSVP = async (id: string) => {
    await deleteRSVPFromFirebase(id);
    showToast("RSVP berhasil dihapus dari Firebase.");
  };

  const totalAttending = rsvps
    .filter((r) => r.attendance === "hadir")
    .reduce((sum, r) => sum + (r.guestCount || 1), 0);

  // Render PIN Lock Screen if not authorized
  if (!isAuthorized) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--forest)",
          color: "white",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "24px",
            padding: "45px 35px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--gold-light)",
              color: "var(--forest)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
              fontSize: "1.6rem",
            }}
          >
            🔒
          </div>
          <p className="eyebrow" style={{ color: "var(--gold-light)" }}>
            RUANG TEMU ADMIN
          </p>
          <h2 style={{ font: "500 2rem 'Playfair Display', serif", margin: "10px 0 6px" }}>Akses Terkunci</h2>
          <p style={{ fontSize: "0.85rem", color: "#b7c7c0", margin: "0 0 25px", lineHeight: "1.6" }}>
            Masukkan PIN Keamanan untuk mengakses ruang edit &amp; generator undangan.
          </p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <input
              type="password"
              placeholder="Masukkan PIN Admin (Default: 1234)"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              style={{
                padding: "14px 18px",
                borderRadius: "12px",
                border: pinError ? "1px solid #ff7b7b" : "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                textAlign: "center",
                fontSize: "1.1rem",
                letterSpacing: "0.2em",
                outline: "none",
              }}
              required
            />

            {pinError && (
              <p style={{ color: "#ff8b8b", fontSize: "0.78rem", margin: 0 }}>
                ❌ PIN salah! Silakan periksa kembali.
              </p>
            )}

            <button type="submit" className="button light" style={{ width: "100%", marginTop: "6px" }}>
              🔓 Masuk Ruang Edit
            </button>
          </form>

          <Link href="/reihan&pasangan" style={{ display: "block", marginTop: "22px", fontSize: "0.78rem", color: "#a8bdb3", textDecoration: "underline" }}>
            ← Kembali ke Undangan
          </Link>
        </div>
      </main>
    );
  }

  // Render Authorized Editor Dashboard
  return (
    <main className="editor-shell">
      {toastMsg && <div className="toast-notification">✓ {toastMsg}</div>}

      <aside className="editor-side">
        <Link className="brand" href="/">
          <span>RT</span> Ruang Temu
        </Link>
        <div>
          <p style={{ color: "#77ffbb", fontWeight: "bold" }}>🔥 FIREBASE REALTIME DB CONNECTED</p>
          <h1>Manajer Undangan</h1>
          <span>Semua edit otomatis tersinkronisasi ke seluruh HP &amp; perangkat tamu secara live.</span>
        </div>
        <nav>
          <a href="#masal">⚡ Generator Undangan Masal</a>
          <a href="#utama">1. Informasi Mempelai</a>
          <a href="#keamanan">2. Keamanan PIN Admin</a>
          <a href="#acara-edit">3. Detail Acara</a>
          <a href="#amplop-edit">4. Rekening &amp; Kado</a>
          <a href="#musik-edit">5. Musik &amp; Media</a>
          <a href="#foto">6. Galeri Foto</a>
          <a href="#rsvp-admin">7. Data RSVP ({rsvps.length})</a>
          <a href="#wishes-admin">8. Buku Tamu ({wishes.length})</a>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "11px",
            color: "#ffaaaa",
            fontSize: "0.8rem",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          🔒 Kunci Ruang Edit (Logout)
        </button>
      </aside>

      <section className="editor-main">
        <div className="editor-top">
          <div>
            <p className="eyebrow">WEDDING CONTENT MANAGER • REALTIME FIREBASE SYNC</p>
            <h2>Pengaturan Undangan Cloud Protected</h2>
          </div>
          <div className="editor-actions">
            <button onClick={exportData}>💾 Ekspor Data JSON</button>
            <button className="save-button" onClick={save} disabled={savingLoading}>
              {savingLoading ? "Menyimpan ke Cloud..." : saved ? "Tersimpan di Cloud 🔥" : "🔥 Simpan Perubahan ke Firebase"}
            </button>
          </div>
        </div>

        {/* BULK INVITATION LINK & WA GENERATOR */}
        <div className="form-card" id="masal" style={{ border: "2px solid var(--gold)" }}>
          <div className="form-title">
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <div>
              <h3 style={{ color: "var(--forest)" }}>Generator Undangan Masal (Bulk Links &amp; WhatsApp)</h3>
              <p>Masukkan puluhan/ratusan nama tamu sekaligus (satu nama per baris). Sistem akan otomatis membuat link personal &amp; draf pesan WhatsApp siap kirim!</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide">
              Domain Utama Web Undangan
              <input value={domainUrl} onChange={(e) => setDomainUrl(e.target.value)} placeholder="https://nikhah.vercel.app" />
            </label>

            <label className="wide">
              Daftar Nama Tamu (Satu Nama Per Baris)
              <textarea
                rows={6}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Contoh:&#10;Bapak Ahmad &amp; Keluarga&#10;Ibu Siti&#10;Dimas &amp; Partner"
              />
            </label>

            <label className="wide">
              Template Pesan WhatsApp (Gunakan placeholder: &#123;nama&#125;, &#123;mempelai&#125;, &#123;link&#125;)
              <textarea rows={5} value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} />
            </label>
          </div>

          <button
            type="button"
            className="button primary"
            onClick={handleGenerateBulk}
            style={{ width: "100%", marginTop: "20px", padding: "16px" }}
          >
            ⚡ Generate Semua Link &amp; Pesan WA Sekaligus
          </button>

          {generatedGuests.length > 0 && (
            <div style={{ marginTop: "30px", borderTop: "1px dashed var(--line)", paddingTop: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h4 style={{ margin: 0, font: "500 1.3rem 'Playfair Display', serif" }}>
                    Hasil Generator ({generatedGuests.length} Tamu)
                  </h4>
                  <span style={{ fontSize: "0.78rem", color: "#6a7b72" }}>Tautan siap dikirim langsung via WhatsApp atau disalin.</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={copyAllLinks} className="button secondary" style={{ fontSize: "0.78rem", padding: "10px 16px" }}>
                    📋 Salin Semua Link
                  </button>
                  <button type="button" onClick={exportBulkCsv} className="button secondary" style={{ fontSize: "0.78rem", padding: "10px 16px" }}>
                    📊 Ekspor CSV / Excel
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: "14px", maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
                {generatedGuests.map((g, idx) => (
                  <div
                    key={g.id}
                    style={{
                      background: "#fafcfb",
                      border: "1px solid var(--line)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--gold-dark)", fontWeight: "600" }}>#{idx + 1}</span>
                      <h5 style={{ margin: "2px 0 4px", fontSize: "1.05rem", color: "var(--forest)" }}>{g.name}</h5>
                      <a href={g.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#547365", textDecoration: "underline", wordBreak: "break-all" }}>
                        {g.url}
                      </a>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => copySingleText(g.url, "Link undangan")}
                        style={{ padding: "9px 14px", background: "white", border: "1px solid #c4d4cc", borderRadius: "8px", fontSize: "0.76rem", fontWeight: "600" }}
                      >
                        📋 Salin Link
                      </button>
                      <button
                        type="button"
                        onClick={() => copySingleText(g.waText, "Pesan WA")}
                        style={{ padding: "9px 14px", background: "white", border: "1px solid #c4d4cc", borderRadius: "8px", fontSize: "0.76rem", fontWeight: "600" }}
                      >
                        💬 Salin Pesan WA
                      </button>
                      <a
                        href={g.waUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "9px 16px",
                          background: "#25D366",
                          color: "white",
                          borderRadius: "8px",
                          fontSize: "0.76rem",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        📲 Kirim WA ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

        {/* 2. Keamanan PIN Admin */}
        <div className="form-card" id="keamanan">
          <div className="form-title">
            <span>02</span>
            <div>
              <h3>Keamanan &amp; PIN Akses Halaman Edit</h3>
              <p>Ubah PIN rahasia untuk mencegah sembarang orang mengubah isi undangan.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="wide">
              PIN Keamanan Admin (Default: 1234)
              <input
                type="text"
                value={data.adminPin || "1234"}
                onChange={(e) => patch("adminPin", e.target.value)}
                placeholder="Masukkan 4-8 angka/karakter PIN baru"
              />
            </label>
          </div>
        </div>

        {/* 3. Detail Acara */}
        <div className="form-card" id="acara-edit">
          <div className="form-title">
            <span>03</span>
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

        {/* 4. Amplop Digital & Rekening */}
        <div className="form-card" id="amplop-edit">
          <div className="form-title">
            <span>04</span>
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

        {/* 5. Musik & Media */}
        <div className="form-card" id="musik-edit">
          <div className="form-title">
            <span>05</span>
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

        {/* 6. Galeri Foto */}
        <div className="form-card" id="foto">
          <div className="form-title">
            <span>06</span>
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

        {/* 7. Data RSVP Tamu */}
        <div className="form-card" id="rsvp-admin">
          <div className="form-title">
            <span>07</span>
            <div>
              <h3>Daftar Konfirmasi Kehadiran (RSVP) Realtime</h3>
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
                      <button onClick={() => handleDeleteRSVP(r.id)} style={{ color: "#9b2c2c" }}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 8. Data Buku Tamu */}
        <div className="form-card" id="wishes-admin">
          <div className="form-title">
            <span>08</span>
            <div>
              <h3>Buku Tamu / Doa &amp; Ucapan ({wishes.length}) Realtime</h3>
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
                      <button onClick={() => handleDeleteWish(w.id)} style={{ color: "#9b2c2c" }}>Hapus</button>
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
