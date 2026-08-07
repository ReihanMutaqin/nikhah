"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultWedding, type CheckInItem, type WeddingData } from "../wedding-data";
import { subscribeWeddingData, subscribeCheckIns, markGuestCheckInFirebase, deleteCheckInFromFirebase } from "../firebase";

export default function PalawariScanPage() {
  const [wedding, setWedding] = useState<WeddingData>(defaultWedding);
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [search, setSearch] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const couple = `${wedding.bride || "Aruna"} & ${wedding.groom || "Bima"}`;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `Presensi Palawari — ${couple}`;
    }
  }, [couple]);

  useEffect(() => {
    const unsubWedding = subscribeWeddingData((data) => {
      if (data) setWedding(data);
    });
    const unsubCheckIns = subscribeCheckIns((list) => {
      if (list) setCheckIns(list);
    });
    return () => {
      unsubWedding();
      unsubCheckIns();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCheckIn = async (guestName: string, isManual = false) => {
    const slug = encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, "-"));
    const existing = checkIns.find((c) => (c.slug || "").toLowerCase() === slug.toLowerCase() || c.guestName.toLowerCase() === guestName.toLowerCase());

    if (existing) {
      await deleteCheckInFromFirebase(existing.id);
      showToast(`Batal Check-In: ${guestName}`);
    } else {
      await markGuestCheckInFirebase(guestName, isManual);
      showToast(`✓ CHECK-IN SUCCESS: ${guestName} (HADIR)`);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleCheckIn(manualInput.trim(), true);
    setManualInput("");
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink)", padding: "20px" }}>
      {toastMsg && <div className="toast-notification">✓ {toastMsg}</div>}

      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Top Header */}
        <header
          style={{
            background: "var(--forest)",
            color: "white",
            padding: "25px 24px",
            borderRadius: "20px",
            marginBottom: "24px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.18em", color: "var(--gold-light)" }}>
              MODE PALAWARI / RECEPTIONIST
            </span>
            <Link href="/edit" style={{ fontSize: "0.75rem", color: "#a8bdb3", textDecoration: "underline" }}>
              ⚙️ Ruang Edit Admin
            </Link>
          </div>

          <h1 style={{ font: "500 2rem 'Playfair Display', serif", margin: "0 0 6px" }}>
            Presensi Check-In {couple}
          </h1>
          <p style={{ fontSize: "0.84rem", color: "#b8c9c0", margin: "0 0 20px" }}>
            Halaman khusus petugas penerima tamu di venue. Semua presensi tersinkron secara live.
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "16px 20px",
              borderRadius: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <small style={{ fontSize: "0.7rem", opacity: 0.8, display: "block" }}>TOTAL HADIR DI VENUE</small>
              <strong style={{ font: "500 2rem 'Playfair Display', serif", color: "var(--gold-light)" }}>
                {checkIns.length} Orang
              </strong>
            </div>
            <span className="badge-attendance hadir" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ✓ LIVE FIREBASE CONNECTED
            </span>
          </div>
        </header>

        {/* Quick Check-In Manual Input */}
        <div style={{ background: "white", padding: "24px", borderRadius: "18px", border: "1px solid var(--line)", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
          <h3 style={{ font: "500 1.2rem 'Playfair Display', serif", margin: "0 0 8px" }}>
            ⚡ Check-In Cepat Nama Tamu Baru / Link Manual
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#687970", margin: "0 0 14px" }}>
            Ketikkan nama tamu (misal: <strong>Enjel &amp; Suami</strong> atau <strong>Bapak Ahmad</strong>) jika tidak ada di daftar:
          </p>

          <form onSubmit={handleManualAdd} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Ketik nama tamu di sini..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--sage)",
                outline: "none",
                fontSize: "0.95rem",
              }}
            />
            <button type="submit" className="button primary" style={{ borderRadius: "12px", padding: "14px 22px" }}>
              ✓ Check-In
            </button>
          </form>
        </div>

        {/* Search & Filter */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="🔍 Cari nama tamu (Contoh: Enjel, Ahmad, Dimas)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--sage)",
              background: "white",
              fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              outline: "none",
            }}
          />
        </div>

        {/* List of Recent Check-Ins & All Guests */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid var(--line)", padding: "20px", boxShadow: "var(--shadow)" }}>
          <h4 style={{ margin: "0 0 16px", font: "500 1.1rem 'Playfair Display', serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>📋 Daftar Presensi Lokasi</span>
            <small style={{ fontSize: "0.75rem", color: "#77887e", fontWeight: "normal" }}>({checkIns.length} Checked In)</small>
          </h4>

          {checkIns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "35px 20px", color: "#889990" }}>
              <p style={{ margin: "0 0 6px", fontSize: "1.1rem" }}>📌 Belum ada tamu yang di-check in.</p>
              <small>Gunakan kolom cari di atas atau ketik nama tamu untuk mencentang kehadiran.</small>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {checkIns
                .filter((c) => c.guestName.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ font: "500 1.1rem 'Playfair Display', serif", color: "#065f46", display: "block" }}>
                        ✓ {c.guestName}
                      </strong>
                      <small style={{ fontSize: "0.75rem", color: "#166534" }}>
                        Checked-in pukul {c.timestamp} WIB {c.isManualLink ? "(Link Manual)" : ""}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckIn(c.guestName)}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Batal Check-In
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
