export type BankAccount = {
  id: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  logoText?: string;
};

export type EventItem = {
  title: string;
  time: string;
  place: string;
  address: string;
  mapsUrl?: string;
  calendarStart?: string;
  calendarEnd?: string;
};

export type RSVPItem = {
  id: string;
  guestName: string;
  attendance: "hadir" | "tidak" | "ragu";
  guestCount: number;
  message?: string;
  timestamp: string;
};

export type WishItem = {
  id: string;
  name: string;
  relation: string;
  message: string;
  timestamp: string;
};

export type CheckInItem = {
  id: string;
  guestName: string;
  slug: string;
  timestamp: string;
  isManualLink?: boolean;
};

export type WeddingData = {
  bride: string;
  brideParents: string;
  groom: string;
  groomParents: string;
  date: string;
  dateLong: string;
  countdownDate: string;
  venue: string;
  heroImage: string;
  quote: string;
  quoteSource: string;
  story: string;
  events: EventItem[];
  gallery: string[];
  musicUrl: string;
  bankAccounts: BankAccount[];
  giftAddress: {
    recipient: string;
    phone: string;
    address: string;
  };
  adminPin: string; // PIN Pengaman untuk akses Halaman Edit
};

export const defaultWedding: WeddingData = {
  bride: "Adira",
  brideParents: "",
  groom: "Reihan",
  groomParents: "",
  date: "12 . 12 . 2026",
  dateLong: "Sabtu, 12 Desember 2026",
  countdownDate: "2026-12-12T08:00:00",
  venue: "The Langham, SCBD Jakarta",
  heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=88",
  quote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
  quoteSource: "QS. Ar-Rum: 21",
  story: "Berawal dari pertemuan tak sengaja di akhir tahun, tumbuh percakapan yang penuh kehangatan, tawa yang menetap, dan keyakinan untuk saling melengkapi. Kini kami mantap melangkah dalam satu tujuan hidup.",
  events: [
    {
      title: "Akad Nikah",
      time: "08.00 — 10.00 WIB",
      place: "Grand Ballroom",
      address: "District 8, SCBD, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Jakarta",
      calendarStart: "20261212T010000Z",
      calendarEnd: "20261212T030000Z",
    },
    {
      title: "Resepsi Pernikahan",
      time: "11.00 — 14.00 WIB",
      place: "Grand Ballroom",
      address: "District 8, SCBD, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Jakarta",
      calendarStart: "20261212T040000Z",
      calendarEnd: "20261212T070000Z",
    },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1519741347686-c1e0a0dfef79?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
  ],
  musicUrl: "", // No default sample music!
  bankAccounts: [
    {
      id: "bca-1",
      bank: "BCA",
      accountNumber: "8820918234",
      accountHolder: "Adira",
      logoText: "BCA",
    },
    {
      id: "mandiri-1",
      bank: "Bank Mandiri",
      accountNumber: "1370019283745",
      accountHolder: "Reihan",
      logoText: "MANDIRI",
    },
  ],
  giftAddress: {
    recipient: "Adira & Reihan",
    phone: "0812-9876-5432",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan",
  },
  adminPin: "1234", // Default PIN pengaman
};

export const defaultWishes: WishItem[] = [
  {
    id: "w-1",
    name: "Dimas & Sarah",
    relation: "Sahabat",
    message: "Selamat untuk Adira & Reihan! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Lancar terus sampai hari H yaa! ✨",
    timestamp: "Baru saja",
  },
  {
    id: "w-2",
    name: "Keluarga Besar",
    relation: "Keluarga",
    message: "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair. Turut bahagia untuk kalian berdua.",
    timestamp: "1 jam lalu",
  },
];
