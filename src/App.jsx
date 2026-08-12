import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import * as db from "./lib/db";
import * as storage from "./lib/storage";
import { useTiptapEditor, TiptapContent, tiptapExtensions } from "./lib/editor";
import { ChevronRight, ChevronDown, FileText, BookOpen, Search, Home, PlayCircle, ArrowLeft, Layers, LogOut, Menu, X, Lock, Edit3, ArrowUp, ArrowDown, Trash2, Type, AlignLeft, AlignCenter, AlignRight, ListOrdered, Outdent, Indent, List, Star, Image as ImageIcon, Video, Upload, Save, Check, Plus, Pencil, Palette, Sun, Moon, Mail, ListChecks, Users, Wallet, CheckCircle2, Clock, Eye, ShieldCheck, GraduationCap, UserCog, Copy, Table as TableIcon, FileUp, Library, ExternalLink } from "lucide-react";

/* ===== label istilah ===== */
const L = { book: "Buku", section: "Bagian", page: "Halaman" };

const DATA_INIT = {
  "neuroanatomy": {
    title: "Neuroanatomy", code: "NEU",
    sections: {
      "sistem-saraf": {
        title: "Anatomi sistem saraf", code: "AS",
        pages: {
          "sistem-saraf-nervous": {
            title: "Sistem saraf (nervous system)", code: "01",
            content: [
              { type: "h", text: "Definisi sistem saraf" },
              { type: "list", items: [
                "Sistem saraf adalah sistem koordinasi berupa penghantaran impuls saraf ke susunan saraf pusat, pemrosesan impuls saraf, dan pemberi tanggapan rangsangan.",
                "Merupakan bagian terkecil dari organ dalam tubuh, tetapi paling kompleks.",
                "Susunan saraf manusia mempunyai arus informasi cepat, tergantung pada aktivitas listrik (impuls saraf)."
              ]},
              { type: "h", text: "Pembagian sistem saraf" },
              { type: "p", html: "Terbagi menjadi <b>sistem saraf pusat</b> (otak dan medulla spinalis) dan <b>sistem saraf tepi</b> (saraf kranial dan spinal), masing-masing dengan cabang sensorik dan motorik." },
              { type: "highlight", text: "Stimulus eksternal/internal mengenai organ sensorik, menginduksi impuls afferent ke SSP, diproses, lalu SSP membentuk impuls efferent ke perifer." },
              { type: "h", text: "Alur informasi saraf" },
              { type: "p", text: "Alur informasi dipecah menjadi tiga tahap: input sensorik, pengolahan di SSP, dan output motorik." },
              { type: "video", videoId: "qPix_X-9t7E", caption: "Ringkasan fungsional sistem saraf (CNS, PNS, sensorik, motorik)" },
              { type: "h", text: "Ringkasan" },
              { type: "p", text: "Sistem saraf memungkinkan tubuh menerima rangsang, memprosesnya, dan memberi respons secara cepat dan terkoordinasi." }
            ],
            children: {}
          },
          "serebri": { title: "Serebri (otak)", code: "02", content: [{ type: "p", text: "Struktur otak besar, lobus korteks, dan fungsinya." }], children: {} }
        }
      },
      "medulla-spinalis": {
        title: "Anatomi medulla spinalis", code: "MS",
        pages: {
          "persarafan-spinal": { title: "Persarafan pada spinal cord", code: "01", content: [{ type: "p", text: "Traktus asenden dan desenden pada medulla spinalis." }], children: {} }
        }
      }
    }
  },
  "neurodiseases": {
    title: "Neurodiseases", code: "DIS",
    sections: {
      "stroke": { title: "Stroke", code: "ST", pages: {
        "stroke-iskemik": { title: "Stroke iskemik", code: "01", content: [{ type: "p", text: "Definisi, etiologi, dan tatalaksana awal stroke iskemik." }], children: {} },
        "quiz-stroke": { kind: "quiz", title: "Kuis: Stroke", questions: [
          { q: "Jenis stroke yang disebabkan sumbatan pembuluh darah otak adalah?", options: ["Stroke iskemik", "Stroke hemoragik", "TIA", "Migrain"], answer: 0, reason: "Stroke iskemik terjadi akibat sumbatan (trombus/emboli) yang menghentikan aliran darah ke otak." },
          { q: "Golden period tatalaksana trombolisis stroke iskemik umumnya?", options: ["< 4,5 jam", "< 24 jam", "< 48 jam", "< 1 minggu"], answer: 0, reason: "Terapi trombolitik (rtPA) paling efektif diberikan dalam 4,5 jam sejak onset gejala." }
        ], children: {} }
      } }
    }
  },
  "pem-neuro": {
    title: "Pemeriksaan neurologi", code: "PEM",
    sections: {
      "gcs": { title: "Glasgow coma scale", code: "GC", pages: { "gcs-komponen": { title: "Komponen penilaian GCS", code: "01", content: [{ type: "p", text: "Eye, verbal, motor response beserta skor masing-masing." }], children: {} } } }
    }
  }
};

const MEMBERS_INIT = [
  { id: "m1", name: "Kana Misbahul", email: "kana@student.usk.ac.id", password: "kana2026", amount: 50000, date: "2 Agu 2026", verified: false, proof: "#EAF4FE" },
  { id: "m2", name: "Rizky Ananda", email: "rizky.ananda@gmail.com", password: "rzky#881", amount: 50000, date: "1 Agu 2026", verified: false, proof: "#EDF5EA" },
  { id: "m3", name: "Putri Salsabila", email: "putri.s@gmail.com", password: "putri123", amount: 50000, date: "30 Jul 2026", verified: true, proof: "#F8EEF1" },
  { id: "m4", name: "Ahmad Fauzan", email: "fauzan.md@gmail.com", password: "fauzan!45", amount: 50000, date: "29 Jul 2026", verified: true, proof: "#F7F1E7" }
];
const BANKS = ["Bank Syariah Indonesia (BSI)", "BCA", "BNI", "BRI", "Bank Mandiri", "Bank Aceh Syariah", "BTN", "CIMB Niaga", "Permata", "Danamon", "Bank Muamalat", "BTPN", "Bank Jago", "SeaBank", "Bank Mega", "OCBC NISP", "Maybank", "Bank Sinarmas"];
const PAYMENT = { bank: "Bank Syariah Indonesia (BSI)", rek: "7211 8899 00", nama: "a.n. Pengelola Materi Kedokteran", jumlah: 50000 };
const rupiah = (n) => "Rp " + (n || 0).toLocaleString("id-ID");

/* ===== tema: light & dark via proxy ===== */
const PALETTES = {
  light: { navy: "#0C6FC0", navyDeep: "#0A5EA3", blue: "#118EEA", blueDeep: "#0C7BD0", blueTint: "#E7F3FD", ink: "#101828", sub: "#66708A", border: "#E4EDF5", bg: "#F3F8FD", white: "#FFFFFF", danger: "#D0342C", body: "#333B54" },
  dark:  { navy: "#5AB0F5", navyDeep: "#3E93DA", blue: "#2E9BF5", blueDeep: "#2E9BF5", blueTint: "#13273D", ink: "#E7EEF5", sub: "#93A2B3", border: "#26323F", bg: "#0D1520", white: "#161F2B", danger: "#F0655C", body: "#C4D0DC" }
};
let THEME = "light";
const C = new Proxy({}, { get: (_, k) => PALETTES[THEME][k] });
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const CARD_COLORS_LIGHT = {
  blue:   { tint: "#EAF4FE", chip: "#D6EAFB", solid: "#2F80D8" },
  sky:    { tint: "#E9F5FB", chip: "#D3EBF5", solid: "#3AA0C9" },
  cyan:   { tint: "#E7F6F8", chip: "#D0ECEF", solid: "#2A9AA9" },
  teal:   { tint: "#E8F5F1", chip: "#D2ECE4", solid: "#2AA98A" },
  mint:   { tint: "#EAF6EF", chip: "#D4ECDD", solid: "#3AA06B" },
  green:  { tint: "#EDF5EA", chip: "#DBEBD5", solid: "#5B9B54" },
  lime:   { tint: "#F1F6E7", chip: "#E2ECCF", solid: "#7A9A3E" },
  amber:  { tint: "#F7F1E7", chip: "#EEE1CD", solid: "#BE8A3E" },
  orange: { tint: "#FAF0E6", chip: "#F1DFC9", solid: "#C9803E" },
  coral:  { tint: "#FBEEEB", chip: "#F3D9D2", solid: "#C56A55" },
  rose:   { tint: "#F8EEF1", chip: "#EFD9E0", solid: "#C06585" },
  plum:   { tint: "#F5EDF3", chip: "#E9D9E6", solid: "#9A5A85" },
  violet: { tint: "#F1EEFB", chip: "#E1DBF6", solid: "#7A5AC4" },
  indigo: { tint: "#EEEFFB", chip: "#DFE1F6", solid: "#5A63C4" },
  slate:  { tint: "#EEF1F5", chip: "#DEE4EC", solid: "#5B7089" }
};
const CARD_COLORS_DARK = {
  blue:   { tint: "#132A3E", chip: "#1B3A54", solid: "#6FB4F0" },
  sky:    { tint: "#122A33", chip: "#1A3A45", solid: "#7CC3E0" },
  cyan:   { tint: "#0F2B2E", chip: "#173B3F", solid: "#5FC2CC" },
  teal:   { tint: "#0F2A24", chip: "#173A32", solid: "#5AC7A8" },
  mint:   { tint: "#102A1E", chip: "#183A2A", solid: "#66C68C" },
  green:  { tint: "#152A11", chip: "#1E3A1A", solid: "#83C46E" },
  lime:   { tint: "#1E2812", chip: "#2B381A", solid: "#A3C258" },
  amber:  { tint: "#2E2510", chip: "#3E3318", solid: "#D9AE5C" },
  orange: { tint: "#2E2010", chip: "#3E2C18", solid: "#E0A363" },
  coral:  { tint: "#2E1913", chip: "#3E241C", solid: "#E08D74" },
  rose:   { tint: "#2A151C", chip: "#3A1F28", solid: "#DE85A5" },
  plum:   { tint: "#26151F", chip: "#361F2C", solid: "#BC7FA8" },
  violet: { tint: "#201A33", chip: "#2C2447", solid: "#A386E0" },
  indigo: { tint: "#1A1B33", chip: "#242647", solid: "#8890E0" },
  slate:  { tint: "#1C222B", chip: "#28313C", solid: "#8CA0B4" }
};
const getColor = (key) => {
  const table = THEME === "dark" ? CARD_COLORS_DARK : CARD_COLORS_LIGHT;
  return (key && table[key]) ? table[key] : { tint: C.white, chip: C.blueTint, solid: C.blue };
};

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const r = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  return m;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);

/* ===== resolusi pohon halaman berdasarkan path ===== */
function resolvePage(data, nav) {
  const sec = data?.[nav.notebook]?.sections?.[nav.section];
  if (!sec) return { node: null, container: null };
  let container = sec.pages;
  let node = null;
  for (const k of nav.path) {
    node = container?.[k];
    if (!node) return { node: null, container: {} };
    container = node.children || {};
  }
  return { node, container };
}
/* map fungsi ke container anak di parentPath ([] = section.pages) */
function mapChildren(pages, parentPath, fn) {
  if (parentPath.length === 0) return fn(pages);
  const [h, ...rest] = parentPath;
  const node = pages[h];
  return { ...pages, [h]: { ...node, children: mapChildren(node.children || {}, rest, fn) } };
}

function useMutations(data, setData, ask) {
  const setSecPages = (nb, sk, fn) => setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [sk]: { ...d[nb].sections[sk], pages: fn(d[nb].sections[sk].pages) } } } }));
  return {
    addNotebook: async () => {
      const r = await ask.create(`${L.book} baru`);
      if (!r || !r.name) return;
      setData((d) => ({ ...d, [slug(r.name)]: { title: r.name, code: r.name.slice(0, 3).toUpperCase(), color: r.color, cover: r.cover, sections: {} } }));
    },
    renameNotebook: async (k) => {
      const name = await ask.prompt(`Ubah nama ${L.book}`, data[k].title);
      if (!name) return;
      setData((d) => ({ ...d, [k]: { ...d[k], title: name } }));
    },
    deleteNotebook: async (k) => {
      if (!(await ask.confirm(`Hapus ${L.book} "${data[k].title}" beserta isinya?`))) return;
      setData((d) => { const n = { ...d }; delete n[k]; return n; });
    },
    setNotebookCover: (k, src) => setData((d) => ({ ...d, [k]: { ...d[k], cover: src } })),
    setNotebookColor: (k, col) => setData((d) => ({ ...d, [k]: { ...d[k], color: col } })),

    addSection: async (nb) => {
      const r = await ask.create(`${L.section} baru`);
      if (!r || !r.name) return;
      setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [slug(r.name)]: { title: r.name, code: r.name.slice(0, 2).toUpperCase(), color: r.color, cover: r.cover, pages: {} } } } }));
    },
    renameSection: async (nb, sk) => {
      const name = await ask.prompt(`Ubah nama ${L.section}`, data[nb].sections[sk].title);
      if (!name) return;
      setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [sk]: { ...d[nb].sections[sk], title: name } } } }));
    },
    deleteSection: async (nb, sk) => {
      if (!(await ask.confirm(`Hapus ${L.section} "${data[nb].sections[sk].title}"?`))) return;
      setData((d) => { const s = { ...d[nb].sections }; delete s[sk]; return { ...d, [nb]: { ...d[nb], sections: s } }; });
    },
    setSectionCover: (nb, sk, src) => setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [sk]: { ...d[nb].sections[sk], cover: src } } } })),
    setSectionColor: (nb, sk, col) => setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [sk]: { ...d[nb].sections[sk], color: col } } } })),

    // tambah sub bab di level saat ini (parentPath = nav.path)
    addPageSmart: async (nav) => {
      const r = await ask.create(`${L.page} baru`);
      if (!r || !r.name) return;
      const name = r.name;
      const nb = nav.notebook || Object.keys(data)[0];
      if (!nb) return;
      const key = slug(name);
      setData((d) => {
        const notebook = d[nb];
        let sections = { ...notebook.sections };
        let sk = nav.section || Object.keys(sections)[0];
        if (!sk) { sk = slug("bab"); sections[sk] = { title: `${L.section} 1`, code: "B1", pages: {} }; }
        const parentPath = nav.section ? nav.path : [];
        const newNode = { title: name, code: "", color: r.color, cover: r.cover, contentHtml: "", children: {} };
        const newPages = mapChildren(sections[sk].pages, parentPath, (m) => ({ ...m, [key]: newNode }));
        sections = { ...sections, [sk]: { ...sections[sk], pages: newPages } };
        return { ...d, [nb]: { ...notebook, sections } };
      });
    },
    addSectionSmart: async (nav) => {
      const r = await ask.create(`${L.section} baru`);
      if (!r || !r.name) return;
      const nb = nav.notebook || Object.keys(data)[0];
      if (!nb) return;
      setData((d) => ({ ...d, [nb]: { ...d[nb], sections: { ...d[nb].sections, [slug(r.name)]: { title: r.name, code: r.name.slice(0, 2).toUpperCase(), color: r.color, cover: r.cover, pages: {} } } } }));
    },
    addQuizSmart: async (nav) => {
      const r = await ask.create("Kuis baru", { withCover: false });
      if (!r || !r.name) return;
      const name = r.name;
      const nb = nav.notebook || Object.keys(data)[0];
      if (!nb) return;
      const key = slug(name);
      setData((d) => {
        const notebook = d[nb];
        let sections = { ...notebook.sections };
        let sk = nav.section || Object.keys(sections)[0];
        if (!sk) { sk = slug("bab"); sections[sk] = { title: `${L.section} 1`, code: "B1", pages: {} }; }
        const parentPath = nav.section ? nav.path : [];
        const newNode = { kind: "quiz", title: name, color: r.color, questions: [{ q: "Tulis pertanyaan di sini?", options: ["Pilihan A", "Pilihan B", "Pilihan C"], answer: 0, reason: "" }], children: {} };
        const newPages = mapChildren(sections[sk].pages, parentPath, (m) => ({ ...m, [key]: newNode }));
        sections = { ...sections, [sk]: { ...sections[sk], pages: newPages } };
        return { ...d, [nb]: { ...notebook, sections } };
      });
    },
    addTugasSmart: async (nav) => {
      const r = await ask.create("Tugas baru", { withCover: false, placeholder: "Judul tugas" });
      if (!r || !r.name) return;
      const name = r.name;
      const nb = nav.notebook || Object.keys(data)[0];
      if (!nb) return;
      const key = slug(name);
      setData((d) => {
        const notebook = d[nb];
        let sections = { ...notebook.sections };
        let sk = nav.section || Object.keys(sections)[0];
        if (!sk) { sk = slug("bab"); sections[sk] = { title: `${L.section} 1`, code: "B1", pages: {} }; }
        const parentPath = nav.section ? nav.path : [];
        const newNode = { kind: "tugas", title: name, color: r.color, link: "", children: {} };
        const newPages = mapChildren(sections[sk].pages, parentPath, (m) => ({ ...m, [key]: newNode }));
        sections = { ...sections, [sk]: { ...sections[sk], pages: newPages } };
        return { ...d, [nb]: { ...notebook, sections } };
      });
    },
    addReferensiSmart: async (nav) => {
      const r = await ask.create("Buku kedokteran baru", { withCover: false, placeholder: "Judul buku" });
      if (!r || !r.name) return;
      const name = r.name;
      const nb = nav.notebook || Object.keys(data)[0];
      if (!nb) return;
      const key = slug(name);
      setData((d) => {
        const notebook = d[nb];
        let sections = { ...notebook.sections };
        let sk = nav.section || Object.keys(sections)[0];
        if (!sk) { sk = slug("bab"); sections[sk] = { title: `${L.section} 1`, code: "B1", pages: {} }; }
        const parentPath = nav.section ? nav.path : [];
        const newNode = { kind: "referensi", title: name, color: r.color, link: "", children: {} };
        const newPages = mapChildren(sections[sk].pages, parentPath, (m) => ({ ...m, [key]: newNode }));
        sections = { ...sections, [sk]: { ...sections[sk], pages: newPages } };
        return { ...d, [nb]: { ...notebook, sections } };
      });
    },
    renamePage: async (nb, sk, fullPath) => {
      const cur = (() => { let c = data[nb].sections[sk].pages, n = null; for (const k of fullPath) { n = c[k]; c = n.children || {}; } return n; })();
      const name = await ask.prompt(`Ubah nama ${L.page}`, cur.title);
      if (!name) return;
      const parent = fullPath.slice(0, -1), key = fullPath[fullPath.length - 1];
      setSecPages(nb, sk, (pages) => mapChildren(pages, parent, (m) => ({ ...m, [key]: { ...m[key], title: name } })));
    },
    deletePage: async (nb, sk, fullPath, title) => {
      if (!(await ask.confirm(`Hapus ${L.page} "${title}" beserta isinya?`))) return;
      const parent = fullPath.slice(0, -1), key = fullPath[fullPath.length - 1];
      setSecPages(nb, sk, (pages) => mapChildren(pages, parent, (m) => { const x = { ...m }; delete x[key]; return x; }));
    },
    setPageCover: (nb, sk, fullPath, src) => {
      const parent = fullPath.slice(0, -1), key = fullPath[fullPath.length - 1];
      setSecPages(nb, sk, (pages) => mapChildren(pages, parent, (m) => ({ ...m, [key]: { ...m[key], cover: src } })));
    },
    setPageColor: (nb, sk, fullPath, col) => {
      const parent = fullPath.slice(0, -1), key = fullPath[fullPath.length - 1];
      setSecPages(nb, sk, (pages) => mapChildren(pages, parent, (m) => ({ ...m, [key]: { ...m[key], color: col } })));
    },
    setPageContent: (nb, sk, fullPath, patch) => {
      const parent = fullPath.slice(0, -1), key = fullPath[fullPath.length - 1];
      setSecPages(nb, sk, (pages) => mapChildren(pages, parent, (m) => ({ ...m, [key]: { ...m[key], ...patch } })));
    }
  };
}

function useAddFlow() {
  const { nav, mut, ask } = useApp();
  return async () => {
    const kind = await ask.choose("Mau menambahkan apa?", [
      { v: "notebook", label: L.book, desc: "Bidang studi baru", icon: <BookOpen size={17} color={C.blue} /> },
      { v: "section", label: L.section, desc: `Kelompok ${L.page.toLowerCase()} dalam ${L.book.toLowerCase()}`, icon: <Layers size={17} color={C.blue} /> },
      { v: "page", label: L.page, desc: "Isi materi: teks, gambar, video", icon: <FileText size={17} color={C.blue} /> },
      { v: "quiz", label: "Kuis", desc: "Soal pilihan ganda + pembahasan", icon: <ListChecks size={17} color={C.blue} /> },
      { v: "tugas", label: "Tugas", desc: "Judul + link penyimpanan online (Drive, dll)", icon: <FileUp size={17} color={C.blue} /> },
      { v: "referensi", label: "Buku kedokteran", desc: "Judul + link download (Word/PPT/PDF)", icon: <Library size={17} color={C.blue} /> }
    ]);
    if (kind === "page") mut.addPageSmart(nav);
    else if (kind === "section") mut.addSectionSmart(nav);
    else if (kind === "notebook") mut.addNotebook();
    else if (kind === "quiz") mut.addQuizSmart(nav);
    else if (kind === "tugas") mut.addTugasSmart(nav);
    else if (kind === "referensi") mut.addReferensiSmart(nav);
  };
}

/* ===== kontrol baris (pengajar) ===== */
function RowTools({ onRename, onDelete, onCover, onColor }) {
  return (
    <div style={{ display: "flex", gap: 5 }} onClick={(e) => e.stopPropagation()}>
      {onColor && <button onClick={onColor} aria-label="Warna" style={toolBtn()}><Palette size={13} color={C.sub} /></button>}
      {onCover && (
        <label style={toolBtn()} aria-label="Cover">
          <ImageIcon size={13} color={C.sub} />
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const url = await storage.uploadGambar(f, { prefix: "cover/" }); onCover(url); } catch (err) { alert("Upload gambar gagal. Pastikan Backblaze B2 sudah dikonfigurasi (lihat tutorial).\n" + (err?.message || err)); } }} />
        </label>
      )}
      <button onClick={onRename} aria-label="Ubah nama" style={toolBtn()}><Pencil size={13} color={C.sub} /></button>
      <button onClick={onDelete} aria-label="Hapus" style={toolBtn()}><Trash2 size={13} color={C.danger} /></button>
    </div>
  );
}
const toolBtn = () => ({ width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 });

/* ===== baris kartu mobile & desktop ===== */
function AirRow({ icon, cover, color, typeLabel, title, meta, onClick, tools }) {
  const col = getColor(color);
  return (
    <div className="mk-card" style={{ border: `1px solid ${col.chip}`, borderRadius: 14, marginBottom: 10, background: col.tint, overflow: "hidden" }}>
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 13px", cursor: "pointer" }}>
        {cover ? <SignedImg src={cover} alt="" style={{ width: 46, height: 46, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 46, height: 46, borderRadius: 11, background: col.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{React.cloneElement(icon, { color: col.solid })}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: col.solid, background: col.chip, padding: "2px 8px", borderRadius: 6 }}>{typeLabel}</span>
            {meta && <span style={{ fontSize: 12, color: C.sub }}>{meta}</span>}
          </div>
        </div>
        <ChevronRight size={17} color={C.sub} />
      </div>
      {tools && <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, padding: "0 13px 12px", borderTop: `1px solid ${col.chip}`, paddingTop: 10 }}>{tools}</div>}
    </div>
  );
}
function DeskRow({ icon, cover, color, typeLabel, title, meta, onClick, tools }) {
  const col = getColor(color);
  return (
    <div className="mk-card" style={{ background: col.tint, border: `1px solid ${col.chip}`, borderRadius: 16, boxShadow: "0 2px 10px rgba(12,111,192,.05)", overflow: "hidden" }}>
      <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 15, padding: "15px 20px", cursor: "pointer" }}>
        {cover ? <SignedImg src={cover} alt="" style={{ width: 56, height: 56, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 56, height: 56, borderRadius: 13, background: col.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{React.cloneElement(icon, { color: col.solid })}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.navy, letterSpacing: -.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: col.solid, background: col.chip, padding: "3px 9px", borderRadius: 6, flexShrink: 0 }}>{typeLabel}</span>
          </div>
          {meta && <div style={{ fontSize: 13, color: C.sub }}>{meta}</div>}
        </div>
        <ChevronRight size={18} color={C.sub} />
      </div>
      {tools && <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, padding: "0 20px 14px", borderTop: `1px solid ${col.chip}`, paddingTop: 12 }}>{tools}</div>}
    </div>
  );
}

const childCount = (node) => Object.keys(node.children || {}).length;

/* ===== konten halaman ===== */
const esc = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sanitize = (h) => (h || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/ on\w+="[^"]*"/gi, "").replace(/javascript:/gi, "");
const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, "");

/* ===== gambar B2 (bucket privat): resolve key -> signed URL, dengan cache ===== */
const signedUrlCache = new Map(); // key -> { url, expires }
function SignedImg({ src, alt, style, onError }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    if (!src) { setUrl(""); return; }
    // src dari data lama bisa jadi URL absolut (http...) — tampilkan langsung, gak perlu sign.
    if (/^https?:\/\//i.test(src)) { setUrl(src); return; }
    const cached = signedUrlCache.get(src);
    if (cached && cached.expires > Date.now()) { setUrl(cached.url); return; }
    setUrl("");
    storage.gambarSignedUrl(src).then((u) => {
      if (!alive) return;
      signedUrlCache.set(src, { url: u, expires: Date.now() + 50 * 60 * 1000 }); // cache 50 menit (signed 60 menit)
      setUrl(u);
    }).catch(() => { if (alive) setUrl(""); });
    return () => { alive = false; };
  }, [src]);
  if (!url) return <div style={{ ...style, background: C.bg }} />;
  return <img src={url} alt={alt || ""} style={style} onError={onError} />;
}



/* ===== daftar isi (ToC) otomatis dari heading ===== */
const tocLink = (active) => ({ display: "block", width: "100%", textAlign: "left", padding: "7px 12px", border: "none", borderLeft: `2px solid ${active ? C.blue : "transparent"}`, background: "transparent", color: active ? C.blue : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
/* ===== migrasi konten lama (array block) -> HTML editor ===== */
function blocksToHtml(blocks) {
  return blocks.map((b) => {
    if (b.type === "h") return `<h2>${esc(b.text)}</h2>`;
    if (b.type === "p") return b.html ? `<p>${sanitize(b.html)}</p>` : `<p>${esc(b.text)}</p>`;
    if (b.type === "list") return `<ul>${(b.items || []).filter(Boolean).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`;
    if (b.type === "highlight") return `<p><mark>${esc(b.text)}</mark></p>`;
    if (b.type === "image") return b.src ? `<figure data-image-figure><img src="mk-key:${esc(b.src)}"><figcaption>${esc(b.caption || "")}</figcaption></figure>` : "";
    if (b.type === "video") return b.videoId ? `<div data-youtube-video="${esc(b.videoId)}" data-caption="${esc(b.caption || "")}"></div>` : "";
    return "";
  }).join("");
}
// halaman lama pakai `content` (array); halaman baru pakai `contentHtml` (string). Konversi sekali saat baca.
function pageHtml(node) {
  if (node.contentHtml != null) return node.contentHtml;
  if (node.content && node.content.length) return blocksToHtml(node.content);
  return "";
}
// sebelum masuk editor: ganti src="mk-key:xxx" jadi signed URL asli, biar gambar lama kelihatan saat diedit
async function resolveKeyedImages(html) {
  if (!html || !html.includes("mk-key:")) return html || "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll('img[src^="mk-key:"]'));
  await Promise.all(imgs.map(async (img) => {
    const key = img.getAttribute("src").slice(7);
    let url;
    const cached = signedUrlCache.get(key);
    if (cached && cached.expires > Date.now()) url = cached.url;
    else { try { url = await storage.gambarSignedUrl(key); signedUrlCache.set(key, { url, expires: Date.now() + 50 * 60 * 1000 }); } catch { url = ""; } }
    if (url) { img.setAttribute("src", url); img.setAttribute("data-key", key); }
  }));
  return doc.body.innerHTML;
}
// sebelum simpan ke database: ganti signed URL balik jadi "mk-key:xxx" (URL bisa expired, key permanen)
function htmlToStoredKeys(html) {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  Array.from(doc.querySelectorAll("img[data-key]")).forEach((img) => {
    const key = img.getAttribute("data-key");
    if (key) img.setAttribute("src", "mk-key:" + key);
  });
  return doc.body.innerHTML;
}

/* ===== render artikel (pelajar, read-only) dengan ToC dari heading ===== */
function ArticleWithToc({ html, mobile }) {
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [heads, setHeads] = useState([]);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const hs = Array.from(el.querySelectorAll("h1,h2,h3")).map((n, i) => { n.setAttribute("data-h", i); return { i, text: n.textContent }; });
    setHeads(hs);
  }, [html]);
  const show = heads.length >= 3;
  const goto = (i) => { const el = rootRef.current?.querySelector(`[data-h="${i}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); setOpen(false); };
  const body = <div ref={bodyRef} className="mk-article" dangerouslySetInnerHTML={{ __html: sanitize(html || "") }} />;
  const withImgs = <>{body}<KeyedImages containerRef={bodyRef} /></>;
  if (!show) return <div ref={rootRef}>{withImgs}</div>;
  if (mobile) return (
    <div ref={rootRef}>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 18, overflow: "hidden" }}>
        <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.bg, border: "none", cursor: "pointer", fontFamily: FONT }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: C.navy }}><List size={15} color={C.blue} /> Daftar isi</span>
          <ChevronDown size={16} color={C.sub} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </button>
        {open && <div style={{ padding: "6px 6px 10px" }}>{heads.map((h) => <button key={h.i} onClick={() => goto(h.i)} style={tocLink(false)}>{h.text}</button>)}</div>}
      </div>
      {withImgs}
    </div>
  );
  return (
    <div ref={rootRef} style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
      <nav style={{ position: "sticky", top: 20, width: 190, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: C.sub, marginBottom: 10, paddingLeft: 12 }}>Daftar isi</div>
        {heads.map((h) => <button key={h.i} onClick={() => goto(h.i)} style={tocLink(false)}>{h.text}</button>)}
      </nav>
      {withImgs}
    </div>
  );
}

/* ===== gambar privat B2: <img src="mk-key:xxx"> di HTML tersimpan -> resolve jadi signed URL saat tampil ===== */
function KeyedImages({ containerRef }) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll('img[src^="mk-key:"]'));
    let alive = true;
    imgs.forEach((img) => {
      const key = img.getAttribute("src").slice(7);
      const cached = signedUrlCache.get(key);
      if (cached && cached.expires > Date.now()) { img.src = cached.url; return; }
      storage.gambarSignedUrl(key).then((u) => {
        if (!alive) return;
        signedUrlCache.set(key, { url: u, expires: Date.now() + 50 * 60 * 1000 });
        img.src = u;
      }).catch(() => {});
    });
    return () => { alive = false; };
  });
  return null;
}

/* ===== toolbar gaya Word (Tiptap) ===== */
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];
const TEXT_COLORS = ["#101828", "#118EEA", "#D0342C", "#16A34A", "#7C3AED", "#B8860B"];
function TbBtn({ onClick, active, disabled, title, children }) {
  return (
    <button type="button" title={title} disabled={disabled} onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{ minWidth: 30, height: 28, padding: "0 6px", borderRadius: 7, border: `1px solid ${active ? C.blue : C.border}`, background: active ? C.blueTint : C.white, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, fontSize: 13, fontWeight: 700, color: active ? C.navy : C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      {children}
    </button>
  );
}
function EditorToolbar({ editor, onInsertImage, onInsertTable, uploading, compact }) {
  if (!editor) return null;
  const sep = <div style={{ width: 1, height: 20, background: C.border, margin: "0 4px" }} />;
  const currentSize = editor.getAttributes("textStyle").fontSize?.replace("px", "") || "14";
  const inTable = editor.isActive("table");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", padding: "8px 9px", border: `1px solid ${C.border}`, borderBottom: "none", borderRadius: "10px 10px 0 0", background: C.bg, position: "sticky", top: 0, zIndex: 2 }}>
      {!compact && <select value={editor.getAttributes("heading").level ? `h${editor.getAttributes("heading").level}` : "p"}
        onChange={(e) => { const v = e.target.value; if (v === "p") editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: Number(v[1]) }).run(); }}
        style={{ height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, fontSize: 12.5, color: C.ink, fontFamily: FONT, padding: "0 4px" }}>
        <option value="p">Normal</option>
        <option value="h1">Judul 1</option>
        <option value="h2">Judul 2</option>
        <option value="h3">Judul 3</option>
      </select>}
      <select value={currentSize} onChange={(e) => editor.chain().focus().setFontSize(e.target.value + "px").run()}
        style={{ height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, fontSize: 12.5, color: C.ink, fontFamily: FONT, padding: "0 4px" }}>
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {sep}
      <TbBtn title="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>B</TbBtn>
      <TbBtn title="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><span style={{ fontStyle: "italic" }}>I</span></TbBtn>
      <TbBtn title="Garis bawah" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{ textDecoration: "underline" }}>U</span></TbBtn>
      <TbBtn title="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: "line-through" }}>S</span></TbBtn>
      {sep}
      {TEXT_COLORS.map((c) => (
        <button key={c} type="button" title={"Warna teks " + c} onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
          style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.white}`, boxShadow: `0 0 0 1px ${C.border}`, background: c, cursor: "pointer" }} />
      ))}
      <TbBtn title="Sorot kuning" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}>
        <span style={{ background: "#FEF08A", padding: "0 3px", borderRadius: 3 }}>H</span>
      </TbBtn>
      {sep}
      <TbBtn title="Rata kiri" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></TbBtn>
      <TbBtn title="Rata tengah" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></TbBtn>
      <TbBtn title="Rata kanan" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></TbBtn>
      {sep}
      <TbBtn title="Poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></TbBtn>
      <TbBtn title="Penomoran" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></TbBtn>
      <TbBtn title="Kurangi indentasi" onClick={() => editor.chain().focus().liftListItem("listItem").run()}><Outdent size={14} /></TbBtn>
      <TbBtn title="Tambah indentasi" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}><Indent size={14} /></TbBtn>
      {sep}
      <label style={{ display: "flex", alignItems: "center" }}>
        <TbBtn title="Sisipkan gambar" as="span" disabled={uploading} onClick={() => document.getElementById("mk-img-input")?.click()}>{uploading ? "…" : <ImageIcon size={14} />}</TbBtn>
        <input id="mk-img-input" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onInsertImage(f); e.target.value = ""; }} />
      </label>
      <TbBtn title="Sisipkan video YouTube" onClick={() => {
        const url = window.prompt("Tempel link YouTube:");
        const id = extractYT(url || "");
        if (id) editor.chain().focus().insertContent({ type: "youtube", attrs: { videoId: id, caption: "" } }).run();
      }}><Video size={14} /></TbBtn>
      <TbBtn title="Sisipkan tabel" onClick={onInsertTable}><TableIcon size={14} /></TbBtn>
      {inTable && <>
        {sep}
        <TbBtn title="Tambah baris" onClick={() => editor.chain().focus().addRowAfter().run()}>+Baris</TbBtn>
        <TbBtn title="Hapus baris" onClick={() => editor.chain().focus().deleteRow().run()}>−Baris</TbBtn>
        <TbBtn title="Tambah kolom" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Kolom</TbBtn>
        <TbBtn title="Hapus kolom" onClick={() => editor.chain().focus().deleteColumn().run()}>−Kolom</TbBtn>
        <TbBtn title="Hapus tabel" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={14} /></TbBtn>
      </>}
      {sep}
      <TbBtn title="Bersihkan format" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>⨉</TbBtn>
    </div>
  );
}
function extractYT(url) { if (!url) return ""; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/); return m ? m[1] : ""; }

/* ===== editor konten gaya Word (pengajar) ===== */
function PageContentEditor({ node }) {
  const { nav, mut } = useApp();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ready, setReady] = useState(false);
  const resolvedHtml = useRef("");
  const bodyRef = useRef(null);

  useEffect(() => {
    let alive = true;
    resolveKeyedImages(pageHtml(node)).then((html) => {
      if (!alive) return;
      resolvedHtml.current = html;
      setReady(true);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.notebook, nav.section, nav.path]);

  return ready ? <PageContentEditorReady node={node} initialHtml={resolvedHtml.current} /> : (
    <div style={{ padding: 40, textAlign: "center", color: C.sub, fontSize: 13 }}>Memuat editor…</div>
  );
}
function PageContentEditorReady({ node, initialHtml }) {
  const { nav, mut } = useApp();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const bodyRef = useRef(null);

  const editor = useTiptapEditor({
    extensions: tiptapExtensions(),
    content: initialHtml,
    editorProps: { attributes: { class: "mk-article mk-edit", style: `font-family:${FONT}` } }
  });

  const setTitle = (t) => mut.setPageContent(nav.notebook, nav.section, nav.path, { title: t });
  const doSave = () => {
    if (!editor) return;
    mut.setPageContent(nav.notebook, nav.section, nav.path, { contentHtml: htmlToStoredKeys(editor.getHTML()), content: undefined });
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  };
  const togglePreview = () => {
    if (!preview && editor) setPreviewHtml(editor.getHTML()); // ambil isi terkini (termasuk yang belum disimpan)
    setPreview((p) => !p);
  };
  const insertImage = async (file) => {
    setUploading(true);
    try {
      const key = await storage.uploadGambar(file, { prefix: "materi/" });
      const url = await storage.gambarSignedUrl(key);
      signedUrlCache.set(key, { url, expires: Date.now() + 50 * 60 * 1000 });
      editor.chain().focus().insertContent({ type: "imageFigure", attrs: { src: url, "data-key": key } }).run();
    } catch (err) {
      alert("Upload gambar gagal. Pastikan Backblaze B2 sudah dikonfigurasi (lihat tutorial).\n" + (err?.message || err));
    } finally { setUploading(false); }
  };
  const insertTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  if (!editor) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: preview ? C.blueTint : "#FEF3C7", color: preview ? C.navy : "#92600A", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>
          {preview ? <><Eye size={13} /> Pratinjau (tampilan pelajar)</> : <><Edit3 size={13} /> Mode edit</>}
        </div>
        <button onClick={togglePreview} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
          {preview ? <><Edit3 size={14} /> Kembali edit</> : <><Eye size={14} /> Pratinjau</>}
        </button>
      </div>
      {preview ? (
        <div style={{ maxWidth: 680 }}><ArticleWithToc html={previewHtml} /></div>
      ) : (
        <>
          <input value={node.title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: -.4, border: "none", borderBottom: `2px solid ${C.border}`, outline: "none", padding: "4px 0 8px", marginBottom: 20, fontFamily: FONT, background: "transparent" }} />
          <EditorToolbar editor={editor} onInsertImage={insertImage} onInsertTable={insertTable} uploading={uploading} />
          <div ref={bodyRef} style={{ border: `1px solid ${C.border}`, borderRadius: "0 0 10px 10px", padding: "14px 16px", minHeight: 240, background: C.white }}>
            <TiptapContent editor={editor} />
          </div>
          <button onClick={doSave} style={{ marginTop: 18, padding: "12px 24px", borderRadius: 12, border: "none", background: saved ? "#16A34A" : C.blue, color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}>{saved ? <><Check size={16} /> Tersimpan</> : <><Save size={16} /> Simpan materi</>}</button>
        </>
      )}
    </div>
  );
}

/* ===== list & tampilan (dipakai mobile & desktop via Row) ===== */
function EmptyState({ icon, title, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "44px 20px", gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.blueTint, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: C.sub, maxWidth: 280, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}
function NotebookRows({ Row }) {
  const { data, setNav, role, mut, ask } = useApp();
  if (Object.keys(data).length === 0) return <EmptyState icon={<BookOpen size={26} color={C.blue} />} title={`Belum ada ${L.book.toLowerCase()}`} hint={role === "pengajar" ? `Tekan Tambah untuk membuat ${L.book.toLowerCase()} pertama.` : "Materi belum tersedia."} />;
  return (
    <>
      {Object.entries(data).map(([key, nb]) => (
        <Row key={key} icon={<BookOpen size={20} />} cover={nb.cover} color={nb.color} typeLabel={L.book} title={nb.title} meta={`${Object.keys(nb.sections).length} ${L.section.toLowerCase()}`}
          tools={role === "pengajar" ? <RowTools onRename={() => mut.renameNotebook(key)} onDelete={() => mut.deleteNotebook(key)} onCover={(s) => mut.setNotebookCover(key, s)} onColor={async () => { const c = await ask.color("Pilih warna kartu"); if (c) mut.setNotebookColor(key, c); }} /> : null}
          onClick={() => setNav({ notebook: key, section: null, path: [] })} />
      ))}
    </>
  );
}
function SectionRows({ nb, Row }) {
  const { nav, setNav, role, mut, ask } = useApp();
  if (Object.keys(nb.sections).length === 0) return <EmptyState icon={<Layers size={26} color={C.blue} />} title={`Belum ada ${L.section.toLowerCase()}`} hint={role === "pengajar" ? `Tekan Tambah untuk membuat ${L.section.toLowerCase()}.` : "Bagian belum tersedia."} />;
  return (
    <>
      {Object.entries(nb.sections).map(([key, s]) => (
        <Row key={key} icon={<Layers size={20} />} cover={s.cover} color={s.color} typeLabel={L.section} title={s.title} meta={`${Object.keys(s.pages).length} ${L.page.toLowerCase()}`}
          tools={role === "pengajar" ? <RowTools onRename={() => mut.renameSection(nav.notebook, key)} onDelete={() => mut.deleteSection(nav.notebook, key)} onCover={(sr) => mut.setSectionCover(nav.notebook, key, sr)} onColor={async () => { const c = await ask.color("Pilih warna kartu"); if (c) mut.setSectionColor(nav.notebook, key, c); }} /> : null}
          onClick={() => setNav({ ...nav, section: key, path: [] })} />
      ))}
    </>
  );
}
/* daftar sub bab pada container di basePath */
function PageRows({ container, basePath, Row }) {
  const { nav, setNav, role, mut, ask } = useApp();
  if (Object.keys(container).length === 0) return <EmptyState icon={<FileText size={26} color={C.blue} />} title={`Belum ada ${L.page.toLowerCase()}`} hint={role === "pengajar" ? `Tekan Tambah untuk membuat ${L.page.toLowerCase()} atau kuis.` : `${L.page} belum tersedia.`} />;
  return (
    <>
      {Object.entries(container).map(([key, p]) => {
        const full = [...basePath, key];
        const isQuiz = p.kind === "quiz";
        const isTugas = p.kind === "tugas";
        const isReferensi = p.kind === "referensi";
        const isLinkKind = isTugas || isReferensi;
        const n = childCount(p);
        const icon = isQuiz ? <ListChecks size={18} /> : isTugas ? <FileUp size={18} /> : isReferensi ? <Library size={18} /> : <FileText size={18} />;
        const typeLabel = isQuiz ? "Kuis" : isTugas ? "Tugas" : isReferensi ? "Buku kedokteran" : L.page;
        const meta = isQuiz ? `${(p.questions || []).length} soal` : isLinkKind ? (p.link ? "Ada link" : "Belum ada link") : (n ? `${n} ${L.page.toLowerCase()}` : "");
        return (
          <Row key={key} icon={icon} cover={p.cover} color={p.color}
            typeLabel={typeLabel} title={p.title} meta={meta}
            tools={role === "pengajar" ? <RowTools onRename={() => mut.renamePage(nav.notebook, nav.section, full)} onDelete={() => mut.deletePage(nav.notebook, nav.section, full, p.title)} onCover={(isQuiz || isLinkKind) ? null : ((s) => mut.setPageCover(nav.notebook, nav.section, full, s))} onColor={async () => { const c = await ask.color("Pilih warna kartu"); if (c) mut.setPageColor(nav.notebook, nav.section, full, c); }} /> : null}
            onClick={() => setNav({ ...nav, path: full })} />
        );
      })}
    </>
  );
}

/* ===== KUIS ===== */
/* ===== mini rich text editor reusable (dipakai di kuis: pertanyaan & pembahasan) ===== */
function MiniRichEditor({ html, onSave, placeholder, minHeight = 70 }) {
  const [ready, setReady] = useState(false);
  const resolvedRef = useRef("");
  useEffect(() => {
    let alive = true;
    resolveKeyedImages(html || "").then((h) => { if (alive) { resolvedRef.current = h; setReady(true); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!ready) return <div style={{ minHeight, border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg }} />;
  return <MiniRichEditorReady initialHtml={resolvedRef.current} onSave={onSave} placeholder={placeholder} minHeight={minHeight} />;
}
function MiniRichEditorReady({ initialHtml, onSave, placeholder, minHeight }) {
  const [uploading, setUploading] = useState(false);
  const editor = useTiptapEditor({
    extensions: tiptapExtensions(placeholder),
    content: initialHtml,
    editorProps: { attributes: { class: "mk-article mk-edit", style: `font-family:${FONT}` } },
    onBlur: ({ editor: ed }) => onSave(htmlToStoredKeys(ed.getHTML()))
  });
  const insertImage = async (file) => {
    setUploading(true);
    try {
      const key = await storage.uploadGambar(file, { prefix: "materi/" });
      const url = await storage.gambarSignedUrl(key);
      signedUrlCache.set(key, { url, expires: Date.now() + 50 * 60 * 1000 });
      editor.chain().focus().insertContent({ type: "imageFigure", attrs: { src: url, "data-key": key } }).run();
      onSave(htmlToStoredKeys(editor.getHTML()));
    } catch (err) {
      alert("Upload gambar gagal. Pastikan Backblaze B2 sudah dikonfigurasi (lihat tutorial).\n" + (err?.message || err));
    } finally { setUploading(false); }
  };
  const insertTable = () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); onSave(htmlToStoredKeys(editor.getHTML())); };
  if (!editor) return null;
  return (
    <div>
      <EditorToolbar editor={editor} onInsertImage={insertImage} onInsertTable={insertTable} uploading={uploading} compact />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: "0 0 10px 10px", padding: "10px 12px", minHeight, background: C.white }}>
        <TiptapContent editor={editor} />
      </div>
    </div>
  );
}

function QuizRunner({ node }) {
  const qs = node.questions || [];
  const [ans, setAns] = useState({});
  const [checked, setChecked] = useState(false);
  const score = qs.reduce((s, q, i) => s + (ans[i] === q.answer ? 1 : 0), 0);
  return (
    <div style={{ maxWidth: 720 }}>
      {qs.map((q, i) => {
        const picked = ans[i];
        return (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 18px", marginBottom: 14, background: C.white }}>
            <QuizRichView html={q.q} prefix={`${i + 1}. `} bold />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi, isCorrect = q.answer === oi;
                let bg = C.white, bd = C.border, col = C.ink, mark = null;
                if (checked) {
                  if (isCorrect) { bg = "#EAF7EE"; bd = "#8FD3A6"; col = "#1B7A3D"; mark = <CheckCircle2 size={17} color="#1B7A3D" />; }
                  else if (isPicked) { bg = "#FCEBEA"; bd = "#F0A9A3"; col = "#B23A31"; mark = <X size={17} color="#B23A31" />; }
                } else if (isPicked) { bg = C.blueTint; bd = C.blue; col = C.navy; }
                return (
                  <button key={oi} disabled={checked} onClick={() => setAns((a) => ({ ...a, [i]: oi }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderRadius: 11, border: `1.5px solid ${bd}`, background: bg, color: col, fontSize: 14, fontWeight: 600, cursor: checked ? "default" : "pointer", fontFamily: FONT, textAlign: "left" }}>
                    <span>{opt}</span>{mark}
                  </button>
                );
              })}
            </div>
            {checked && picked !== q.answer && (
              <div style={{ marginTop: 12, background: C.blueTint, borderRadius: 11, padding: "11px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: q.reason ? 4 : 0 }}>Jawaban benar: {q.options[q.answer]}</div>
                {q.reason && <QuizRichView html={q.reason} />}
              </div>
            )}
          </div>
        );
      })}
      {!checked ? (
        <button onClick={() => setChecked(true)} disabled={Object.keys(ans).length < qs.length} style={{ padding: "12px 26px", borderRadius: 12, border: "none", background: Object.keys(ans).length < qs.length ? C.border : C.blue, color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: Object.keys(ans).length < qs.length ? "default" : "pointer", fontFamily: FONT }}>Periksa jawaban</button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.navy, background: C.blueTint, padding: "10px 18px", borderRadius: 12 }}>Skor: {score} / {qs.length}</div>
          <button onClick={() => { setAns({}); setChecked(false); }} style={{ padding: "10px 20px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Ulangi</button>
        </div>
      )}
    </div>
  );
}
// render html kuis (pertanyaan/pembahasan) read-only, resolve gambar B2
function QuizRichView({ html, prefix, bold }) {
  const ref = useRef(null);
  const [resolved, setResolved] = useState(html || "");
  useEffect(() => { let alive = true; resolveKeyedImages(html || "").then((h) => alive && setResolved(h)); return () => { alive = false; }; }, [html]);
  return (
    <div ref={ref} className="mk-article" style={bold ? { fontSize: 15, fontWeight: 700, color: C.ink } : undefined}>
      {prefix && <span>{prefix}</span>}
      <span dangerouslySetInnerHTML={{ __html: sanitize(resolved) }} />
      <KeyedImages containerRef={ref} />
    </div>
  );
}

function QuizEditor({ node }) {
  const { nav, mut } = useApp();
  const [saved, setSaved] = useState(false);
  const qs = node.questions || [];
  const set = (patch) => mut.setPageContent(nav.notebook, nav.section, nav.path, patch);
  const setQ = (i, patch) => set({ questions: qs.map((q, idx) => idx === i ? { ...q, ...patch } : q) });
  const addQ = () => set({ questions: [...qs, { q: "<p>Pertanyaan baru?</p>", options: ["Pilihan A", "Pilihan B"], answer: 0, reason: "" }] });
  const delQ = (i) => set({ questions: qs.filter((_, idx) => idx !== i) });
  const ta = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", fontSize: 14, color: C.ink, fontFamily: FONT, outline: "none", boxSizing: "border-box", background: C.bg };
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FEF3C7", color: "#92600A", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, marginBottom: 14 }}><Edit3 size={13} /> Mode edit kuis</div>
      <input value={node.title} onChange={(e) => set({ title: e.target.value })} style={{ width: "100%", fontSize: 22, fontWeight: 800, color: C.navy, border: "none", borderBottom: `2px solid ${C.border}`, outline: "none", padding: "4px 0 8px", marginBottom: 20, fontFamily: FONT, background: "transparent" }} />
      {qs.map((q, i) => (
        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12, background: C.white }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: C.sub }}>Soal {i + 1}</span>
            <button onClick={() => delQ(i)} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color={C.danger} /></button>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6 }}>Pertanyaan <span style={{ fontWeight: 500, textTransform: "none" }}>(bisa gambar, tabel, video, format teks)</span></div>
          <div style={{ marginBottom: 12 }}>
            <MiniRichEditor key={`q-${i}`} html={q.q} onSave={(html) => setQ(i, { q: html })} placeholder="Tulis pertanyaan..." minHeight={60} />
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6 }}>Pilihan (klik bulatan = jawaban benar)</div>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <button onClick={() => setQ(i, { answer: oi })} aria-label="Tandai benar" style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${q.answer === oi ? "#16A34A" : C.border}`, background: q.answer === oi ? "#16A34A" : C.white, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{q.answer === oi && <Check size={13} color="#fff" />}</button>
              <input value={opt} onChange={(e) => setQ(i, { options: q.options.map((o, k) => k === oi ? e.target.value : o) })} style={ta} />
              {q.options.length > 2 && <button onClick={() => setQ(i, { options: q.options.filter((_, k) => k !== oi), answer: q.answer >= q.options.length - 1 ? 0 : q.answer })} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={13} color={C.sub} /></button>}
            </div>
          ))}
          <button onClick={() => setQ(i, { options: [...q.options, "Pilihan baru"] })} style={{ fontSize: 12.5, color: C.blue, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "2px 0", marginBottom: 10 }}>+ Tambah pilihan</button>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, margin: "4px 0 6px" }}>Alasan / pembahasan <span style={{ fontWeight: 500, textTransform: "none" }}>(opsional, bisa gambar/tabel/video)</span></div>
          <MiniRichEditor key={`r-${i}`} html={q.reason} onSave={(html) => setQ(i, { reason: html })} placeholder="Kenapa jawaban ini benar..." minHeight={50} />
        </div>
      ))}
      <button onClick={addQ} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: `1px dashed ${C.border}`, background: C.white, color: C.navy, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 16 }}><Plus size={16} color={C.blue} /> Tambah soal</button>
      <div><button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1600); }} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: saved ? "#16A34A" : C.blue, color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}>{saved ? <><Check size={16} /> Tersimpan</> : <><Save size={16} /> Simpan kuis</>}</button></div>
    </div>
  );
}

/* ===== Tugas & Buku Kedokteran: judul + link ke penyimpanan online (Drive dll), struktur identik ===== */
const LINK_KIND_LABEL = { tugas: "Tugas", referensi: "Buku kedokteran" };
function LinkResourceEditor({ node }) {
  const { nav, mut } = useApp();
  const [saved, setSaved] = useState(false);
  const set = (patch) => mut.setPageContent(nav.notebook, nav.section, nav.path, patch);
  const label = LINK_KIND_LABEL[node.kind] || "Tautan";
  const inp = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px", fontSize: 14, color: C.ink, fontFamily: FONT, outline: "none", boxSizing: "border-box", background: C.bg };
  const linkOk = /^https?:\/\//i.test(node.link || "");
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FEF3C7", color: "#92600A", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, marginBottom: 14 }}><Edit3 size={13} /> Mode edit {label.toLowerCase()}</div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6, display: "block" }}>Judul {label.toLowerCase()}</label>
        <input value={node.title} onChange={(e) => set({ title: e.target.value })} placeholder={`Contoh: ${node.kind === "referensi" ? "Konsensus Epilepsi" : "Makalah kasus stroke"}`} style={{ ...inp, fontWeight: 700, fontSize: 16 }} />
      </div>
      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6, display: "block" }}>Link penyimpanan online (Google Drive, dll)</label>
        <input value={node.link || ""} onChange={(e) => set({ link: e.target.value.trim() })} placeholder="https://drive.google.com/..." style={inp} />
        {node.link && !linkOk && <div style={{ fontSize: 12, color: C.danger, marginTop: 6 }}>Link harus diawali http:// atau https://</div>}
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 18, lineHeight: 1.6 }}>Unggah file {node.kind === "referensi" ? "buku (Word/PPT/PDF)" : "tugas (Word/PDF/PPT)"} ke Google Drive atau penyimpanan online lain, atur akses "Siapa saja yang punya link", lalu tempel linknya di sini.</div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1600); }} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: saved ? "#16A34A" : C.blue, color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}>{saved ? <><Check size={16} /> Tersimpan</> : <><Save size={16} /> Simpan</>}</button>
    </div>
  );
}
function LinkResourceViewer({ node }) {
  const label = LINK_KIND_LABEL[node.kind] || "Tautan";
  const linkOk = /^https?:\/\//i.test(node.link || "");
  return (
    <div style={{ maxWidth: 560, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, background: C.white }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: C.blue, marginBottom: 10 }}>
        {node.kind === "referensi" ? <Library size={14} /> : <FileUp size={14} />} {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.navy, marginBottom: 16 }}>{node.title}</div>
      {linkOk ? (
        <a href={node.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 11, background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: FONT }}>
          Buka & unduh <ExternalLink size={15} />
        </a>
      ) : (
        <div style={{ fontSize: 13, color: C.sub, fontStyle: "italic" }}>Link belum tersedia.</div>
      )}
    </div>
  );
}

/* tombol tambah kuis/tugas/referensi di dalam halaman (pengajar) */
function AddInside() {
  const { nav, mut } = useApp();
  const btn = { display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 11, border: `1px dashed ${C.blue}`, background: C.blueTint, color: C.navy, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT };
  return (
    <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button onClick={() => mut.addQuizSmart(nav)} style={btn}><Plus size={15} color={C.blue} /> Tambah kuis</button>
      <button onClick={() => mut.addTugasSmart(nav)} style={btn}><FileUp size={15} color={C.blue} /> Tambah tugas</button>
      <button onClick={() => mut.addReferensiSmart(nav)} style={btn}><Library size={15} color={C.blue} /> Tambah buku kedokteran</button>
    </div>
  );
}


/* tampilan sebuah sub bab: konten + daftar anak */
function PageView({ node, container, Row }) {
  const { role, nav } = useApp();
  const isQuiz = node.kind === "quiz";
  const isLinkKind = node.kind === "tugas" || node.kind === "referensi";
  const hasChildren = Object.keys(container).length > 0;
  if (isQuiz) return role === "pengajar" ? <QuizEditor node={node} /> : <QuizRunner node={node} />;
  if (isLinkKind) return role === "pengajar" ? <LinkResourceEditor node={node} /> : <LinkResourceViewer node={node} />;
  return (
    <div>
      {role === "pengajar" ? <PageContentEditor node={node} />
        : <div style={{ maxWidth: 680 }}><ArticleWithToc html={pageHtml(node)} mobile /></div>}
      {(hasChildren || role === "pengajar") && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: C.sub, marginBottom: 12 }}>Kuis, tugas & buku di halaman ini</div>
          {role === "pengajar" && <AddInside />}
          <PageRows container={container} basePath={nav.path} Row={Row} />
        </div>
      )}
    </div>
  );
}

/* ===== breadcrumb ===== */
function Crumb() {
  const { data, nav, setNav } = useApp();
  const nb = nav.notebook ? data[nav.notebook] : null;
  const sec = nb && nav.section ? nb.sections[nav.section] : null;
  const items = [{ label: "Beranda", go: () => setNav({ notebook: null, section: null, path: [] }) }];
  if (nb) items.push({ label: nb.title, go: () => setNav({ notebook: nav.notebook, section: null, path: [] }) });
  if (sec) items.push({ label: sec.title, go: () => setNav({ ...nav, path: [] }) });
  if (sec) {
    let container = sec.pages;
    nav.path.forEach((k, idx) => {
      const node = container[k];
      if (!node) return;
      const pathTo = nav.path.slice(0, idx + 1);
      const last = idx === nav.path.length - 1;
      items.push({ label: node.title, go: last ? null : () => setNav({ ...nav, path: pathTo }) });
      container = node.children || {};
    });
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.sub, marginBottom: 16, flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} color={C.sub} />}
          <span onClick={it.go || undefined} style={{ cursor: it.go ? "pointer" : "default", color: i === items.length - 1 ? C.blue : C.sub, fontWeight: i === items.length - 1 ? 700 : 500 }}>{it.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ===== ADMIN: kelola anggota ===== */
function PaymentSettings() {
  const { payment, savePayment } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(payment);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { setDraft(payment); }, [payment]);
  const inp = { width: "100%", padding: "9px 11px", fontSize: 13.5, borderRadius: 9, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", color: C.ink, background: C.bg, fontFamily: FONT };
  const lab = { fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 5, display: "block" };
  const dirty = JSON.stringify(draft) !== JSON.stringify(payment);
  const simpan = async () => {
    setSaving(true); setErr("");
    try { await savePayment(draft); setSaved(true); setTimeout(() => setSaved(false), 1600); }
    catch (e) { setErr(e?.message || "Gagal menyimpan"); }
    finally { setSaving(false); }
  };
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 20, background: C.white, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: FONT }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, fontWeight: 800, color: C.navy }}><Wallet size={16} color={C.blue} /> Pengaturan pembayaran</span>
        <ChevronDown size={17} color={C.sub} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div style={{ padding: "4px 16px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={lab}>Bank</label>
              <select value={draft.bank} onChange={(e) => setDraft({ ...draft, bank: e.target.value })} style={inp}>{BANKS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
            </div>
            <div><label style={lab}>Nominal (Rp)</label>
              <input type="number" value={draft.jumlah} onChange={(e) => setDraft({ ...draft, jumlah: Number(e.target.value) || 0 })} style={inp} />
            </div>
            <div><label style={lab}>Nomor rekening</label>
              <input value={draft.rek} onChange={(e) => setDraft({ ...draft, rek: e.target.value })} style={inp} />
            </div>
            <div><label style={lab}>Atas nama</label>
              <input value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} style={inp} />
            </div>
          </div>
          {err && <div style={{ color: C.danger, fontSize: 12, marginTop: 10 }}>{err}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <button onClick={simpan} disabled={(!dirty && !saved) || saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, border: "none", background: saved ? "#16A34A" : (dirty ? C.blue : C.border), color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: dirty && !saving ? "pointer" : "default", fontFamily: FONT }}>{saving ? "Menyimpan…" : saved ? <><Check size={15} /> Tersimpan</> : <><Save size={15} /> Simpan</>}</button>
            <span style={{ fontSize: 12, color: C.sub }}>Tampil di halaman pendaftaran pelajar.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ onClose }) {
  const { addMember } = useApp();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inp = { width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", color: C.ink, background: C.bg, fontFamily: FONT };
  const lab = { fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 5, display: "block" };
  const valid = f.name.trim() && f.email.trim() && f.password.length >= 6;
  const submit = async () => {
    if (f.password.length < 6) { setErr("Kata sandi minimal 6 karakter."); return; }
    setBusy(true); setErr("");
    try { await addMember({ name: f.name.trim(), email: f.email.trim(), password: f.password }); onClose(); }
    catch (e) { setErr(e?.message || "Gagal menambah anggota"); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ border: `1px solid ${C.blue}`, borderRadius: 14, padding: 16, marginBottom: 18, background: C.blueTint }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 12 }}>Tambah anggota manual</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}><label style={lab}>Nama lengkap</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inp} /></div>
        <div><label style={lab}>Email</label><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inp} /></div>
        <div><label style={lab}>Password <span style={{ fontWeight: 500, color: C.sub }}>(min. 6 karakter)</span></label><input type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} style={inp} /></div>
      </div>
      {err && <div style={{ color: C.danger, fontSize: 12.5, marginTop: 10 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button disabled={!valid || busy} onClick={submit} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: valid && !busy ? "#16A34A" : C.border, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: valid && !busy ? "pointer" : "default", fontFamily: FONT }}>{busy ? "Menambah…" : "Tambah (langsung terverifikasi)"}</button>
        <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.sub, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Batal</button>
      </div>
    </div>
  );
}


function fmtTanggal(iso) {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "-"; }
}
function MembersView() {
  const { members, verifyMember, deleteMember, ask } = useApp();
  const { addMemberOpen, setAddMemberOpen } = useApp();
  const [tab, setTab] = useState("pending");
  const [proof, setProof] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(false);
  const list = members.filter((m) => tab === "pending" ? !m.verified : m.verified);
  const pendingN = members.filter((m) => !m.verified).length;
  const verifN = members.filter((m) => m.verified).length;

  useEffect(() => {
    let alive = true;
    setProofUrl("");
    if (proof?.proof_url) {
      storage.buktiSignedUrl(proof.proof_url).then((u) => { if (alive) setProofUrl(u); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [proof]);

  const onVerify = async (m) => {
    if (!(await ask.confirm(`Verifikasi pembayaran ${m.name}?`, { okText: "Ya, verifikasi", danger: false }))) return;
    setBusy(true);
    try { await verifyMember(m.id); } catch (e) { await ask.confirm("Gagal verifikasi: " + (e?.message || e), { okText: "OK", danger: false }); }
    finally { setBusy(false); }
  };
  const onDelete = async (m) => {
    const typed = await ask.prompt(`Untuk hapus, ketik nama peserta persis: "${m.name}"`);
    if (typed === null) return;
    if (typed.trim() !== m.name) { await ask.confirm("Nama tidak cocok — penghapusan dibatalkan.", { okText: "Mengerti", danger: false }); return; }
    setBusy(true);
    try { await deleteMember(m.id); } catch (e) { await ask.confirm("Gagal hapus: " + (e?.message || e), { okText: "OK", danger: false }); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <PaymentSettings />

      <div style={{ display: "flex", gap: 8, background: C.bg, borderRadius: 12, padding: 4, marginBottom: 18, width: "fit-content" }}>
        {[["pending", `Belum diverifikasi (${pendingN})`], ["verified", `Terverifikasi (${verifN})`]].map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 700, background: tab === v ? C.white : "transparent", color: tab === v ? C.navy : C.sub, boxShadow: tab === v ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>{label}</button>
        ))}
      </div>

      {addMemberOpen && <AddMemberForm onClose={() => setAddMemberOpen(false)} />}

      {list.length === 0 && <EmptyState icon={<Users size={26} color={C.blue} />} title={tab === "pending" ? "Tidak ada yang menunggu" : "Belum ada anggota terverifikasi"} hint={tab === "pending" ? "Pendaftar baru akan muncul di sini." : "Anggota yang sudah diverifikasi akan muncul di sini."} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((m) => {
          const isOpen = !!open[m.id];
          return (
            <div key={m.id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.white, overflow: "hidden" }}>
              <button onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", background: "none", border: "none", cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: m.verified ? "#1B7A3D" : "#B8860B", flexShrink: 0 }}>{m.verified ? <CheckCircle2 size={13} /> : <Clock size={13} />}{m.verified ? "Terverifikasi" : "Menunggu"}</span>
                <ChevronDown size={17} color={C.sub} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
              </button>

              {isOpen && (
                <div style={{ padding: "0 15px 15px", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: C.body, margin: "12px 0 10px" }}>
                    <span>Email: <b>{m.email}</b></span>
                    <span>Nominal: <b>{rupiah(m.amount)}</b></span>
                    <span>Daftar: {fmtTanggal(m.created_at)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setProof(m)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}><Eye size={14} color={C.blue} /> Bukti bayar</button>
                    {!m.verified && <button onClick={() => onVerify(m)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: "none", background: "#16A34A", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}><ShieldCheck size={14} color="#fff" /> Verifikasi</button>}
                    <button onClick={() => onDelete(m)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.danger, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}><Trash2 size={14} color={C.danger} /> Hapus</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {proof && (
        <div onClick={() => setProof(null)} style={{ position: "fixed", inset: 0, background: "rgba(6,16,30,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 120, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 18, padding: 20, maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.navy }}>Bukti pembayaran</div>
              <button onClick={() => setProof(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color={C.sub} /></button>
            </div>
            <div style={{ background: "#F4F7FB", borderRadius: 12, padding: 12, border: `1px solid ${C.border}`, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {proof.proof_url
                ? (proofUrl
                    ? <img src={proofUrl} alt="Bukti pembayaran" style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 8, display: "block" }} />
                    : <div style={{ fontSize: 13, color: C.sub }}>Memuat bukti…</div>)
                : <div style={{ textAlign: "center", color: C.sub }}><Wallet size={34} color={C.blue} /><div style={{ fontSize: 13, marginTop: 8 }}>Tidak ada bukti diunggah</div></div>}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: C.body, marginTop: 12 }}>
              <span>{proof.name}</span><span>{rupiah(proof.amount)}</span><span>{fmtTanggal(proof.created_at)}</span>
            </div>
            {!proof.verified && <button onClick={async () => { try { await verifyMember(proof.id); } catch (e) { await ask.confirm("Gagal: " + (e?.message || e), { okText: "OK", danger: false }); } setProof(null); }} style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 12, border: "none", background: "#16A34A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><ShieldCheck size={16} color="#fff" /> Verifikasi pembayaran</button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== pencarian (mobile) ===== */
function flattenSearch(data) {
  const out = [];
  for (const [nk, nb] of Object.entries(data)) {
    out.push({ label: nb.title, type: "Buku", ctx: "", nav: { notebook: nk, section: null, path: [], view: "materi" } });
    for (const [sk, s] of Object.entries(nb.sections)) {
      out.push({ label: s.title, type: "Bagian", ctx: nb.title, nav: { notebook: nk, section: sk, path: [], view: "materi" } });
      const walk = (container, basePath) => {
        for (const [pk, p] of Object.entries(container)) {
          const full = [...basePath, pk];
          out.push({ label: p.title, type: p.kind === "quiz" ? "Kuis" : p.kind === "tugas" ? "Tugas" : p.kind === "referensi" ? "Buku kedokteran" : "Halaman", ctx: s.title, nav: { notebook: nk, section: sk, path: full, view: "materi" } });
          if (p.children) walk(p.children, full);
        }
      };
      walk(s.pages, []);
    }
  }
  return out;
}
function SearchOverlay({ onClose }) {
  const { data, setNav } = useApp();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const entries = flattenSearch(data);
  const term = q.trim().toLowerCase();
  const results = term ? entries.filter((e) => e.label.toLowerCase().includes(term)).slice(0, 40) : [];
  const iconFor = (t) => t === "Buku" ? <BookOpen size={17} color={C.blue} /> : t === "Bagian" ? <Layers size={17} color={C.blue} /> : t === "Kuis" ? <ListChecks size={17} color={C.blue} /> : t === "Tugas" ? <FileUp size={17} color={C.blue} /> : t === "Buku kedokteran" ? <Library size={17} color={C.blue} /> : <FileText size={17} color={C.blue} />;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 130, background: C.white, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: C.blue }}>
        <button onClick={onClose} aria-label="Kembali" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft size={18} color="#fff" /></button>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={17} color={C.sub} style={{ position: "absolute", left: 13, top: 12 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari materi, bagian, atau kuis" style={{ width: "100%", padding: "11px 12px 11px 38px", fontSize: 14, borderRadius: 12, border: "none", outline: "none", boxSizing: "border-box", color: C.ink, background: C.white, fontFamily: FONT }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 30px", background: C.bg }}>
        {!term && <div style={{ textAlign: "center", color: C.sub, fontSize: 14, marginTop: 40 }}>Ketik untuk mencari materi.</div>}
        {term && results.length === 0 && <div style={{ textAlign: "center", color: C.sub, fontSize: 14, marginTop: 40 }}>Tidak ada hasil untuk "{q}".</div>}
        {results.map((r, i) => (
          <button key={i} onClick={() => { setNav(r.nav); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", marginBottom: 8, borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.blueTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iconFor(r.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: C.sub }}>{r.type}{r.ctx ? ` · ${r.ctx}` : ""}</div>
            </div>
            <ChevronRight size={16} color={C.sub} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== MOBILE ===== */
function MobileShell() {
  const { data, nav, setNav, role, logout, theme, toggleTheme, setAddMemberOpen, demo } = useApp();
  const onAdd = useAddFlow();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { setScrolled(false); }, [nav.notebook, nav.section, nav.path.join("/")]);
  const nb = nav.notebook ? data[nav.notebook] : null;
  const sec = nb && nav.section ? nb.sections[nav.section] : null;
  const { node, container } = resolvePage(data, nav);
  const isPengajar = role === "pengajar";
  const inPage = !!(sec && node);

  const goBack = () => {
    if (nav.path.length) setNav({ ...nav, path: nav.path.slice(0, -1) });
    else if (nav.section) setNav({ ...nav, section: null });
    else if (nav.notebook) setNav({ notebook: null, section: null, path: [] });
  };

  let bigTitle = "Materi belajar", subtitle = "Pilih bidang studi untuk mulai belajar.";
  if (node) { bigTitle = node.title; subtitle = "Materi lengkap beserta gambar dan video."; }
  else if (sec) { bigTitle = sec.title; subtitle = `Pilih ${L.page.toLowerCase()} yang ingin kamu baca.`; }
  else if (nb) { bigTitle = nb.title; subtitle = `Pilih ${L.section.toLowerCase()} di dalam ${L.book.toLowerCase()} ini.`; }

  const pageMode = inPage && nav.view !== "anggota";
  if (pageMode) {
    const backSt = scrolled
      ? (theme === "dark"
        ? { background: "rgba(18,26,40,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "#EAF1FB", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 2px 12px rgba(0,0,0,0.35)", borderRadius: 22, padding: "8px 14px" }
        : { background: "rgba(255,255,255,0.62)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: C.navy, border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 2px 12px rgba(12,30,60,0.15)", borderRadius: 22, padding: "8px 14px" })
      : { background: "transparent", color: "#fff", border: "none", padding: "8px 4px" };
    const backIconColor = scrolled ? (theme === "dark" ? "#EAF1FB" : C.navy) : "#fff";
    return (
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 60)} style={{ height: demo ? "100%" : "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: C.blue, fontFamily: FONT }}>
        <div style={{ position: "sticky", top: 0, zIndex: 30, height: 0, overflow: "visible" }}>
          <button onClick={goBack} style={{ position: "absolute", top: 12, left: 14, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 700, transition: "background .2s, color .2s, padding .2s", ...backSt }}><ArrowLeft size={18} color={backIconColor} /> Kembali</button>
        </div>
        <div style={{ background: C.blue, padding: "14px 20px 26px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6, minHeight: 30 }}>
            <button onClick={toggleTheme} aria-label="Tema" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{theme === "light" ? <Moon size={17} color="#fff" /> : <Sun size={17} color="#fff" />}</button>
          </div>
          <h1 style={{ color: "#fff", fontSize: 25, fontWeight: 800, lineHeight: 1.2, letterSpacing: -.5, margin: "0 0 8px" }}>{bigTitle}</h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
        </div>
        <div style={{ background: C.white, borderRadius: "24px 24px 0 0", padding: "22px 18px 80px", minHeight: "55%" }}>
          <PageView node={node} container={container} Row={AirRow} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: demo ? "100%" : "100dvh", background: C.blue, fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isPengajar ? "16px 20px 18px" : "18px 20px 6px" }}>
        {nav.notebook ? (
          <button onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}><ArrowLeft size={18} color="#fff" /> Kembali</button>
        ) : (
          <button onClick={() => setNav({ notebook: null, section: null, path: [], view: "materi" })} aria-label="Beranda" style={{ display: "flex", alignItems: "center", gap: 9, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme} aria-label="Tema" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{theme === "light" ? <Moon size={17} color="#fff" /> : <Sun size={17} color="#fff" />}</button>
          {isPengajar ? (
            <>
              <button onClick={() => setNav({ ...nav, view: nav.view === "anggota" ? "materi" : "anggota", notebook: null, section: null, path: [] })} aria-label="Anggota" style={{ width: 38, height: 38, borderRadius: "50%", background: nav.view === "anggota" ? "#fff" : "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Users size={17} color={nav.view === "anggota" ? C.blue : "#fff"} /></button>
              <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.2)", padding: "8px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: FONT }}>Admin <LogOut size={13} color="#fff" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)} aria-label="Cari" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Search size={18} color="#fff" /></button>
              <button onClick={logout} aria-label="Keluar" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><LogOut size={17} color="#fff" /></button>
            </>
          )}
        </div>
      </div>

      {!isPengajar && (
        <div style={{ flexShrink: 0, padding: "14px 22px 22px" }}>
          <h1 style={{ color: "#fff", fontSize: 27, fontWeight: 800, lineHeight: 1.2, letterSpacing: -.6, margin: "0 0 10px" }}>{bigTitle}</h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{subtitle}</p>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", background: C.white, borderRadius: "24px 24px 0 0", padding: "22px 18px 40px", boxShadow: "0 -6px 24px rgba(12,111,192,0.18)" }}>
        {isPengajar && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, minHeight: 40 }}>
            {(nav.notebook || nav.view === "anggota") ? <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: -.4, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nav.view === "anggota" ? "Anggota" : bigTitle}</h1> : <div />}
            {!inPage && nav.view !== "anggota" && (
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setSearchOpen(true)} aria-label="Cari" style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Search size={18} color={C.navy} /></button>
                <button onClick={onAdd} aria-label="Tambah" style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={19} color="#fff" /></button>
              </div>
            )}
            {nav.view === "anggota" && (
              <button onClick={() => setAddMemberOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, border: "none", background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}><Plus size={16} color="#fff" /> Anggota</button>
            )}
          </div>
        )}
        {nav.view === "anggota" ? <MembersView /> : (
          <>
            {!nb && <NotebookRows Row={AirRow} />}
            {nb && !sec && <SectionRows nb={nb} Row={AirRow} />}
            {sec && !node && <PageRows container={container} basePath={[]} Row={AirRow} />}
            {sec && node && <PageView node={node} container={container} Row={AirRow} />}
          </>
        )}
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

/* ===== DESKTOP ===== */
function SideItem({ active, icon, label, onClick }) {
  return <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 11, fontSize: 14, fontWeight: 600, color: active ? "#fff" : C.sub, background: active ? C.blue : "transparent", cursor: "pointer" }}>{React.cloneElement(icon, { color: active ? "#fff" : C.sub })}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span></div>;
}
/* pohon sub bab rekursif di sidebar (expand sepanjang path aktif) */
function SideTree({ nb, sk, container, depth, basePath }) {
  const { nav, setNav } = useApp();
  return (
    <>
      {Object.entries(container).map(([pk, p]) => {
        const full = [...basePath, pk];
        const active = nav.section === sk && JSON.stringify(nav.path) === JSON.stringify(full);
        const onPath = nav.section === sk && nav.path.length >= full.length && JSON.stringify(nav.path.slice(0, full.length)) === JSON.stringify(full);
        const kids = p.children || {};
        return (
          <div key={pk}>
            <div onClick={() => setNav({ notebook: nb, section: sk, path: full })} style={{ display: "flex", alignItems: "center", gap: 8, padding: `7px 10px 7px ${10 + depth * 12}px`, borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? C.blue : C.sub, background: active ? C.blueTint : "transparent" }}>
              <FileText size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
            </div>
            {onPath && Object.keys(kids).length > 0 && <SideTree nb={nb} sk={sk} container={kids} depth={depth + 1} basePath={full} />}
          </div>
        );
      })}
    </>
  );
}
function DesktopShell() {
  const { data, nav, setNav, role, logout, demo, theme, toggleTheme, setAddMemberOpen } = useApp();
  const onAdd = useAddFlow();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const H = demo ? "100%" : "100vh";
  const nb = nav.notebook ? data[nav.notebook] : null;
  const sec = nb && nav.section ? nb.sections[nav.section] : null;
  const { node, container } = resolvePage(data, nav);
  const inPage = !!(sec && node);

  return (
    <div style={{ display: "flex", height: H, overflow: "hidden", background: C.bg, fontFamily: FONT }}>
      <div style={{ width: sidebarOpen ? 264 : 0, flexShrink: 0, overflow: "hidden", transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)" }}>
        <aside style={{ width: 264, background: C.white, borderRight: `1px solid ${C.border}`, padding: "20px 14px", display: "flex", flexDirection: "column", gap: 4, height: H, overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><img src="/logo-blue.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <span style={{ fontWeight: 800, fontSize: 16, color: C.navy, letterSpacing: -.3 }}>Materi Belajar Kedokteran</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" style={{ width: 28, height: 28, borderRadius: 8, background: C.bg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><X size={16} color={C.sub} /></button>
          </div>

          {role === "pengajar" && !inPage && nav.view !== "anggota" && (
            <button onClick={onAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", borderRadius: 11, border: "none", background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 6 }}><Plus size={17} color="#fff" /> Tambah</button>
          )}
          {role === "pengajar" && nav.view === "anggota" && (
            <button onClick={() => setAddMemberOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", borderRadius: 11, border: "none", background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 6 }}><Plus size={17} color="#fff" /> Tambah anggota</button>
          )}

          <SideItem active={!nav.notebook && nav.view !== "anggota"} icon={<Home size={18} />} label="Beranda" onClick={() => setNav({ notebook: null, section: null, path: [], view: "materi" })} />
          {role === "pengajar" && <SideItem active={nav.view === "anggota"} icon={<Users size={18} />} label="Anggota" onClick={() => setNav({ ...nav, view: "anggota" })} />}

          {Object.entries(data).map(([nbKey, notebook]) => (
            <div key={nbKey}>
              <SideItem active={nav.notebook === nbKey && !nav.section} icon={<BookOpen size={18} />} label={notebook.title} onClick={() => setNav({ notebook: nbKey, section: null, path: [] })} />
              {nav.notebook === nbKey && (
                <div style={{ margin: "2px 0 4px 20px", paddingLeft: 8, borderLeft: `2px solid ${C.border}` }}>
                  {Object.entries(notebook.sections).map(([sk, s]) => (
                    <div key={sk}>
                      <div onClick={() => setNav({ notebook: nbKey, section: sk, path: [] })} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: nav.section === sk && !nav.path.length ? 700 : 600, color: nav.section === sk && !nav.path.length ? C.blue : C.sub, background: nav.section === sk && !nav.path.length ? C.blueTint : "transparent" }}>
                        <Layers size={14} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                      </div>
                      {nav.section === sk && <SideTree nb={nbKey} sk={sk} container={s.pages} depth={1} basePath={[]} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <SideItem active={false} icon={<LogOut size={18} />} label={role === "pengajar" ? "Keluar mode admin" : "Keluar"} onClick={logout} />
          </div>
        </aside>
      </div>

      <main style={{ flex: 1, minWidth: 0, height: H, overflowY: "auto", padding: "0 0 60px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 40px 14px" }}>
            {!sidebarOpen ? (
              <button onClick={() => setSidebarOpen(true)} aria-label="Buka menu" style={{ width: 40, height: 40, borderRadius: 11, background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Menu size={19} color={C.navy} /></button>
            ) : <div />}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {role === "pengajar" && <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, background: C.blueTint, padding: "7px 13px", borderRadius: 20 }}>Mode Pengajar</span>}
              <div style={{ position: "relative", width: 240 }}>
                <Search size={16} color={C.sub} style={{ position: "absolute", left: 13, top: 12 }} />
                <input placeholder="Cari materi" style={{ width: "100%", padding: "10px 14px 10px 36px", fontSize: 13.5, borderRadius: 30, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", color: C.ink, background: C.white, fontFamily: FONT }} />
              </div>
              <button onClick={toggleTheme} aria-label="Tema" style={{ width: 40, height: 40, borderRadius: "50%", background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{theme === "light" ? <Moon size={18} color={C.navy} /> : <Sun size={18} color={C.navy} />}</button>
              {role === "pengajar" && !inPage && nav.view !== "anggota" && (
                <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 30, border: "none", background: C.blue, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}><Plus size={16} color="#fff" /> Tambah</button>
              )}
              {role === "pengajar" && nav.view === "anggota" && (
                <button onClick={() => setAddMemberOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 30, border: "none", background: C.blue, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}><Plus size={16} color="#fff" /> Tambah anggota</button>
              )}
            </div>
          </div>

          <div style={{ padding: "18px 40px 0" }}>
            {nav.view === "anggota" ? (
              <><h1 style={h1Style()}>Anggota</h1><p style={pStyle()}>Verifikasi pembayaran dan kelola akses pelajar.</p><MembersView /></>
            ) : (
              <>
                <Crumb />
                {!nb && <><h1 style={h1Style()}>Materi belajar</h1><p style={pStyle()}>Materi kedokteran tersusun per bidang studi.</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><NotebookRows Row={DeskRow} /></div></>}
                {nb && !sec && <><h1 style={h1Style()}>{nb.title}</h1><p style={pStyle()}>{L.section} dalam {L.book.toLowerCase()} ini</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><SectionRows nb={nb} Row={DeskRow} /></div></>}
                {sec && !node && <><h1 style={h1Style()}>{sec.title}</h1><p style={pStyle()}>{L.page} dalam {L.section.toLowerCase()} ini</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><PageRows container={container} basePath={[]} Row={DeskRow} /></div></>}
                {sec && node && <div style={{ maxWidth: 820 }}>{role !== "pengajar" && <h1 style={{ ...h1Style(), fontSize: 25 }}>{node.title}</h1>}<PageViewDesktop node={node} container={container} /></div>}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
const h1Style = () => ({ fontSize: 28, fontWeight: 800, color: C.navy, letterSpacing: -.5, margin: "0 0 6px" });
const pStyle = () => ({ fontSize: 14, color: C.sub, margin: "0 0 22px" });

function PageViewDesktop({ node, container }) {
  const { role, nav } = useApp();
  const isQuiz = node.kind === "quiz";
  const isLinkKind = node.kind === "tugas" || node.kind === "referensi";
  const hasChildren = Object.keys(container).length > 0;
  if (isQuiz) return role === "pengajar" ? <QuizEditor node={node} /> : <QuizRunner node={node} />;
  if (isLinkKind) return role === "pengajar" ? <LinkResourceEditor node={node} /> : <LinkResourceViewer node={node} />;
  return (
    <div>
      {role === "pengajar" ? <PageContentEditor node={node} /> : <div style={{ maxWidth: 680 }}><ArticleWithToc html={pageHtml(node)} /></div>}
      {(hasChildren || role === "pengajar") && (
        <div style={{ marginTop: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: .5, textTransform: "uppercase", color: C.sub, marginBottom: 12 }}>Kuis, tugas & buku di halaman ini</div>
          {role === "pengajar" && <AddInside />}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><PageRows container={container} basePath={nav.path} Row={DeskRow} /></div>
        </div>
      )}
    </div>
  );
}

/* ===== modal ===== */
function AskModal({ modal, onClose }) {
  const [val, setVal] = useState("");
  const [cname, setCname] = useState("");
  const [ccolor, setCcolor] = useState(null);
  const [ccover, setCcover] = useState(null);
  useEffect(() => { setVal(modal?.defaultValue || ""); setCname(""); setCcolor(null); setCcover(null); }, [modal]);
  if (!modal) return null;
  const isPrompt = modal.type === "prompt", isChoose = modal.type === "choose", isColor = modal.type === "color", isCreate = modal.type === "create";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,16,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.white, borderRadius: 18, padding: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: (isChoose || isColor) ? 16 : (isPrompt ? 14 : 18) }}>{modal.title}</div>
        {isCreate && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 6, display: "block" }}>Nama</label>
            <input autoFocus value={cname} onChange={(e) => setCname(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && cname.trim()) { modal.resolve({ name: cname.trim(), color: ccolor, cover: ccover }); onClose(); } }} placeholder={modal.placeholder || "Tulis nama"} style={{ width: "100%", padding: "11px 13px", fontSize: 14, borderRadius: 11, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", color: C.ink, background: C.bg, fontFamily: FONT, marginBottom: 16 }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8, display: "block" }}>Warna kartu</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 7, marginBottom: 16 }}>
              {[["default", { tint: C.white, chip: C.border, solid: C.blue }], ...Object.keys(CARD_COLORS_LIGHT).map(k => [k, getColor(k)])].map(([key, col]) => {
                const active = (key === "default" && !ccolor) || key === ccolor;
                return <button key={key} onClick={() => setCcolor(key === "default" ? null : key)} aria-label={key} style={{ aspectRatio: "1", borderRadius: 8, border: active ? `2px solid ${C.blue}` : `2px solid ${col.chip}`, background: col.tint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: col.solid }} /></button>;
              })}
            </div>
            {modal.withCover !== false && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8, display: "block" }}>Sampul (opsional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  {ccover ? <SignedImg src={ccover} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover" }} /> : <div style={{ width: 54, height: 54, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={20} color={C.sub} /></div>}
                  <label style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{ccover ? "Ganti" : "Unggah"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const url = await storage.uploadGambar(f, { prefix: "cover/" }); setCcover(url); } catch (err) { alert("Upload gambar gagal. Pastikan Backblaze B2 sudah dikonfigurasi (lihat tutorial).\n" + (err?.message || err)); } }} /></label>
                  {ccover && <button onClick={() => setCcover(null)} style={{ border: "none", background: "none", color: C.danger, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Hapus</button>}
                </div>
              </>
            )}
          </div>
        )}
        {isColor && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 8 }}>
            {[["default", { tint: C.white, chip: C.border, solid: C.blue }], ...Object.keys(CARD_COLORS_LIGHT).map(k => [k, getColor(k)])].map(([key, col]) => (
              <button key={key} onClick={() => { modal.resolve(key === "default" ? null : key); onClose(); }} aria-label={key} style={{ aspectRatio: "1", borderRadius: 12, border: `2px solid ${col.chip}`, background: col.tint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: col.solid }} /></button>
            ))}
          </div>
        )}
        {isChoose && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 6 }}>
            {modal.options.map((o) => (
              <button key={o.v} onClick={() => { modal.resolve(o.v); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{o.icon}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{o.label}</div><div style={{ fontSize: 12, color: C.sub }}>{o.desc}</div></div>
              </button>
            ))}
          </div>
        )}
        {isPrompt && <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { modal.resolve(val.trim() || null); onClose(); } }} style={{ width: "100%", padding: "11px 13px", fontSize: 14, borderRadius: 11, border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", color: C.ink, background: C.bg, fontFamily: FONT, marginBottom: 18 }} />}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => { modal.resolve(isPrompt ? null : ((isChoose || isColor || isCreate) ? null : false)); onClose(); }} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.sub, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Batal</button>
          {isCreate && <button disabled={!cname.trim()} onClick={() => { modal.resolve({ name: cname.trim(), color: ccolor, cover: ccover }); onClose(); }} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: cname.trim() ? C.blue : C.border, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: cname.trim() ? "pointer" : "default", fontFamily: FONT }}>Buat</button>}
          {!isChoose && !isColor && !isCreate && <button onClick={() => { modal.resolve(isPrompt ? (val.trim() || null) : true); onClose(); }} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: modal.danger ? C.danger : C.blue, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>{isPrompt ? "Simpan" : (modal.okText || "Ya")}</button>}
        </div>
      </div>
    </div>
  );
}

/* ===== LANDING / LOGIN (pelajar & admin) ===== */
function AuthField({ label, icon, ...props }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#0C6FC0", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && React.cloneElement(icon, { size: 16, color: "#66708A", style: { position: "absolute", left: 13, top: 13 } })}
        <input {...props} style={{ width: "100%", padding: icon ? "12px 14px 12px 38px" : "12px 14px", fontSize: 14, borderRadius: 12, border: "1px solid #E4EDF5", outline: "none", boxSizing: "border-box", color: "#101828", background: "#F3F8FD", fontFamily: FONT }} />
      </div>
    </div>
  );
}
function LandingAuth({ onLoggedIn, payment = PAYMENT }) {
  const [tab, setTab] = useState("pelajar");   // pelajar | admin
  const [mode, setMode] = useState("masuk");   // masuk | daftar | lupa
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const btn = { width: "100%", padding: "13px", borderRadius: 14, border: "none", background: loading ? "#7FB8E8" : "#118EEA", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: FONT, marginTop: 4 };

  const reset = () => { setEmail(""); setPw(""); setName(""); setProofFile(null); setErr(""); };
  const switchTab = (v) => { setTab(v); setMode("masuk"); setDone(false); setResetSent(false); reset(); };
  const switchMode = (m) => { setMode(m); setDone(false); setResetSent(false); setErr(""); };

  const doLogin = async () => {
    if (!email || !pw) { setErr("Isi email dan kata sandi."); return; }
    setLoading(true); setErr("");
    try {
      await db.login(email.trim(), pw);
      const prof = await db.currentProfile();
      const isAdminAccount = prof?.role === "admin";
      console.log("[DEBUG doLogin]", { tab, profRole: prof?.role, isAdminAccount, mismatch: (tab === "admin") !== isAdminAccount });
      if ((tab === "admin") !== isAdminAccount) {
        await db.logout().catch(() => {});
        setErr("Email atau kata sandi salah.");
        setLoading(false);
        return;
      }
      onLoggedIn();
    } catch (e) { setErr(pesanError(e)); setLoading(false); }
  };
  const doDaftar = async () => {
    if (!name || !email || !pw) { setErr("Nama, email, dan kata sandi wajib diisi."); return; }
    if (pw.length < 6) { setErr("Kata sandi minimal 6 karakter."); return; }
    setLoading(true); setErr("");
    try {
      await db.daftarPelajar({ name: name.trim(), email: email.trim(), password: pw, buktiFile: proofFile, amount: payment.jumlah });
      await db.logout().catch(() => {});   // jangan auto-masuk; tunggu verifikasi
      setDone(true);
    } catch (e) { setErr(pesanError(e)); }
    finally { setLoading(false); }
  };
  const doLupa = async () => {
    if (!email) { setErr("Masukkan email."); return; }
    setLoading(true); setErr("");
    try { await db.lupaPassword(email.trim()); setResetSent(true); }
    catch (e) { setErr(pesanError(e)); }
    finally { setLoading(false); }
  };

  const errBox = err ? <div style={{ background: "#FCEBEA", border: "1px solid #F0A9A3", color: "#B23A31", fontSize: 12.5, borderRadius: 10, padding: "9px 12px", marginBottom: 12, lineHeight: 1.5 }}>{err}</div> : null;

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#118EEA,#0A5EA3)", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", padding: "30px 20px", boxSizing: "border-box" }}>
      <div style={{ margin: "auto 0", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* LOGO — ganti kotak ini dengan logo buatanmu */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.18)", overflow: "hidden" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ color: "#fff", fontSize: 23, fontWeight: 800, letterSpacing: -.4, textAlign: "center" }}>Materi Belajar Kedokteran</div>
      </div>

      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 22, padding: "24px 24px 20px", boxShadow: "0 16px 50px rgba(0,0,0,0.22)" }}>
        <div style={{ display: "flex", gap: 6, background: "#F3F8FD", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[["pelajar", "Pelajar", GraduationCap], ["admin", "Admin", UserCog]].map(([v, label, Icon]) => (
            <button key={v} onClick={() => switchTab(v)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13.5, fontWeight: 700, background: tab === v ? "#118EEA" : "transparent", color: tab === v ? "#fff" : "#66708A" }}><Icon size={16} color={tab === v ? "#fff" : "#66708A"} /> {label}</button>
          ))}
        </div>

        {/* ADMIN: login saja */}
        {tab === "admin" && (
          <div>
            {errBox}
            <AuthField label="Email" icon={<Mail />} type="email" placeholder="Masukkan email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthField label="Kata sandi" icon={<Lock />} type="password" placeholder="Masukkan kata sandi" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
            <button onClick={doLogin} disabled={loading} style={btn}>{loading ? "Memproses…" : "Masuk"}</button>
            <div style={{ fontSize: 12, color: "#66708A", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>Akun admin dibuat oleh pengelola. Tidak ada pendaftaran admin.</div>
          </div>
        )}

        {/* PELAJAR: masuk */}
        {tab === "pelajar" && mode === "masuk" && (
          <div>
            {errBox}
            <AuthField label="Email" icon={<Mail />} type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthField label="Kata sandi" icon={<Lock />} type="password" placeholder="Masukkan kata sandi" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
            <div style={{ textAlign: "right", margin: "2px 0 12px" }}><span onClick={() => switchMode("lupa")} style={{ fontSize: 12.5, color: "#118EEA", fontWeight: 700, cursor: "pointer" }}>Lupa password?</span></div>
            <button onClick={doLogin} disabled={loading} style={btn}>{loading ? "Memproses…" : "Masuk"}</button>
            <div style={{ fontSize: 13, color: "#66708A", textAlign: "center", marginTop: 16 }}>Belum punya akun? <span onClick={() => switchMode("daftar")} style={{ color: "#118EEA", fontWeight: 700, cursor: "pointer" }}>Daftar di sini</span></div>
          </div>
        )}

        {/* PELAJAR: lupa password */}
        {tab === "pelajar" && mode === "lupa" && !resetSent && (
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0C6FC0", marginBottom: 4 }}>Lupa password</div>
            <div style={{ fontSize: 12.5, color: "#66708A", marginBottom: 18, lineHeight: 1.5 }}>Masukkan email akunmu. Kami kirim tautan untuk atur ulang password.</div>
            {errBox}
            <AuthField label="Email" icon={<Mail />} type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={doLupa} disabled={loading} style={btn}>{loading ? "Mengirim…" : "Kirim tautan reset"}</button>
            <div style={{ fontSize: 13, color: "#66708A", textAlign: "center", marginTop: 16 }}><span onClick={() => switchMode("masuk")} style={{ color: "#118EEA", fontWeight: 700, cursor: "pointer" }}>Kembali ke masuk</span></div>
          </div>
        )}
        {tab === "pelajar" && mode === "lupa" && resetSent && (
          <div style={{ textAlign: "center", padding: "10px 4px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#EAF4FE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Mail size={26} color="#118EEA" /></div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0C6FC0", marginBottom: 8 }}>Cek email kamu</div>
            <div style={{ fontSize: 13.5, color: "#66708A", lineHeight: 1.6, marginBottom: 18 }}>Jika email terdaftar, tautan untuk atur ulang password sudah dikirim. Cek juga folder spam.</div>
            <button onClick={() => switchMode("masuk")} style={{ ...btn, background: "#fff", color: "#0C6FC0", border: "1px solid #E4EDF5" }}>Kembali ke halaman masuk</button>
          </div>
        )}

        {/* PELAJAR: daftar */}
        {tab === "pelajar" && mode === "daftar" && !done && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0C6FC0", marginBottom: 4 }}>Daftar akun pelajar</div>
            <div style={{ fontSize: 12.5, color: "#66708A", marginBottom: 16 }}>Isi data, lakukan pembayaran, lalu unggah buktinya.</div>
            {errBox}
            <AuthField label="Nama lengkap" icon={<GraduationCap />} placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} />
            <AuthField label="Email" icon={<Mail />} type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthField label="Kata sandi" icon={<Lock />} type="password" placeholder="Buat kata sandi (min. 6 karakter)" value={pw} onChange={(e) => setPw(e.target.value)} />

            <div style={{ background: "#F3F8FD", border: "1px solid #E4EDF5", borderRadius: 13, padding: "14px 15px", margin: "6px 0 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: "#0C6FC0", marginBottom: 9 }}><Wallet size={15} color="#118EEA" /> Pembayaran</div>
              <div style={{ fontSize: 13, color: "#333B54", lineHeight: 1.7 }}>
                <div>Bank: <b>{payment.bank}</b></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>No. Rek: <b>{payment.rek}</b>
                  <button type="button" aria-label="Salin nomor rekening" onClick={() => { navigator.clipboard?.writeText(String(payment.rek).replace(/\s/g, "")); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, border: "1px solid #CADEF0", background: copied ? "#EAF7EE" : "#fff", color: copied ? "#1B7A3D" : "#0C6FC0", cursor: "pointer", fontFamily: FONT }}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>
                </div>
                <div>{payment.nama}</div>
                <div style={{ marginTop: 4 }}>Nominal: <b style={{ color: "#118EEA" }}>{rupiah(payment.jumlah)}</b></div>
              </div>
            </div>

            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: 18, border: "1.5px dashed #B7D6F2", borderRadius: 12, cursor: "pointer", background: "#F7FBFE", marginBottom: 14 }}>
              <Upload size={20} color="#118EEA" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0C6FC0" }}>{proofFile ? proofFile.name : "Unggah bukti pembayaran"}</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </label>

            <button onClick={doDaftar} disabled={loading} style={btn}>{loading ? "Mengirim…" : "Kirim pendaftaran"}</button>
            <div style={{ fontSize: 13, color: "#66708A", textAlign: "center", marginTop: 14 }}>Sudah punya akun? <span onClick={() => switchMode("masuk")} style={{ color: "#118EEA", fontWeight: 700, cursor: "pointer" }}>Masuk</span></div>
          </div>
        )}
        {tab === "pelajar" && mode === "daftar" && done && (
          <div style={{ textAlign: "center", padding: "10px 4px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#EAF7EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Clock size={28} color="#1B7A3D" /></div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0C6FC0", marginBottom: 8 }}>Pendaftaran terkirim</div>
            <div style={{ fontSize: 13.5, color: "#66708A", lineHeight: 1.6, marginBottom: 18 }}>Akunmu akan aktif setelah admin memverifikasi bukti pembayaran.</div>
            <button onClick={() => switchMode("masuk")} style={{ ...btn, background: "#fff", color: "#0C6FC0", border: "1px solid #E4EDF5" }}>Kembali ke halaman masuk</button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function pesanError(e) {
  const m = (e?.message || String(e) || "").toLowerCase();
  if (m.includes("invalid login")) return "Email atau kata sandi salah.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email ini sudah terdaftar.";
  if (m.includes("password should be at least")) return "Kata sandi minimal 6 karakter.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek email atau hubungi admin.";
  if (m.includes("network") || m.includes("fetch")) return "Gagal terhubung ke server. Cek koneksi.";
  return e?.message || "Terjadi kesalahan. Coba lagi.";
}

function BootScreen() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F7FB", fontFamily: FONT }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "#118EEA", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={24} color="#fff" /></div>
        <div style={{ fontSize: 13.5, color: "#66708A", fontWeight: 600 }}>Memuat…</div>
      </div>
    </div>
  );
}

function PendingScreen({ email, onLogout }) {
  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#118EEA,#0A5EA3)", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 20px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 22, padding: "28px 24px", textAlign: "center", boxShadow: "0 16px 50px rgba(0,0,0,0.22)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Clock size={30} color="#B8860B" /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0C6FC0", marginBottom: 8 }}>Menunggu verifikasi</div>
        <div style={{ fontSize: 13.5, color: "#66708A", lineHeight: 1.6, marginBottom: 20 }}>Akunmu {email ? `(${email})` : ""} sudah terdaftar. Akses materi aktif setelah admin memverifikasi pembayaranmu.</div>
        <button onClick={onLogout} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #E4EDF5", background: "#fff", color: "#0C6FC0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Keluar</button>
      </div>
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState(null);           // 'koas' | 'pengajar' | null
  const [pending, setPending] = useState(false);    // pelajar login tapi belum diverifikasi
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState({});
  const [contentLoaded, setContentLoaded] = useState(false);
  const [members, setMembers] = useState([]);
  const [payment, setPayment] = useState({ bank: "", rek: "", nama: "", jumlah: 0 });
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [nav, setNav] = useState({ notebook: null, section: null, path: [], view: "materi" });
  const [modal, setModal] = useState(null);
  const [theme, setTheme] = useState("light");
  THEME = theme;
  const isMobile = useIsMobile();

  const ask = {
    prompt: (title, defaultValue = "") => new Promise((resolve) => setModal({ type: "prompt", title, defaultValue, resolve })),
    confirm: (title, opts = {}) => new Promise((resolve) => setModal({ type: "confirm", title, okText: opts.okText || "Hapus", danger: opts.danger !== undefined ? opts.danger : true, resolve })),
    choose: (title, options) => new Promise((resolve) => setModal({ type: "choose", title, options, resolve })),
    color: (title) => new Promise((resolve) => setModal({ type: "color", title, resolve })),
    create: (title, opts = {}) => new Promise((resolve) => setModal({ type: "create", title, placeholder: opts.placeholder, withCover: opts.withCover, resolve }))
  };
  const mut = useMutations(data, setData, ask);

  // ---- Boot: cek sesi + muat data ----
  const bootstrap = useCallback(async () => {
    try {
      const pay = await db.loadPayment().catch(() => null);
      if (pay) setPayment(pay);
      const prof = await db.currentProfile();
      if (!prof) { setRole(null); setPending(false); setProfile(null); return; }
      setProfile(prof);
      if (prof.role === "admin") {
        setRole("pengajar"); setPending(false);
        const [tree, mem] = await Promise.all([db.loadContent().catch(() => ({})), db.listMembers().catch(() => [])]);
        setData(tree || {}); setContentLoaded(true); setMembers(mem);
      } else if (prof.verified) {
        setRole("koas"); setPending(false);
        const tree = await db.loadContent().catch(() => ({}));
        setData(tree || {}); setContentLoaded(true);
      } else {
        setRole(null); setPending(true);   // pelajar belum diverifikasi
      }
    } catch (e) {
      console.error("bootstrap error:", e);
      setRole(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = db.onAuthChange((_session, event) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") bootstrap();
    });
    return () => sub?.subscription?.unsubscribe();
  }, [bootstrap]);

  // ---- Autosave konten (admin) ----
  useEffect(() => {
    if (role !== "pengajar" || !contentLoaded) return;
    const t = setTimeout(() => { db.saveContent(data).catch((e) => console.error("save konten:", e)); }, 1200);
    return () => clearTimeout(t);
  }, [data, role, contentLoaded]);

  if (booting) return <BootScreen />;

  const doLogout = async () => {
    await db.logout().catch(() => {});
    setRole(null); setProfile(null); setPending(false);
    setData({}); setContentLoaded(false); setMembers([]);
    setNav({ notebook: null, section: null, path: [], view: "materi" });
  };

  if (pending) return <PendingScreen email={profile?.email} onLogout={doLogout} />;

  if (!role) return <LandingAuth payment={payment} onLoggedIn={() => { setBooting(true); bootstrap(); }} />;

  const toggleTheme = () => setTheme((t) => t === "light" ? "dark" : "light");
  const verifyMember = async (id) => { await db.verifyMember(id); setMembers(await db.listMembers().catch(() => members)); };
  const deleteMember = async (id) => { await db.deleteMember(id); setMembers(await db.listMembers().catch(() => members)); };
  const addMember = async (m) => { await db.adminCreateMember({ ...m, amount: payment.jumlah }); setMembers(await db.listMembers().catch(() => members)); };
  const savePaymentFn = async (p) => { await db.savePayment(p); setPayment(p); };

  const value = { data, setData, nav, setNav, role, mut, logout: doLogout, ask, demo: false, theme, toggleTheme, members, verifyMember, deleteMember, addMember, payment, savePayment: savePaymentFn, addMemberOpen, setAddMemberOpen };

  return (
    <Ctx.Provider value={value}>
      <style>{`
        .mk-card{transition:transform .12s ease, box-shadow .12s ease, background .12s ease;}
        .mk-card:active{transform:scale(0.985);}
        @media (hover:hover){.mk-card:hover{box-shadow:0 4px 16px rgba(12,30,60,0.10);}}
        @media (prefers-reduced-motion: reduce){*{transition-duration:.01ms !important;animation-duration:.01ms !important;}}
        .mk-article{font-size:14px;line-height:1.72;color:${C.body};}
        .mk-article h1{font-size:22px;font-weight:800;color:${C.navy};margin:22px 0 10px;scroll-margin-top:20px;}
        .mk-article h2{font-size:18px;font-weight:800;color:${C.navy};margin:20px 0 10px;scroll-margin-top:20px;}
        .mk-article h3{font-size:15px;font-weight:800;color:${C.navy};margin:16px 0 8px;scroll-margin-top:20px;}
        .mk-article p{margin:0 0 12px;}
        .mk-article ul,.mk-article ol{padding-left:22px;margin:0 0 12px;}
        .mk-article li{margin-bottom:5px;}
        .mk-article mark{background:#FEF08A;color:inherit;border-radius:3px;padding:0 2px;}
        .mk-article img{max-width:100%;border-radius:14px;display:block;margin:6px 0 16px;box-shadow:0 4px 16px rgba(12,111,192,.1);}
        .mk-article figure{margin:0 0 16px;}
        .mk-article figure img{margin-bottom:0;}
        .mk-article figcaption{font-size:12.5px;color:${C.sub};text-align:center;margin-top:7px;}
        .mk-article table{border-collapse:collapse;width:100%;margin:0 0 16px;table-layout:fixed;}
        .mk-article th,.mk-article td{border:1px solid ${C.border};padding:8px 10px;text-align:left;font-size:13px;vertical-align:top;}
        .mk-article th{background:${C.bg};font-weight:700;color:${C.navy};}
        .mk-article a{color:${C.blue};}
        .mk-edit{min-height:220px;outline:none;}
        .mk-edit p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:${C.sub};float:left;height:0;pointer-events:none;}
        .mk-edit .ProseMirror{outline:none;}
      `}</style>
      {isMobile ? <MobileShell /> : <DesktopShell />}
      <AskModal modal={modal} onClose={() => setModal(null)} />
    </Ctx.Provider>
  );
}
