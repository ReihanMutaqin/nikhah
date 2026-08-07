# Ruang Temu — Wedding Invitation

Website undangan pernikahan digital dengan landing page utama, undangan personal berdasarkan URL tamu, dan mode editor visual.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Contoh tautan tamu:

- `/reihan&pasangan` → **Reihan & Pasangan**
- `/bapak-budi-dan-keluarga` → **Bapak Budi Dan Keluarga**

## Mode edit

Buka `/edit`. Semua perubahan tersimpan di browser perangkat yang sedang dipakai. Tombol **Ekspor data** menghasilkan cadangan JSON. Foto yang diunggah dikompresi oleh browser sebagai data lokal; gunakan foto yang sudah dioptimasi agar penyimpanan tetap ringan.

## Deploy ke Vercel

1. Push repository ini ke GitHub.
2. Di Vercel pilih **Add New Project**, lalu import repository.
3. Pengaturan build sudah tersedia di `vercel.json`.
4. Setelah aktif, tambahkan domain sendiri dari menu **Settings → Domains**.

## Mengganti isi bawaan

Data awal ada di `app/wedding-data.ts`. Mengubah file ini membuat isi baru tampil untuk semua pengunjung. Editor `/edit` ditujukan untuk preview dan penyesuaian cepat di perangkat admin.
