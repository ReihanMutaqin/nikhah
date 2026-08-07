"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultWedding, type BankAccount, type EventItem, type RSVPItem, type WeddingData, type WishItem, type CheckInItem } from "../wedding-data";
import {
  subscribeWeddingData,
  saveWeddingDataToFirebase,
  subscribeWishes,
  deleteWishFromFirebase,
  subscribeRSVPs,
  deleteRSVPFromFirebase,
  subscribeCheckIns,
  markGuestCheckInFirebase,
  deleteCheckInFromFirebase,
} from "../firebase";
import { STORAGE_KEY } from "../WeddingInvitation";

export default function EditPage() {
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);

  // Security Auth PIN state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [savingLoading, setSavingLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Bulk Links & Palawari State
  const [baseUrl, setBaseUrl] = useState("https://nikhahan.vercel.app");
  const [rawGuestNames, setRawGuestNames] = useState(
    "Bapak Ahmad & Keluarga\nIbu Siti & Suami\nDimas & Partner\nSahabat Alumnus SMA 1\nRian Hidayat\nEnjel & Suami"
  );
  const [waTemplate, setWaTemplate] = useState(
    "Kepada Yth. {nama}\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:\n{mempelai}\n\nDetail lengkap acara & konfirmasi kehadiran dapat dilihat melalui link undangan berikut:\n{link}\n\nMerupakan suatu kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih."
  );
  const [generatedGuests, setGeneratedGuests] = useState<{ name: string; slug: string; url: string; waMessage: string }[]>([]);

  // Palawari Check-In Search / Direct input
  const [palawariSearch, setPalawariSearch] = useState("");
  const [directGuestName, setDirectGuestName] = useState("");

  const brideName = data?.bride || defaultWedding.bride;
  const groomName = data?.groom || defaultWedding.groom;
  const couple = `${brideName} & ${groomName}`;
  const brideInitial = brideName ? brideName[0] : "A";
  const groomInitial = groomName ? groomName[0] : "B";
  const initials = `${brideInitial}${groomInitial}`;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `Edit Undangan — ${couple}`;
    }
  }, [couple]);

  // Check auth session
  useEffect(() => {
    const authSession = sessionStorage.getItem("ruang-temu-auth");
    if (authSession === "true") {
      setIsAuthorized(true);
    }
  }, []);

  // 1. Subscribe to Firebase Realtime Sync
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        setData({ ...defaultWedding, ...JSON.parse(savedData) });
      }
    } catch (e) {}

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
    });

    const unsubscribeWishes = subscribeWishes((fbWishes) => {
      if (fbWishes) setWishes(fbWishes);
    });

    const unsubscribeRSVPs = subscribeRSVPs((fbRSVPs) => {
      if (fbRSVPs) setRsvps(fbRSVPs);
    });

    const unsubscribeCheckIns = subscribeCheckIns((fbCheckIns) => {
      if (fbCheckIns) setCheckIns(fbCheckIns);
    });

    return () => {
      unsubscribeWedding();
      unsubscribeWishes();
      unsubscribeRSVPs();
      unsubscribeCheckIns();
    };
  }, []);

  // Generate Bulk Guest Links
  useEffect(() => {
    const lines = rawGuestNames
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const list = lines.map((name) => {
      const slug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
      const url = `${baseUrl.replace(/\/$/, "")}/${slug}`;
      const msg = waTemplate
        .replace(/{nama}/g, name)
        .replace(/{mempelai}/g, couple)
        .replace(/{link}/g, url);
      return { name, slug, url, waMessage: msg };
    });
    setGeneratedGuests(list);
  }, [rawGuestNames, baseUrl, waTemplate, couple]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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
    const res = await saveWeddingDataToFirebase(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage quota full, using Firebase memory sync:", e);
    }
    setSavingLoading(false);

    if (res.success) {
      setSaved(true);
      showToast("Tersimpan secara Live! Perubahan Anda langsung ter-update.");
      setTimeout(() => setSaved(false), 2500);
    } else {
      showToast(`Gagal menyimpan: ${res.message || "Permission denied"}.`);
    }
  };

  // Automatic Client-side Image Compression (Prevents Firebase 'Write too large' 256KB error)
  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.72): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(e.target?.result as string);
      };
      reader.onerror = () => resolve("");
    });
  };

  const uploadCoverPhoto = async (file: File) => {
    showToast("Mengoptimalkan foto sampul...");
    const compressed = await compressImageFile(file, 1400, 0.75);
    patch("heroImage", compressed);
    showToast("✓ Foto sampul berhasil diperbarui! Klik 'Simpan Perubahan' di atas.");
  };

  const replaceGalleryPhoto = async (file: File, index: number) => {
    showToast("Mengoptimalkan foto galeri...");
    const compressed = await compressImageFile(file, 1200, 0.72);
    setData((d) => ({
      ...d,
      gallery: d.gallery.map((x, i) => (i === index ? compressed : x)),
    }));
    showToast(`✓ Foto galeri #${index + 1} berhasil diganti.`);
  };

  const appendGalleryPhotos = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    showToast(`Mengompres & memproses ${fileArray.length} foto...`);

    const compressedList: string[] = [];
    for (const file of fileArray) {
      const res = await compressImageFile(file, 1200, 0.72);
      if (res) compressedList.push(res);
    }

    if (compressedList.length > 0) {
      setData((d) => ({
        ...d,
        gallery: [...d.gallery, ...compressedList],
      }));
      showToast(`✓ Berhasil menambahkan ${compressedList.length} foto ke galeri! Klik 'Simpan Perubahan' di kanan atas.`);
    }
  };

  const uploadAudio = (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("File audio terlalu besar (maksimal 8MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch("musicUrl", String(reader.result));
      showToast("Lagu MP3 berhasil diunggah! Klik Simpan ke Firebase.");
    };
    reader.readAsDataURL(file);
  };

  const exportData = () => {
    const fullData = { wedding: data, rsvps, wishes, checkIns, bulkGuests: generatedGuests };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wedding-data-backup-${Date.now()}.json`;
    a.click();
    showToast("Data backup JSON berhasil diunduh!");
  };

  // Helper functions for events & bank
  const updateEvent = (index: number, field: keyof EventItem, val: string) => {
    const newEvents = [...data.events];
    newEvents[index] = { ...newEvents[index], [field]: val };
    patch("events", newEvents);
  };

  const addBankAccount = () => {
    const newBank: BankAccount = {
      id: "bank-" + Date.now(),
      bank: "BCA",
      accountNumber: "1234567890",
      accountHolder: brideName || "Nama Pemilik",
      logoText: "BANK",
    };
    patch("bankAccounts", [...data.bankAccounts, newBank]);
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
    showToast("Ucapan berhasil dihapus.");
  };

  const handleDeleteRSVP = async (id: string) => {
    await deleteRSVPFromFirebase(id);
    showToast("RSVP berhasil dihapus.");
  };

  // Palawari Check-In Handlers
  const handleToggleCheckIn = async (guestName: string, isManual = false) => {
    const slug = encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, "-"));
    const existing = checkIns.find((c) => (c.slug || "").toLowerCase() === slug.toLowerCase() || c.guestName.toLowerCase() === guestName.toLowerCase());

    if (existing) {
      await deleteCheckInFromFirebase(existing.id);
      showToast(`Batal Check-In: ${guestName}`);
    } else {
      await markGuestCheckInFirebase(guestName, isManual);
      showToast(`✓ CHECK-IN BERHASIL: ${guestName} (SUDAH HADIR)`);
    }
  };

  const handleDirectCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directGuestName.trim()) return;
    handleToggleCheckIn(directGuestName.trim(), true);
    setDirectGuestName("");
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
              fontSize: "1.4rem",
              fontWeight: "bold",
            }}
          >
            🔒
          </div>
          <h2 style={{ font: "500 2rem 'Playfair Display', serif", margin: "0 0 10px" }}>Pengamanan Admin</h2>
          <p style={{ fontSize: "0.86rem", color: "#b2c7bd", margin: "0 0 25px", lineHeight: "1.6" }}>
            Masukkan PIN Keamanan untuk membuka halaman edit isi undangan &amp; fitur Palawari.
          </p>

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "15px" }}>
            <input
              type="password"
              placeholder="Masukkan PIN (Default: 1234)"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              style={{
                padding: "14px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                textAlign: "center",
                fontSize: "1.1rem",
                letterSpacing: "0.2em",
                outline: "none",
              }}
              autoFocus
            />

            {pinError && (
              <p style={{ color: "#f87171", fontSize: "0.8rem", margin: 0, fontWeight: "600" }}>
                ❌ PIN salah! Silakan periksa kembali.
              </p>
            )}

            <button type="submit" className="button light" style={{ width: "100%", marginTop: "6px" }}>
              🔓 Masuk Ruang Edit
            </button>
          </form>

          <Link href="/" style={{ display: "block", marginTop: "22px", fontSize: "0.78rem", color: "#a8bdb3", textDecoration: "underline" }}>
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
          <span>{initials}</span> {couple}
        </Link>
        <div>
          <p style={{ color: "#77ffbb", fontWeight: "bold" }}>🔥 FIREBASE REALTIME DB CONNECTED</p>
          <h1>Manajer Undangan</h1>
          <span>Semua edit &amp; presensi Palawari tersinkronisasi ke seluruh HP &amp; perangkat secara live.</span>
        </div>
        <nav>
          <a href="#palawari" style={{ color: "#77ffbb", fontWeight: "bold" }}>🎯 09. Presensi Palawari (Scan)</a>
          <a href="#bulk">⚡ Generator Undangan Masal</a>
          <a href="#informasi">1. Informasi Mempelai</a>
          <a href="#keamanan">2. Keamanan PIN Admin</a>
          <a href="#acara-edit">3. Detail Acara</a>
          <a href="#rekening">4. Rekening &amp; Kado</a>
          <a href="#musik-edit">5. Musik &amp; Autoplay</a>
          <a href="#foto">6. Galeri Foto</a>
          <a href="#rsvp-data">7. Data RSVP ({rsvps.length})</a>
          <a href="#wishes-data">8. Buku Tamu ({wishes.length})</a>
        </nav>
        <button
          onClick={handleLogout}
          className="preview-link"
          style={{ cursor: "pointer", background: "rgba(255, 99, 99, 0.2)", border: "1px solid rgba(255, 99, 99, 0.4)", color: "#ffaaaa" }}
        >
          🔒 Kunci Ruang Edit (Logout)
        </button>
      </aside>

      <div className="editor-main">
        <div className="editor-top">
          <div>
            <span className="eyebrow">WEDDING CONTENT MANAGER + REALTIME FIREBASE SYNC</span>
            <h2>Pengaturan Undangan Cloud Protected</h2>
          </div>
          <div className="editor-actions">
            <button onClick={exportData} style={{ cursor: "pointer" }}>
              💾 Ekspor Data JSON
            </button>
            <button className="save-button" onClick={save} disabled={savingLoading} style={{ cursor: "pointer" }}>
              {savingLoading ? "Menyimpan..." : saved ? "✓ Tersimpan!" : "🔥 Simpan Perubahan ke Firebase"}
            </button>
          </div>
        </div>

        {/* 09. PRESENSI PALAWARI (SCANNER / CHECK-IN RECEPTIONSIST MODE) */}
        <div className="form-card" id="palawari" style={{ border: "2px solid var(--forest)", background: "#f8fdfa" }}>
          <div className="form-title">
            <span style={{ color: "var(--forest)", fontSize: "1.6rem" }}>🎯</span>
            <div>
              <h3 style={{ color: "var(--forest)" }}>09. Scanner Presensi Tamu &amp; Mode Palawari (Receptionist)</h3>
              <p>Penerima tamu di venue dapat men-scan QR code atau mencari nama tamu untuk memberi <b>Centang Hijau (✓ SUDAH HADIR)</b> secara realtime.</p>
            </div>
          </div>

          <div style={{ background: "var(--forest)", color: "white", padding: "20px 24px", borderRadius: "16px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", opacity: 0.8, letterSpacing: "0.1em" }}>TOTAL PRESENSI HADIR LOKASI</span>
              <h2 style={{ font: "500 2.4rem 'Playfair Display', serif", margin: "4px 0 0", color: "var(--gold-light)" }}>
                {checkIns.length} <small style={{ fontSize: "1rem", color: "#a8bdb3" }}>/ {generatedGuests.length} Tamu</small>
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="badge-attendance hadir" style={{ fontSize: "0.85rem", padding: "6px 16px" }}>
                ✓ {checkIns.length} Tamu Ter-scan Di Venue
              </span>
            </div>
          </div>

          {/* Direct Input for unregistered / manual link guests */}
          <form onSubmit={handleDirectCheckInSubmit} style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
            <input
              type="text"
              placeholder="Masukkan nama tamu baru (manual link e.g. Enjel)..."
              value={directGuestName}
              onChange={(e) => setDirectGuestName(e.target.value)}
              style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--line)", background: "white" }}
            />
            <button type="submit" className="button primary" style={{ borderRadius: "10px", padding: "12px 20px" }}>
              ＋ Check-In Tamu Baru
            </button>
          </form>

          {/* Quick Search */}
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="🔍 Cari nama tamu (Contoh: Enjel, Ahmad, Dimas)..."
              value={palawariSearch}
              onChange={(e) => setPalawariSearch(e.target.value)}
              style={{ width: "100%", padding: "14px 18px", borderRadius: "12px", border: "1px solid var(--sage)", background: "white", fontSize: "1rem" }}
            />
          </div>

          {/* Palawari Guest Checklist Table */}
          <div style={{ maxHeight: "420px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "12px", background: "white" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Tamu Undangan</th>
                  <th>Status Presensi Venue</th>
                  <th>Waktu Scan</th>
                  <th>Aksi Palawari</th>
                </tr>
              </thead>
              <tbody>
                {generatedGuests
                  .filter((g) => g.name.toLowerCase().includes(palawariSearch.toLowerCase()))
                  .map((g, idx) => {
                    const isChecked = checkIns.some(
                      (c) => (c.slug || "").toLowerCase() === g.slug.toLowerCase() || c.guestName.toLowerCase() === g.name.toLowerCase()
                    );
                    const checkObj = checkIns.find(
                      (c) => (c.slug || "").toLowerCase() === g.slug.toLowerCase() || c.guestName.toLowerCase() === g.name.toLowerCase()
                    );

                    return (
                      <tr key={g.slug + idx} style={{ background: isChecked ? "#f0fdf4" : "white" }}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{g.name}</strong>
                          <br />
                          <small style={{ color: "#7a8a81" }}>{g.url}</small>
                        </td>
                        <td>
                          {isChecked ? (
                            <span className="badge-attendance hadir" style={{ background: "#d1fae5", color: "#065f46", fontSize: "0.8rem", fontWeight: "700" }}>
                              ✓ SUDAH HADIR / CHECKED IN
                            </span>
                          ) : (
                            <span className="badge-attendance ragu" style={{ fontSize: "0.75rem" }}>
                              ? Belum Tiba
                            </span>
                          )}
                        </td>
                        <td>{checkObj?.timestamp || "—"}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleCheckIn(g.name)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontWeight: "600",
                              fontSize: "0.78rem",
                              background: isChecked ? "#fee2e2" : "var(--forest)",
                              color: isChecked ? "#991b1b" : "white",
                              cursor: "pointer",
                            }}
                          >
                            {isChecked ? "✕ Batal Check-In" : "✓ CENTANG HADIR"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BULK GUEST LINK GENERATOR */}
        <div className="form-card" id="bulk" style={{ border: "2px solid var(--gold)" }}>
          <div className="form-title">
            <span style={{ color: "var(--gold)" }}>⚡</span>
            <div>
              <h3>Generator Undangan Masal (Bulk Links &amp; WhatsApp)</h3>
              <p>Masukkan puluhan/ratusan nama tamu sekaligus (satu nama per baris). Sistem akan otomatis membuat link personal &amp; draf pesan WhatsApp siap kirim!</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide">
              Domain Utama Web Undangan
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://nikhahan.vercel.app" />
            </label>

            <label className="wide">
              Daftar Nama Tamu (Satu Nama Per Baris)
              <textarea
                rows={6}
                value={rawGuestNames}
                onChange={(e) => setRawGuestNames(e.target.value)}
                placeholder="Bapak Ahmad &amp; Keluarga&#10;Ibu Siti&#10;Dimas &amp; Partner"
              />
            </label>

            <label className="wide">
              Template Pesan WhatsApp (Gunakan placeholder: &#123;nama&#125;, &#123;mempelai&#125;, &#123;link&#125;)
              <textarea rows={4} value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} />
            </label>
          </div>

          {/* Table Result of Generated Links */}
          <div style={{ marginTop: "25px", overflowX: "auto" }}>
            <h4 style={{ margin: "0 0 12px", font: "500 1.1rem 'Playfair Display', serif" }}>
              📋 Hasil Draf Undangan ({generatedGuests.length} Link Tamu Tergenerate)
            </h4>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Tamu</th>
                  <th>Link Khusus Undangan</th>
                  <th>Kirim WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {generatedGuests.map((g, idx) => (
                  <tr key={g.slug + idx}>
                    <td>{idx + 1}</td>
                    <td><strong>{g.name}</strong></td>
                    <td>
                      <a href={g.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--forest)" }}>
                        {g.url}
                      </a>
                    </td>
                    <td>
                      <a
                        className="action-btn"
                        style={{ background: "#25D366", color: "white", borderColor: "#25D366" }}
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(g.waMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        💬 Kirim WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. Informasi Mempelai */}
        <div className="form-card" id="informasi">
          <div className="form-title">
            <span>01</span>
            <div>
              <h3>Informasi Mempelai &amp; Waktu</h3>
              <p>Ubah nama pengantin, tanggal pernikahan, dan kutipan cerita cinta.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Nama Pengantin Wanita
              <input value={data.bride} onChange={(e) => patch("bride", e.target.value)} />
            </label>
            <label>
              Orang Tua Pengantin Wanita
              <input value={data.brideParents} onChange={(e) => patch("brideParents", e.target.value)} />
            </label>
            <label>
              Nama Pengantin Pria
              <input value={data.groom} onChange={(e) => patch("groom", e.target.value)} />
            </label>
            <label>
              Orang Tua Pengantin Pria
              <input value={data.groomParents} onChange={(e) => patch("groomParents", e.target.value)} />
            </label>
            <label>
              Tanggal Singkat (Contoh: 12 . 12 . 2026)
              <input value={data.date} onChange={(e) => patch("date", e.target.value)} />
            </label>
            <label>
              Tanggal Lengkap (Contoh: Sabtu, 12 Desember 2026)
              <input value={data.dateLong} onChange={(e) => patch("dateLong", e.target.value)} />
            </label>
            <label className="wide">
              Tanggal &amp; Waktu Target Hitung Mundur (ISO Format: YYYY-MM-DDTHH:mm:ss)
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
              <h4>Acara #{i + 1}</h4>
              <div className="form-grid">
                <label>
                  Nama Acara (Contoh: Akad Nikah)
                  <input value={ev.title} onChange={(e) => updateEvent(i, "title", e.target.value)} />
                </label>
                <label>
                  Waktu (Contoh: 08.00 — 10.00 WIB)
                  <input value={ev.time} onChange={(e) => updateEvent(i, "time", e.target.value)} />
                </label>
                <label>
                  Nama Tempat / Gedung
                  <input value={ev.place} onChange={(e) => updateEvent(i, "place", e.target.value)} />
                </label>
                <label>
                  Alamat Lengkap
                  <input value={ev.address} onChange={(e) => updateEvent(i, "address", e.target.value)} />
                </label>
                <label className="wide">
                  Link Google Maps
                  <input value={ev.mapsUrl || ""} onChange={(e) => updateEvent(i, "mapsUrl", e.target.value)} />
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Rekening & Kado */}
        <div className="form-card" id="rekening">
          <div className="form-title">
            <span>04</span>
            <div>
              <h3>Amplop Digital &amp; Hadiah Fisik</h3>
              <p>Kelola rekening bank/e-wallet untuk tanda kasih tamu.</p>
            </div>
          </div>

          {data.bankAccounts.map((b) => (
            <div className="form-grid" key={b.id} style={{ marginBottom: "15px", borderBottom: "1px solid var(--line)", paddingBottom: "15px" }}>
              <label>
                Nama Bank / E-Wallet
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
              Nomor Telepon
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
              <h3>Lagu Latar (Audio Background &amp; Autoplay)</h3>
              <p>Unggah file MP3 langsung dari perangkat Anda atau tempelkan URL lagu MP3.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="wide">
              Unggah File MP3 Musik Pernikahan
              <input
                type="file"
                accept="audio/mp3,audio/*"
                onChange={(e) => uploadAudio(e.target.files?.[0])}
                style={{ padding: "10px", background: "var(--sage-light)", borderRadius: "8px", cursor: "pointer" }}
              />
            </label>

            <label className="wide">
              Atau Gunakan URL File Audio (.mp3)
              <input
                value={data.musicUrl || ""}
                onChange={(e) => patch("musicUrl", e.target.value)}
                placeholder="https://.../lagu.mp3"
              />
            </label>

            {data.musicUrl && (
              <div className="wide" style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--forest)", marginBottom: "6px" }}>
                  🔊 Tes Pemutar Lagu:
                </p>
                <audio controls src={data.musicUrl} style={{ width: "100%", borderRadius: "8px" }} />
              </div>
            )}
          </div>
        </div>

        {/* 6. Galeri Foto */}
        <div className="form-card photo-editor" id="foto">
          <div className="form-title">
            <span>06</span>
            <div>
              <h3>Foto Sampul Utama &amp; Galeri Pre-Wedding</h3>
              <p>Unggah foto langsung dari HP/laptop Anda atau ganti URL foto.</p>
            </div>
          </div>

          {/* FOTO SAMPUL UTAMA */}
          <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--forest)", marginBottom: "10px", display: "block" }}>
            Foto Sampul Utama (Cover Banner)
          </label>

          <div
            className="hero-upload"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url('${data.heroImage || defaultWedding.heroImage}')`,
              marginBottom: "16px",
            }}
          >
            <label style={{ cursor: "pointer", zIndex: 2 }}>
              <span>📷 Unggah / Ganti Foto Sampul</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadCoverPhoto(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: "8px", fontSize: "0.78rem", fontWeight: 600, color: "#5d6d65", marginBottom: "30px" }}>
            Atau Tempel URL Link Foto Sampul
            <input
              type="text"
              value={data.heroImage || ""}
              onChange={(e) => patch("heroImage", e.target.value)}
              placeholder="https://.../foto-sampul.jpg"
              style={{ border: "1px solid #d9e0dc", padding: "12px 14px", borderRadius: "10px", background: "#fafbf9", outline: "none" }}
            />
          </label>

          {/* GALERI PRE-WEDDING */}
          <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--forest)", marginBottom: "12px", display: "block" }}>
            Galeri Foto Pre-Wedding ({data.gallery.length} Foto)
          </label>

          <div className="thumb-grid">
            {data.gallery.map((src, i) => (
              <div className="thumb" key={i}>
                <img src={src} alt={`Pre-wedding ${i + 1}`} />
                <label style={{ cursor: "pointer" }}>
                  🔄 Ganti
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && replaceGalleryPhoto(e.target.files[0], i)}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => patch("gallery", data.gallery.filter((_, idx) => idx !== i))}
                  title="Hapus Foto"
                >
                  ✕
                </button>
              </div>
            ))}

            <label className="add-photo" style={{ cursor: "pointer" }}>
              <b>＋</b>
              <span>Tambah Banyak Foto</span>
              <small style={{ fontSize: "0.65rem", opacity: 0.8, display: "block" }}>Pilih beberapa foto sekaligus</small>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && appendGalleryPhotos(e.target.files)}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {/* 7. Data RSVP */}
        <div className="form-card" id="rsvp-data">
          <div className="form-title">
            <span>07</span>
            <div>
              <h3>Daftar Konfirmasi Kehadiran (RSVP)</h3>
              <p>Statistik kehadiran tamu yang mengisi formulir RSVP secara live dari cloud Firebase.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div style={{ background: "var(--sage-light)", padding: "14px 20px", borderRadius: "12px", flex: 1 }}>
              <small style={{ color: "#6a7b72" }}>Total Tamu Konfirmasi Hadir</small>
              <h3 style={{ margin: "4px 0 0", color: "var(--forest)", fontSize: "1.6rem" }}>{totalAttending} Orang</h3>
            </div>
            <div style={{ background: "var(--sage-light)", padding: "14px 20px", borderRadius: "12px", flex: 1 }}>
              <small style={{ color: "#6a7b72" }}>Total Formulir RSVP Terisi</small>
              <h3 style={{ margin: "4px 0 0", color: "var(--forest)", fontSize: "1.6rem" }}>{rsvps.length} Respon</h3>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Nama Tamu</th>
                  <th>Status Kehadiran</th>
                  <th>Jumlah Tamu</th>
                  <th>Catatan / Pesan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                      Belum ada konfirmasi RSVP dari tamu.
                    </td>
                  </tr>
                ) : (
                  rsvps.map((r) => (
                    <tr key={r.id}>
                      <td>{r.timestamp}</td>
                      <td><strong>{r.guestName}</strong></td>
                      <td>
                        <span className={`badge-attendance ${r.attendance}`}>
                          {r.attendance === "hadir" ? "✓ Hadir" : r.attendance === "tidak" ? "✕ Tidak Hadir" : "? Ragu"}
                        </span>
                      </td>
                      <td>{r.guestCount || 1} Orang</td>
                      <td>{r.message || "—"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteRSVP(r.id)}
                          style={{ color: "#9b2c2c", background: "#fde8e8", padding: "4px 10px", borderRadius: "6px" }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. Buku Tamu (Wishes) */}
        <div className="form-card" id="wishes-data">
          <div className="form-title">
            <span>08</span>
            <div>
              <h3>Buku Tamu &amp; Doa Restu ({wishes.length})</h3>
              <p>Daftar ucapan manis &amp; doa restu dari para sahabat dan keluarga yang tersimpan di cloud Firebase.</p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Nama Tamu</th>
                  <th>Hubungan</th>
                  <th>Pesan / Doa Restu</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {wishes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                      Belum ada ucapan dari tamu.
                    </td>
                  </tr>
                ) : (
                  wishes.map((w) => (
                    <tr key={w.id}>
                      <td>{w.timestamp}</td>
                      <td><strong>{w.name}</strong></td>
                      <td><span className="wish-badge">{w.relation}</span></td>
                      <td>“{w.message}”</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteWish(w.id)}
                          style={{ color: "#9b2c2c", background: "#fde8e8", padding: "4px 10px", borderRadius: "6px" }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
