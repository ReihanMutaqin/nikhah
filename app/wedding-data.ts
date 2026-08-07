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
  bride: "Aruna Kinanti",
  brideParents: "Putri dari Bpk. Bambang & Ibu Sri Hastuti",
  groom: "Bima Sampurna",
  groomParents: "Putra dari Bpk. Herman & Ibu Ratna Dewi",
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
      place: "Grand Ballroom - The Langham",
      address: "District 8, SCBD, Lot 28, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=The+Langham+Jakarta",
      calendarStart: "20261212T010000Z",
      calendarEnd: "20261212T030000Z",
    },
    {
      title: "Resepsi Pernikahan",
      time: "11.00 — 14.00 WIB",
      place: "Grand Ballroom - The Langham",
      address: "District 8, SCBD, Lot 28, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=The+Langham+Jakarta",
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
  musicUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-wedding-piano-112191.mp3",
  bankAccounts: [
    {
      id: "bca-1",
      bank: "BCA",
      accountNumber: "8820918234",
      accountHolder: "Aruna Kinanti",
      logoText: "BCA",
    },
    {
      id: "mandiri-1",
      bank: "Bank Mandiri",
      accountNumber: "1370019283745",
      accountHolder: "Bima Sampurna",
      logoText: "MANDIRI",
    },
    {
      id: "gopay-1",
      bank: "GoPay / OVO",
      accountNumber: "081298765432",
      accountHolder: "Bima Sampurna",
      logoText: "E-WALLET",
    },
  ],
  giftAddress: {
    recipient: "Aruna & Bima",
    phone: "0812-9876-5432",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan, 12190",
  },
  adminPin: "1234", // Default PIN pengaman
};

export const defaultWishes: WishItem[] = [
  {
    id: "w-1",
    name: "Dimas & Sarah",
    relation: "Sahabat",
    message: "Selamat untuk Aruna & Bima! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Lancar terus sampai hari H yaa! ✨",
    timestamp: "Baru saja",
  },
  {
    id: "w-2",
    name: "Keluarga Besar Sastro",
    relation: "Keluarga",
    message: "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair. Turut bahagia untuk kalian berdua.",
    timestamp: "1 jam lalu",
  },
  {
    id: "w-3",
    name: "Rian Hidayat",
    relation: "Rekan Kerja",
    message: "Happy wedding Bima & Aruna! Semoga makin sukses dan bahagia selalu dalam membina rumah tangga.",
    timestamp: "3 jam lalu",
  },
];
