import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Kesalahan tak terduga:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#F3F8FD" }}>
          <div style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0C6FC0", marginBottom: 8 }}>Terjadi kesalahan</div>
            <div style={{ fontSize: 13.5, color: "#66708A", marginBottom: 20, lineHeight: 1.6 }}>Halaman mengalami masalah tak terduga. Perubahan yang belum tersimpan mungkin hilang. Coba muat ulang halaman.</div>
            <button onClick={() => window.location.reload()} style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: "#118EEA", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Muat ulang</button>
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
