export type WeddingData = {
  bride: string; groom: string; date: string; dateLong: string; venue: string;
  heroImage: string; quote: string; story: string;
  events: { title: string; time: string; place: string; address: string }[];
  gallery: string[];
};

export const defaultWedding: WeddingData = {
  bride: "Aruna", groom: "Bima", date: "12 . 12 . 2026", dateLong: "Sabtu, 12 Desember 2026", venue: "The Langham, Jakarta",
  heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=88",
  quote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu agar kamu merasa tenteram kepadanya.",
  story: "Dari pertemuan yang sederhana, tumbuh percakapan panjang, tawa yang menetap, dan keyakinan untuk melangkah dalam satu arah. Kini kami ingin merayakan awal perjalanan itu bersama orang-orang terkasih.",
  events: [
    { title: "Akad Nikah", time: "08.00 — 10.00 WIB", place: "The Langham Ballroom", address: "District 8, SCBD, Jakarta Selatan" },
    { title: "Resepsi", time: "11.00 — 14.00 WIB", place: "The Langham Ballroom", address: "District 8, SCBD, Jakarta Selatan" },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1519741347686-c1e0a0dfef79?auto=format&fit=crop&w=1200&q=85",
  ],
};
