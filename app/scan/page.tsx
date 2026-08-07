"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { defaultWedding, type CheckInItem, type WeddingData } from "../wedding-data";
import { subscribeWeddingData, subscribeCheckIns, markGuestCheckInFirebase, deleteCheckInFromFirebase } from "../firebase";
import jsQR from "jsqr";

export default function PalawariScanPage() {
  const [wedding, setWedding] = useState<WeddingData>(defaultWedding);
  const [checkIns, setCheckIns] = useState<CheckInItem[]>([]);
  const [search, setSearch] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Native Camera Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCooldownRef = useRef(false);

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
      stopCameraScanner();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCheckIn = async (guestName: string, isManual = false) => {
    if (!guestName) return;
    const slug = encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, "-"));
    const existing = checkIns.find(
      (c) => (c.slug || "").toLowerCase() === slug.toLowerCase() || c.guestName.toLowerCase() === guestName.toLowerCase()
    );

    if (existing) {
      await deleteCheckInFromFirebase(existing.id);
      showToast(`Batal Check-In: ${guestName}`);
    } else {
      await markGuestCheckInFirebase(guestName, isManual);
      setLastScanned(guestName);
      showToast(`🎉 ✓ SCAN BERHASIL: ${guestName} (SUDAH HADIR)`);
    }
  };

  // Frame Loop for Scanning QR Codes with jsQR
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data && !isCooldownRef.current) {
        isCooldownRef.current = true;
        handleCheckIn(code.data);

        // 2 second cooldown before next scan
        setTimeout(() => {
          isCooldownRef.current = false;
        }, 2000);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Start Native HTML5 Camera
  const startCameraScanner = async () => {
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        showToast("Perangkat/browser Anda tidak mendukung akses kamera HTML5.");
        return;
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Try back camera first, fallback to any available camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play().catch(() => {});
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
      }, 100);

      showToast("Kamera aktif! Arahkan ke Kode QR di HP Tamu.");
    } catch (err: any) {
      console.error("Camera access error:", err);
      showToast(`Gagal membuka kamera: ${err?.message || "Izin kamera ditolak."}`);
    }
  };

  // Stop Native HTML5 Camera
  const stopCameraScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleCheckIn(manualInput.trim(), true);
    setManualInput("");
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink)", padding: "16px", maxWidth: "100vw", overflowX: "hidden" }}>
      {toastMsg && <div className="toast-notification">✓ {toastMsg}</div>}

      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Top Header */}
        <header
          style={{
            background: "var(--forest)",
            color: "white",
            padding: "20px 18px",
            borderRadius: "18px",
            marginBottom: "20px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.72rem", letterSpacing: "0.18em", color: "var(--gold-light)" }}>
              MODE PALAWARI / RECEPTIONIST
            </span>
            <Link href="/edit" style={{ fontSize: "0.72rem", color: "#a8bdb3", textDecoration: "underline" }}>
              ⚙️ Admin
            </Link>
          </div>

          <h1 style={{ font: "500 1.7rem 'Playfair Display', serif", margin: "0 0 4px" }}>
            Presensi Check-In {couple}
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#b8c9c0", margin: "0 0 16px" }}>
            Arahkan kamera HP ke Kode QR di HP tamu untuk mencatat kehadiran.
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "14px 16px",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <small style={{ fontSize: "0.68rem", opacity: 0.8, display: "block" }}>TOTAL HADIR DI VENUE</small>
              <strong style={{ font: "500 1.8rem 'Playfair Display', serif", color: "var(--gold-light)" }}>
                {checkIns.length} Orang
              </strong>
            </div>
            <span className="badge-attendance hadir" style={{ padding: "6px 14px", fontSize: "0.78rem" }}>
              ✓ FIREBASE LIVE
            </span>
          </div>
        </header>

        {/* NATIVE CAMERA QR SCANNER BOX */}
        <div style={{ background: "white", padding: "20px 16px", borderRadius: "18px", border: "2px solid var(--forest)", marginBottom: "20px", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ font: "500 1.2rem 'Playfair Display', serif", margin: 0, color: "var(--forest)" }}>
              📷 Kamera Scanner QR Code
            </h3>
            {isCameraActive ? (
              <button
                onClick={stopCameraScanner}
                style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 14px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "600" }}
              >
                ⏹ Matikan Kamera
              </button>
            ) : (
              <button
                onClick={startCameraScanner}
                className="button primary"
                style={{ padding: "10px 18px", borderRadius: "99px", fontSize: "0.8rem" }}
              >
                📷 Buka Kamera Scanner
              </button>
            )}
          </div>

          {/* Hidden Offscreen Canvas for Frame Reading */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Native Video Stream Viewport */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "380px",
              minHeight: isCameraActive ? "260px" : "160px",
              margin: "0 auto",
              background: "#12241d",
              borderRadius: "16px",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              color: "white",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: isCameraActive ? "280px" : "0px",
                objectFit: "cover",
                display: isCameraActive ? "block" : "none",
              }}
            />

            {!isCameraActive && (
              <div style={{ padding: "25px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>📱 Kamera Presensi</p>
                <p style={{ fontSize: "0.82rem", color: "#a8bdb3", margin: "0 0 14px" }}>
                  Tekan tombol di bawah untuk mengaktifkan kamera HP penerima tamu.
                </p>
                <button onClick={startCameraScanner} className="button light" style={{ fontSize: "0.8rem", padding: "12px 24px" }}>
                  ▶ Mulai Scan Kamera
                </button>
              </div>
            )}
          </div>

          {lastScanned && (
            <div style={{ marginTop: "14px", padding: "12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", color: "#166534", fontSize: "0.88rem" }}>
              🎉 <strong>Tamu Terakhir:</strong> {lastScanned} (HADIR ✓)
            </div>
          )}
        </div>

        {/* Quick Check-In Manual Input */}
        <div style={{ background: "white", padding: "20px 16px", borderRadius: "18px", border: "1px solid var(--line)", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
          <h3 style={{ font: "500 1.15rem 'Playfair Display', serif", margin: "0 0 6px" }}>
            ⚡ Check-In Cepat / Tamu Link Manual
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#687970", margin: "0 0 12px" }}>
            Ketikkan nama tamu (misal: <strong>Enjel &amp; Suami</strong>) jika QR Code tidak bisa di-scan:
          </p>

          <form onSubmit={handleManualAdd} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Ketik nama tamu di sini..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--sage)",
                outline: "none",
                fontSize: "0.9rem",
              }}
            />
            <button type="submit" className="button primary" style={{ borderRadius: "10px", padding: "12px 18px", fontSize: "0.85rem" }}>
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
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid var(--sage)",
              background: "white",
              fontSize: "0.95rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              outline: "none",
            }}
          />
        </div>

        {/* List of Recent Check-Ins */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid var(--line)", padding: "18px 16px", boxShadow: "var(--shadow)" }}>
          <h4 style={{ margin: "0 0 14px", font: "500 1.05rem 'Playfair Display', serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>📋 Daftar Presensi Lokasi</span>
            <small style={{ fontSize: "0.75rem", color: "#77887e", fontWeight: "normal" }}>({checkIns.length} Checked In)</small>
          </h4>

          {checkIns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "#889990" }}>
              <p style={{ margin: "0 0 4px", fontSize: "1rem" }}>📌 Belum ada tamu yang di-check in.</p>
              <small>Gunakan Kamera Scanner di atas atau ketik nama tamu untuk mencentang kehadiran.</small>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {checkIns
                .filter((c) => c.guestName.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong style={{ font: "500 1rem 'Playfair Display', serif", color: "#065f46", display: "block" }}>
                        ✓ {c.guestName}
                      </strong>
                      <small style={{ fontSize: "0.72rem", color: "#166534" }}>
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
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Batal
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
