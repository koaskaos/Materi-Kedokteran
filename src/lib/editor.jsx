import React from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle, FontSize, FontFamily } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Node, mergeAttributes } from "@tiptap/core";
import * as storage from "./storage";

/* ===== node kustom: video YouTube tersisip di dalam alur teks ===== */
function YoutubeView({ node, updateAttributes, deleteNode }) {
  const { videoId, caption } = node.attrs;
  return (
    <NodeViewWrapper style={{ margin: "10px 0" }}>
      <div contentEditable={false} style={{ position: "relative" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 12, overflow: "hidden" }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`} title={caption || "video"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen />
        </div>
        <input
          value={caption || ""}
          placeholder="Keterangan video (opsional)"
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          style={{ width: "100%", marginTop: 6, fontSize: 12.5, color: "#66708A", border: "1px solid #E4EDF5", borderRadius: 8, padding: "6px 9px", boxSizing: "border-box", fontFamily: "inherit" }}
        />
        <button type="button" onClick={() => { if (window.confirm("Hapus video ini?")) deleteNode(); }} title="Hapus video"
          style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: "pointer", fontSize: 13, lineHeight: 1 }}>✕</button>
      </div>
    </NodeViewWrapper>
  );
}
const YoutubeNode = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { videoId: { default: null }, caption: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-youtube-video]", getAttrs: (el) => ({ videoId: el.getAttribute("data-youtube-video"), caption: el.getAttribute("data-caption") || "" }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-youtube-video": HTMLAttributes.videoId, "data-caption": HTMLAttributes.caption || "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeView);
  }
});

/* ===== gambar + caption yang bisa diformat (bold/warna/dll) seperti caption di bawah gambar Word ===== */
function ImageFigureView({ node, updateAttributes, deleteNode }) {
  const { src, "data-key": dataKey } = node.attrs;
  const isEmpty = node.textContent.length === 0;
  const [replacing, setReplacing] = React.useState(false);
  const changeImage = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      setReplacing(true);
      try {
        const key = await storage.uploadGambar(f, { prefix: "materi/" });
        const url = await storage.gambarSignedUrl(key);
        updateAttributes({ src: url, "data-key": key });
      } catch (err) {
        window.alert("Ganti gambar gagal.\n" + (err?.message || err));
      } finally { setReplacing(false); }
    };
    input.click();
  };
  return (
    <NodeViewWrapper style={{ margin: "6px 0 16px" }}>
      <div style={{ position: "relative" }} className="mk-figure-hover">
        <img src={src} data-key={dataKey || undefined} alt="" style={{ maxWidth: "100%", borderRadius: 14, display: "block", boxShadow: "0 4px 16px rgba(12,111,192,.1)", opacity: replacing ? 0.5 : 1 }} />
        <div contentEditable={false} className="mk-figure-actions" style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
          <button type="button" onClick={changeImage} disabled={replacing} title="Ganti gambar"
            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: replacing ? "default" : "pointer", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{replacing ? "…" : "⟳"}</button>
          <button type="button" onClick={() => { if (window.confirm("Hapus gambar ini?")) deleteNode(); }} title="Hapus gambar"
            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        {isEmpty && <span contentEditable={false} style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", fontSize: 12, color: "currentColor", opacity: 0.4, pointerEvents: "none" }}>Tulis keterangan gambar…</span>}
        <NodeViewContent as="figcaption" style={{ marginTop: 7, fontSize: 12.5, color: "#66708A", textAlign: "center", minHeight: 18, outline: "none" }} />
      </div>
    </NodeViewWrapper>
  );
}
const ImageFigure = Node.create({
  name: "imageFigure",
  group: "block",
  content: "inline*",
  isolating: true,
  addAttributes() {
    return { src: { default: null }, "data-key": { default: null } };
  },
  parseHTML() {
    return [{
      tag: "figure[data-image-figure]",
      getAttrs: (el) => {
        const img = el.querySelector("img");
        return { src: img?.getAttribute("src") || null, "data-key": img?.getAttribute("data-key") || null };
      },
      contentElement: "figcaption"
    }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["figure", { "data-image-figure": "" },
      ["img", mergeAttributes({ src: HTMLAttributes.src, "data-key": HTMLAttributes["data-key"] || undefined })],
      ["figcaption", 0]
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageFigureView);
  }
});

/* ===== tabel: sel bisa diwarnai (shading, seperti MS Word) ===== */
const CELL_BG_ATTR = {
  backgroundColor: {
    default: null,
    parseHTML: (el) => el.style.backgroundColor || null,
    renderHTML: (attrs) => attrs.backgroundColor ? { style: `background-color:${attrs.backgroundColor}` } : {}
  }
};
const ShadedTableCell = TableCell.extend({ addAttributes() { return { ...this.parent?.(), ...CELL_BG_ATTR }; } });
const ShadedTableHeader = TableHeader.extend({ addAttributes() { return { ...this.parent?.(), ...CELL_BG_ATTR }; } });

/* ===== daftar poin: gaya bullet bisa dipilih (titik/lingkaran/kotak), seperti MS Word ===== */
const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      listStyleType: {
        default: null,
        parseHTML: (el) => el.style.listStyleType || null,
        renderHTML: (attrs) => attrs.listStyleType ? { style: `list-style-type:${attrs.listStyleType}` } : {}
      }
    };
  }
});

export function tiptapExtensions(placeholderText) {
  return [
    StarterKit.configure({ heading: { levels: [1, 2, 3] }, bulletList: false }),
    StyledBulletList,
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TableKit.configure({ table: { resizable: true }, tableCell: false, tableHeader: false }),
    ShadedTableCell,
    ShadedTableHeader,
    ImageFigure,
    YoutubeNode,
    Placeholder.configure({
      placeholder: ({ node }) => node.type.name === "imageFigure" ? "Tulis keterangan gambar…" : (placeholderText || "Mulai menulis…"),
      showOnlyCurrent: false
    })
  ];
}

export function useTiptapEditor(opts) {
  return useEditor(opts);
}

export function TiptapContent({ editor }) {
  return <EditorContent editor={editor} />;
}

export { BubbleMenu };
