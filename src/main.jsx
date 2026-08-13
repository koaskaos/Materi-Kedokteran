import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Kesalahan tak terduga:", error, info); this.setState({ info }); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#F3F8FD" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0C6FC0", marginBottom: 8 }}>Terjadi kesalahan</div>
            <div style={{ fontSize: 13.5, color: "#66708A", marginBottom: 16, lineHeight: 1.6 }}>Halaman mengalami masalah tak terduga. Perubahan yang belum tersimpan mungkin hilang. Coba muat ulang halaman.</div>
            <button onClick={() => window.location.reload()} style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: "#118EEA", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 18 }}>Muat ulang</button>
            <details style={{ textAlign: "left", background: "#fff", border: "1px solid #E4EDF5", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#66708A", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 260, overflow: "auto" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, marginBottom: 6 }}>Detail teknis (kirim ini kalau lapor bug)</summary>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
              {this.state.info?.componentStack ? "\n\n--- Komponen ---" + this.state.info.componentStack : ""}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
