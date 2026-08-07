"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultWedding, type WeddingData } from "../wedding-data";
import { STORAGE_KEY } from "../WeddingInvitation";

export default function EditorPage() {
  const [data, setData] = useState<WeddingData>(defaultWedding);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value) try { setData(JSON.parse(value)); } catch (error) { console.warn("Data editor lokal tidak dapat dibaca.", error); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const patch = (key: keyof WeddingData, value: WeddingData[keyof WeddingData]) => setData(d => ({ ...d, [key]: value }));
  const save = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const upload = (file: File, index?: number) => { const reader = new FileReader(); reader.onload = () => { const url = String(reader.result); if (typeof index === "number") patch("gallery", data.gallery.map((x, i) => i === index ? url : x)); else patch("heroImage", url); }; reader.readAsDataURL(file); };
  const exportData = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "wedding-data.json"; a.click(); URL.revokeObjectURL(a.href); };
  return <main className="editor-shell">
    <aside className="editor-side"><Link className="brand" href="/"><span>RT</span> Ruang Temu</Link><div><p>MODE EDIT</p><h1>Atur undangan</h1><span>Perubahan tersimpan di perangkat ini. Ekspor data untuk cadangan atau dipindahkan.</span></div><nav><a href="#utama">Informasi utama</a><a href="#acara-edit">Detail acara</a><a href="#foto">Foto & galeri</a></nav><Link className="preview-link" href="/reihan&pasangan">Lihat preview ↗</Link></aside>
    <section className="editor-main"><div className="editor-top"><div><p className="eyebrow">WEDDING CONTENT MANAGER</p><h2>Selamat datang di ruang edit.</h2></div><div className="editor-actions"><button onClick={exportData}>Ekspor data</button><button className="save-button" onClick={save}>{saved ? "Tersimpan ✓" : "Simpan perubahan"}</button></div></div>
      <div className="form-card" id="utama"><div className="form-title"><span>01</span><div><h3>Informasi utama</h3><p>Nama pasangan dan tanggal yang tampil di seluruh undangan.</p></div></div><div className="form-grid"><label>Nama mempelai wanita<input value={data.bride} onChange={e => patch("bride", e.target.value)} /></label><label>Nama mempelai pria<input value={data.groom} onChange={e => patch("groom", e.target.value)} /></label><label>Tanggal singkat<input value={data.date} onChange={e => patch("date", e.target.value)} /></label><label>Tanggal lengkap<input value={data.dateLong} onChange={e => patch("dateLong", e.target.value)} /></label><label className="wide">Cerita singkat<textarea rows={4} value={data.story} onChange={e => patch("story", e.target.value)} /></label></div></div>
      <div className="form-card" id="acara-edit"><div className="form-title"><span>02</span><div><h3>Detail acara</h3><p>Ubah waktu dan lokasi akad maupun resepsi.</p></div></div>{data.events.map((ev, i) => <div className="event-edit" key={i}><h4>{i === 0 ? "Acara pertama" : "Acara kedua"}</h4><div className="form-grid"><label>Nama acara<input value={ev.title} onChange={e => patch("events", data.events.map((x,j)=>j===i?{...x,title:e.target.value}:x))}/></label><label>Waktu<input value={ev.time} onChange={e => patch("events", data.events.map((x,j)=>j===i?{...x,time:e.target.value}:x))}/></label><label>Tempat<input value={ev.place} onChange={e => patch("events", data.events.map((x,j)=>j===i?{...x,place:e.target.value}:x))}/></label><label>Alamat<input value={ev.address} onChange={e => patch("events", data.events.map((x,j)=>j===i?{...x,address:e.target.value}:x))}/></label></div></div>)}</div>
      <div className="form-card" id="foto"><div className="form-title"><span>03</span><div><h3>Foto & galeri</h3><p>Klik foto untuk mengganti. Tambahkan sampai 8 foto.</p></div></div><div className="photo-editor"><label className="hero-upload" style={{backgroundImage:`url('${data.heroImage}')`}}><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/><span>Ganti foto utama</span></label><div className="thumb-grid">{data.gallery.map((src,i)=><div className="thumb" key={i}><img src={src} alt=""/><label><input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&upload(e.target.files[0],i)}/>Ganti</label><button onClick={()=>patch("gallery",data.gallery.filter((_,j)=>j!==i))}>×</button></div>)}{data.gallery.length < 8 && <label className="add-photo"><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>patch("gallery",[...data.gallery,String(r.result)]);r.readAsDataURL(f)}}/><b>＋</b><span>Tambah foto</span></label>}</div></div></div>
    </section>
  </main>;
}
