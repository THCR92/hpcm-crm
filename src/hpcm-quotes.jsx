// ============================================================
// HIGH PLAINS CUSTOM METAL — Quoting System v2
// Full rebuild: panel-optional quotes, trim-only orders,
// delivery/pickup, auto-email via Resend, metric conversion,
// SS width/SF logic, hardware auto-calc, admin product mgmt
// ============================================================
// Replace these with your actual values:
const SUPABASE_URL  = "https://ygpueqfbhlgyeqgmchfb.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncHVlcWZiaGxneWVxZ21jaGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzIyMzAsImV4cCI6MjA5NDQ0ODIzMH0.-Y4zUFN8q4lCzx5wa90AgmILpQicQ2LpWbHqQ6Dy5-w";
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── THEME ────────────────────────────────────────────────────
const C = {
  steel: "#1C2B3A", steelMid: "#2E4057", steelLight: "#4A6580",
  copper: "#B87333", copperLight: "#D4943F",
  ash: "#E8E4DC", ashDark: "#C9C4BA", smoke: "#F4F2EE", white: "#FFFFFF",
  success: "#2D6A4F", successBg: "#D8F3DC",
  warn: "#9C6000", warnBg: "#FFF3CD",
  danger: "#842029", dangerBg: "#F8D7DA",
  info: "#0A4275", infoBg: "#CFE2FF",
};

// ─── CONSTANTS ────────────────────────────────────────────────
const GAUGES = ["29", "26", "24", "22"];

// Standing seam widths and their SF/LF conversion
const SS_WIDTHS = [
  { width: '10"', inches: 10, sfPerLF: 10/12 },
  { width: '11"', inches: 11, sfPerLF: 11/12 },
  { width: '12"', inches: 12, sfPerLF: 12/12 },
  { width: '13"', inches: 13, sfPerLF: 13/12 },
  { width: '14"', inches: 14, sfPerLF: 14/12 },
  { width: '15"', inches: 15, sfPerLF: 15/12 },
  { width: '16"', inches: 16, sfPerLF: 16/12 },
  { width: '17"', inches: 17, sfPerLF: 17/12 },
  { width: '18"', inches: 18, sfPerLF: 18/12 },
  { width: '19"', inches: 19, sfPerLF: 19/12 },
  { width: '20"', inches: 20, sfPerLF: 20/12 },
  { width: '21"', inches: 21, sfPerLF: 21/12 },
  { width: '22"', inches: 22, sfPerLF: 22/12 },
  { width: '23"', inches: 23, sfPerLF: 23/12 },
  { width: '24"', inches: 24, sfPerLF: 24/12 },
];

const STRIATION_OPTIONS = ["Striations", "Bead Rib", "No Striations"];

// Built-in panel types
const BUILTIN_PANEL_TYPES = [
  { id: "ss",      label: "Standing Seam",    category: "Standing Seam", hasWidth: true,  hasStriations: true,  sfPerLF: null,  throughFastener: false, metricDisplay: false },
  { id: "pbr",     label: "PBR Panel",         category: "PBR",           hasWidth: false, hasStriations: false, sfPerLF: 3,     throughFastener: true,  metricDisplay: true  },
  { id: "tufrib",  label: "Tuf-Rib Panel",     category: "Tuf-Rib",       hasWidth: false, hasStriations: false, sfPerLF: 3,     throughFastener: true,  metricDisplay: true  },
  { id: "bb6",     label: "B&B – 6\" Board",   category: "B&B",           hasWidth: false, hasStriations: false, sfPerLF: 0.5,   throughFastener: true,  metricDisplay: false },
  { id: "bb8",     label: "B&B – 8\" Board",   category: "B&B",           hasWidth: false, hasStriations: false, sfPerLF: 0.667, throughFastener: true,  metricDisplay: false },
  { id: "bb12",    label: "B&B – 12\" Board",  category: "B&B",           hasWidth: false, hasStriations: false, sfPerLF: 1.0,   throughFastener: true,  metricDisplay: false },
  { id: "trap45",  label: "Trapezoidal 45mm",  category: "Trapezoidal",   hasWidth: false, hasStriations: false, sfPerLF: 3,     throughFastener: true,  metricDisplay: true  },
  { id: "trap75",  label: "Trapezoidal 75mm",  category: "Trapezoidal",   hasWidth: false, hasStriations: false, sfPerLF: 3,     throughFastener: true,  metricDisplay: true  },
];

// Built-in trim items — all per 10LF stick
const BUILTIN_TRIM = [
  { id: "style-d",          label: "Style D" },
  { id: "low-profile-gable",label: "Low Profile Gable" },
  { id: "overlap-gable",    label: "Overlap Gable" },
  { id: "sidewall-flash",   label: "Side Wall Flashing" },
  { id: "headwall-flash",   label: "Headwall Flashing" },
  { id: "locking-valley",   label: "Locking Valley" },
  { id: "raised-cleat",     label: "Raised Cleat" },
  { id: "ridge-cap",        label: "Ridge Cap" },
  { id: "z-bar",            label: "Z Bar" },
  { id: "transition",       label: "Transition" },
  { id: "eave-trim",        label: "Eave Trim / Drip Edge" },
  { id: "rake-trim",        label: "Rake Trim" },
  { id: "corner-in",        label: "Corner Trim – Inside" },
  { id: "corner-out",       label: "Corner Trim – Outside" },
  { id: "valley",           label: "Valley Flashing" },
  { id: "pvc-drip",         label: "PVC Weldable Drip Edge" },
  { id: "custom-trim",      label: "Custom Trim" },
];

const QUOTE_STATUSES = {
  "Draft":        { bg: "#E8E4DC", text: "#5F5E5A" },
  "Sent":         { bg: "#CFE2FF", text: "#0A4275" },
  "Approved":     { bg: "#D8F3DC", text: "#2D6A4F" },
  "In Production":{ bg: "#FFF3CD", text: "#9C6000" },
  "Complete":     { bg: "#D8F3DC", text: "#2D6A4F" },
  "Declined":     { bg: "#F8D7DA", text: "#842029" },
};

// ─── HELPERS ──────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function round4(n) { return Math.round((n + Number.EPSILON) * 10000) / 10000; }

// Parse ft/in input → decimal feet
function parseLengthFt(str) {
  if (!str) return 0;
  str = str.toString().trim();
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  const m1 = str.match(/^(\d+)['\s]+(\d+)"?$/);
  if (m1) return parseInt(m1[1]) + parseInt(m1[2]) / 12;
  const m2 = str.match(/^(\d+)'$/);
  if (m2) return parseInt(m2[1]);
  return parseFloat(str) || 0;
}

// Convert decimal feet to mm
function ftToMm(ft) { return Math.round(ft * 304.8); }

// Convert decimal feet to display string ft'in"
function ftToDisplay(ft) {
  const f = Math.floor(ft);
  const inches = Math.round((ft - f) * 12);
  return inches === 0 ? `${f}'` : `${f}' ${inches}"`;
}

function Spinner() {
  return <div style={{ width: 20, height: 20, border: `2px solid ${C.ash}`, borderTopColor: C.copper, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

function StatusBadge({ status }) {
  const s = QUOTE_STATUSES[status] || QUOTE_STATUSES["Draft"];
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: s.bg, color: s.text, fontWeight: 600, whiteSpace: "nowrap" }}>{status}</span>;
}

function SectionHead({ title, sub, optional }) {
  return (
    <div style={{ borderBottom: `2px solid ${C.copper}`, paddingBottom: 8, marginBottom: 16, marginTop: 28, display: "flex", alignItems: "baseline", gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>{title}</div>
      {optional && <span style={{ fontSize: 11, color: C.steelLight, fontStyle: "italic" }}>optional</span>}
      {sub && <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SelectBtn({ label, selected, onClick, disabled, warn }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${warn ? C.danger : selected ? C.copper : C.ashDark}`, background: warn ? C.dangerBg : selected ? "#FFF8F2" : C.white, color: warn ? C.danger : selected ? C.copper : C.steelLight, fontSize: 12, fontWeight: selected ? 700 : 400, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

// Customer searchable dropdown
function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = customers.find(c => c.id === value);
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.contact || "").toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div style={{ position: "relative" }}>
      <input
        value={open ? query : (selected ? selected.name : "")}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Search customers…"
        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box", color: C.steel }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.white, border: `1px solid ${C.ashDark}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, maxHeight: 220, overflowY: "auto", marginTop: 2 }}>
          {filtered.length === 0 && <div style={{ padding: "10px 14px", fontSize: 13, color: C.steelLight }}>No customers found</div>}
          {filtered.map(c => (
            <div key={c.id} onMouseDown={() => { onChange(c.id); setQuery(""); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${C.ash}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.smoke}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.steelLight }}>{c.contact} · {c.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: COLOR MANAGER ────────────────────────────────────
function ColorManager({ onClose }) {
  const PROVIDERS = ["Coated Metals Group", "United Steel Supply", "Sheffield Metals"];
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", hex: "#888888", finish: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadColors(); }, [provider]);

  async function loadColors() {
    setLoading(true);
    const { data } = await supabase.from("color_palette").select("*").eq("provider", provider).order("name");
    setColors(data || []);
    setLoading(false);
  }

  async function addColor() {
    if (!newColor.name) return;
    setSaving(true);
    await supabase.from("color_palette").insert({ ...newColor, provider });
    setNewColor({ name: "", hex: "#888888", finish: "" });
    setSaving(false);
    setMsg("Color added.");
    setTimeout(() => setMsg(null), 2000);
    loadColors();
  }

  async function deleteColor(id) {
    await supabase.from("color_palette").delete().eq("id", id);
    loadColors();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 680, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40 }}>
        <div style={{ background: C.steel, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>Manage Color Palettes</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setProvider(p)}
                style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${provider === p ? C.copper : C.ashDark}`, background: provider === p ? "#FFF8F2" : C.white, color: provider === p ? C.copper : C.steelLight, fontSize: 12, fontWeight: provider === p ? 700 : 400, cursor: "pointer" }}>{p}</button>
            ))}
          </div>

          {/* Add new color */}
          <div style={{ background: C.smoke, borderRadius: 10, padding: 16, marginBottom: 20, border: `1px solid ${C.ash}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 12 }}>Add Color to {provider}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr auto", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Color Name</label>
                <input value={newColor.name} onChange={e => setNewColor({ ...newColor, name: e.target.value })} placeholder="e.g. Charcoal Gray"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Hex Color</label>
                <input type="color" value={newColor.hex} onChange={e => setNewColor({ ...newColor, hex: e.target.value })}
                  style={{ width: "100%", height: 36, borderRadius: 6, border: `1px solid ${C.ashDark}`, cursor: "pointer", padding: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Finish / Coating</label>
                <input value={newColor.finish} onChange={e => setNewColor({ ...newColor, finish: e.target.value })} placeholder="e.g. Kynar 500"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <button onClick={addColor} disabled={saving || !newColor.name}
                style={{ padding: "8px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36 }}>
                {saving ? "…" : "Add"}
              </button>
            </div>
            {msg && <div style={{ fontSize: 12, color: C.success, marginTop: 8 }}>{msg}</div>}
          </div>

          {/* Color list */}
          {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><Spinner /></div> : (
            <div>
              <div style={{ fontSize: 12, color: C.steelLight, marginBottom: 10 }}>{colors.length} colors in {provider}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
                {colors.map(col => (
                  <div key={col.id} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.ash}`, position: "relative" }}>
                    <div style={{ height: 50, background: col.hex }} />
                    <div style={{ padding: "6px 8px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.steel }}>{col.name}</div>
                      {col.finish && <div style={{ fontSize: 10, color: C.steelLight }}>{col.finish}</div>}
                    </div>
                    <button onClick={() => deleteColor(col.id)}
                      style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.4)", color: C.white, border: "none", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                  </div>
                ))}
                {colors.length === 0 && <div style={{ gridColumn: "span 4", padding: 20, textAlign: "center", color: C.steelLight, fontSize: 13 }}>No colors yet. Add the first one above.</div>}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN: CUSTOM PRODUCT MANAGER ───────────────────────────
function CustomProductManager({ onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const UNITS = ["LF", "SF", "each", "roll", "bag", "box", "stick"];
  const [form, setForm] = useState({ name: "", unit: "each", requires_gauge: true, category: "Custom Panel", notes: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from("custom_products").select("*").order("name");
    setProducts(data || []);
    setLoading(false);
  }

  async function addProduct() {
    if (!form.name) return;
    setSaving(true);
    await supabase.from("custom_products").insert(form);
    setForm({ name: "", unit: "each", requires_gauge: true, category: "Custom Panel", notes: "" });
    setSaving(false);
    setMsg("Product added.");
    setTimeout(() => setMsg(null), 2500);
    loadProducts();
  }

  async function deleteProduct(id) {
    await supabase.from("custom_products").delete().eq("id", id);
    loadProducts();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 720, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40 }}>
        <div style={{ background: C.steel, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>Custom Products & Accessories</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: C.smoke, borderRadius: 10, padding: 16, marginBottom: 20, border: `1px solid ${C.ash}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 12 }}>Add New Product / Accessory</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Product Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. PVC Weldable Drip Edge"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Unit</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Custom Panel, Trim, etc."
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6 }}>Requires Gauge Selection?</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setForm({ ...form, requires_gauge: v })}
                      style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${form.requires_gauge === v ? C.copper : C.ashDark}`, background: form.requires_gauge === v ? "#FFF8F2" : C.white, color: form.requires_gauge === v ? C.copper : C.steelLight, fontSize: 12, cursor: "pointer", fontWeight: form.requires_gauge === v ? 700 : 400 }}>
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional description"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={addProduct} disabled={saving || !form.name}
                style={{ padding: "8px 20px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Adding…" : "Add Product"}
              </button>
              {msg && <span style={{ fontSize: 13, color: C.success }}>{msg}</span>}
            </div>
          </div>

          {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><Spinner /></div> : (
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, padding: "8px 14px", background: C.smoke, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
                <span>Product</span><span>Unit</span><span>Category</span><span>Gauge Req.</span><span></span>
              </div>
              {products.length === 0 && <div style={{ padding: 30, textAlign: "center", color: C.steelLight, fontSize: 13 }}>No custom products yet.</div>}
              {products.map((p, i) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, padding: "10px 14px", borderBottom: i < products.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{p.name}</div>
                    {p.notes && <div style={{ fontSize: 11, color: C.steelLight }}>{p.notes}</div>}
                  </div>
                  <span style={{ fontSize: 12, color: C.steelLight }}>{p.unit}</span>
                  <span style={{ fontSize: 12, color: C.steelLight }}>{p.category}</span>
                  <span style={{ fontSize: 12, color: p.requires_gauge ? C.info : C.steelLight }}>{p.requires_gauge ? "Yes" : "No"}</span>
                  <button onClick={() => deleteProduct(p.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRICE TABLE EDITOR ───────────────────────────────────────
function PriceTableEditor({ onClose }) {
  const [prices, setPrices] = useState({ panels: {}, trim: {}, hardware: {}, custom: {} });
  const [customProducts, setCustomProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("panels");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: pd }, { data: cp }] = await Promise.all([
      supabase.from("price_table").select("*"),
      supabase.from("custom_products").select("*").order("name"),
    ]);
    const p = { panels: {}, trim: {}, hardware: {}, custom: {} };
    (pd || []).forEach(row => { p[row.category] = p[row.category] || {}; p[row.category][row.item_key] = row.price; });
    setPrices(p);
    setCustomProducts(cp || []);
    setLoading(false);
  }

  async function savePrices() {
    setSaving(true);
    const rows = [];
    Object.entries(prices).forEach(([cat, items]) => {
      Object.entries(items).forEach(([k, v]) => {
        if (v !== "" && v !== undefined) rows.push({ category: cat, item_key: k, price: parseFloat(v) || 0 });
      });
    });
    await supabase.from("price_table").upsert(rows, { onConflict: "category,item_key" });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function setP(cat, key, val) { setPrices(p => ({ ...p, [cat]: { ...p[cat], [key]: val } })); }

  const ts = t => ({ padding: "8px 16px", fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? C.steel : C.steelLight, background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: tab === t ? C.copper : "transparent", cursor: "pointer", fontFamily: "inherit" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 820, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40 }}>
        <div style={{ background: C.steel, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>Price Table</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.ash}`, padding: "0 24px" }}>
          {["panels", "trim", "hardware", "custom"].map(t => <button key={t} style={ts(t)} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>
        <div style={{ padding: "20px 24px", maxHeight: "60vh", overflowY: "auto" }}>
          {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : (
            <>
              {tab === "panels" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Standing Seam: price per LF (quoted by LF, invoiced by SF). All others: price per LF.</p>
                  {BUILTIN_PANEL_TYPES.map(pt => (
                    <div key={pt.id} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 8, paddingBottom: 5, borderBottom: `1px solid ${C.ash}` }}>{pt.label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                        {GAUGES.map(g => {
                          const strs = pt.hasStriations ? STRIATION_OPTIONS : ["standard"];
                          return strs.map(str => {
                            const key = `${pt.id}|${g}|${str}`;
                            return (
                              <div key={key}>
                                <label style={{ fontSize: 10, color: C.steelLight, display: "block", marginBottom: 3 }}>{g}ga{pt.hasStriations ? ` · ${str}` : ""}</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 12, color: C.steelLight }}>$</span>
                                  <input value={prices.panels?.[key] ?? ""} onChange={e => setP("panels", key, e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                                    style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 12 }} />
                                  <span style={{ fontSize: 10, color: C.steelLight }}>/LF</span>
                                </div>
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "trim" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Price per 10LF stick. Set price per gauge.</p>
                  {BUILTIN_TRIM.map(item => (
                    <div key={item.id} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.steel, marginBottom: 6 }}>{item.label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {GAUGES.map(g => {
                          const key = `${item.id}|${g}`;
                          return (
                            <div key={key}>
                              <label style={{ fontSize: 10, color: C.steelLight, display: "block", marginBottom: 3 }}>{g} gauge</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 12, color: C.steelLight }}>$</span>
                                <input value={prices.trim?.[key] ?? ""} onChange={e => setP("trim", key, e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                                  style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 12 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "hardware" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Price per bag/box/each.</p>
                  {[
                    { key: "flathead-wood-screws", label: "Flat Top Wood Screws (250/bag) — SS" },
                    { key: "ss-clips", label: "Standing Seam Clips (per box)" },
                    { key: "tf-screws-wood", label: "Wood Grip Screws (250/bag) — TF panels" },
                    { key: "tf-screws-metal", label: "Metal Screws (250/bag) — TF panels" },
                    { key: "rivets", label: "Rivets (250/bag)" },
                    { key: "butyl-tape", label: "Butyl Tape (per roll)" },
                    { key: "closure-foam", label: "Foam Closure Strips (each)" },
                  ].map(h => (
                    <div key={h.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "8px 12px", background: C.smoke, borderRadius: 8 }}>
                      <span style={{ flex: 1, fontSize: 13, color: C.steel }}>{h.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, color: C.steelLight }}>$</span>
                        <input value={prices.hardware?.[h.key] ?? ""} onChange={e => setP("hardware", h.key, e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                          style={{ width: 90, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "custom" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Set prices for custom products by gauge where applicable.</p>
                  {customProducts.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.steelLight }}>No custom products yet. Add them in the Custom Products admin panel.</div>}
                  {customProducts.map(cp => (
                    <div key={cp.id} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.steel, marginBottom: 6 }}>{cp.name} <span style={{ fontWeight: 400, color: C.steelLight }}>per {cp.unit}</span></div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {(cp.requires_gauge ? GAUGES : ["standard"]).map(g => {
                          const key = `${cp.id}|${g}`;
                          return (
                            <div key={key}>
                              <label style={{ fontSize: 10, color: C.steelLight, display: "block", marginBottom: 3 }}>{cp.requires_gauge ? `${g} gauge` : "Price"}</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 12, color: C.steelLight }}>$</span>
                                <input value={prices.custom?.[key] ?? ""} onChange={e => setP("custom", key, e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                                  style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 12 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 13, color: C.success }}>✓ Saved</span>}
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
          <button onClick={savePrices} disabled={saving} style={{ padding: "8px 22px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving…" : "Save Prices"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── COLOR PICKER DROPDOWN ────────────────────────────────────
function ColorPicker({ provider, value, onChange }) {
  const [colors, setColors] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider) return;
    setLoading(true);
    supabase.from("color_palette").select("*").eq("provider", provider).order("name")
      .then(({ data }) => { setColors(data || []); setLoading(false); });
  }, [provider]);

  const selected = colors.find(c => c.id === value);

  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: C.white, minHeight: 36 }}>
        {selected
          ? <><div style={{ width: 18, height: 18, borderRadius: 4, background: selected.hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} /><span style={{ color: C.steel }}>{selected.name}</span></>
          : <span style={{ color: C.steelLight }}>{loading ? "Loading…" : provider ? "Select color…" : "Select provider first"}</span>
        }
        <span style={{ marginLeft: "auto", color: C.steelLight, fontSize: 10 }}>▾</span>
      </div>
      {open && colors.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.white, border: `1px solid ${C.ashDark}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: 260, overflowY: "auto", marginTop: 2 }}>
          {colors.map(col => (
            <div key={col.id} onMouseDown={() => { onChange(col.id, col.name, col.hex); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${C.ash}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.smoke}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: col.hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: C.steel }}>{col.name}</div>
                {col.finish && <div style={{ fontSize: 10, color: C.steelLight }}>{col.finish}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QUOTE PRINT VIEW ─────────────────────────────────────────
function QuotePrintView({ quote, customer, onClose, onApproved }) {
  const [sigName, setSigName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  async function handleApprove() {
    if (!sigName || !agreed) return;
    setSaving(true);
    await supabase.from("quotes").update({
      status: "Approved",
      approved_by_name: sigName,
      approved_at: new Date().toISOString(),
    }).eq("id", quote.id);
    setSaving(false);
    setSubmitted(true);
    if (onApproved) onApproved();
  }

  const hasPanel = quote.panel_type_id && quote.panel_rows?.length > 0;
  const hasTrim = quote.trim_rows?.some(r => r.totalSticks > 0);
  const hasHardware = quote.hardware_rows?.some(r => r.packsNeeded > 0);
  const hasCustom = quote.custom_rows?.some(r => r.qty > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.7)", zIndex: 3000, overflowY: "auto", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 780, background: C.white, borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", marginBottom: 40 }}>
        {/* Header */}
        <div style={{ background: C.steel, padding: "24px 36px", display: "flex", justifyContent: "space-between", borderRadius: "12px 12px 0 0" }}>
          <div>
            <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700 }}>High Plains Custom Metal</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Cheyenne, Wyoming · hpcmcrm.net</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.copperLight, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700 }}>QUOTE</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>#{quote.quote_number}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{today}</div>
          </div>
        </div>
        <div style={{ padding: "24px 36px" }}>

          {/* Customer + Job info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.ash}` }}>
            <div>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Quote For</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.steel }}>{customer?.name}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.contact}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.email}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Job Details</div>
              {quote.po_number && <div style={{ fontSize: 13, color: C.steel }}>PO: <strong>{quote.po_number}</strong></div>}
              {quote.job_site_address && <div style={{ fontSize: 13, color: C.steelLight }}>{quote.job_site_address}</div>}
              {quote.due_date && <div style={{ fontSize: 13, color: C.steelLight }}>Due: {quote.due_date}</div>}
              <div style={{ marginTop: 6, display: "inline-flex", padding: "3px 10px", borderRadius: 12, background: quote.fulfillment === "Delivery" ? C.infoBg : C.successBg, color: quote.fulfillment === "Delivery" ? C.info : C.success, fontSize: 12, fontWeight: 600 }}>
                {quote.fulfillment === "Delivery" ? `🚚 Delivery → ${quote.delivery_address}` : "🏭 Pickup"}
              </div>
            </div>
          </div>

          {/* Panel specs + cut list */}
          {hasPanel && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                Panels — {quote.panel_label} · {quote.gauge}ga · {quote.panel_color_name} · {quote.striation || quote.panel_width}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Qty", "Length", quote.metric_display ? "Length (mm)" : "LF Each", "Total LF", quote.sf_per_lf ? "Total SF" : null, "Price/LF", "Line Total"].filter(Boolean).map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: h === "Qty" || h === "Length" || h === "Length (mm)" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(quote.panel_rows || []).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{row.qty}</td>
                      <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{row.lengthDisplay}</td>
                      {quote.metric_display && <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{ftToMm(row.lengthFt)} mm</td>}
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{round2(row.lengthFt).toFixed(2)}'</td>
                      {quote.sf_per_lf && <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{round2(row.qty * row.lengthFt * quote.sf_per_lf).toFixed(2)} SF</td>}
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerLF)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: C.smoke }}>
                    <td colSpan={quote.metric_display ? 3 : 2} style={{ padding: "8px 10px", fontWeight: 600, fontSize: 12, border: `1px solid ${C.ash}` }}>Totals</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: `1px solid ${C.ash}` }}>{round2(quote.total_panel_lf).toFixed(2)} LF</td>
                    {quote.sf_per_lf && <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: `1px solid ${C.ash}` }}>{round2(quote.total_panel_sf).toFixed(2)} SF</td>}
                    <td style={{ border: `1px solid ${C.ash}` }} />
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, border: `1px solid ${C.ash}` }}>{fmt(quote.panel_subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Trim */}
          {hasTrim && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Trim & Accessories</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Item", "Actual LF", "Sticks (waste)", "Total Sticks", "Price/Stick", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: h === "Item" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(quote.trim_rows || []).filter(r => r.totalSticks > 0).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{row.label}{row.customLabel ? ` — ${row.customLabel}` : ""}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.actualLF} LF</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.sticksWaste}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{row.totalSticks}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerStick)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hardware */}
          {hasHardware && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Hardware & Fasteners</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Item", "Qty Needed", "Packs/Bags", "Price Each", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: h === "Item" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(quote.hardware_rows || []).filter(r => r.packsNeeded > 0).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{row.label}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.qtyNeeded}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{row.packsNeeded}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerPack)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Custom products */}
          {hasCustom && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Additional Items</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Item", "Gauge", "Qty", "Unit", "Unit Price", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: h === "Item" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(quote.custom_rows || []).filter(r => r.qty > 0).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 10px", border: `1px solid ${C.ash}` }}>{row.name}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.gauge || "—"}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.qty}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.unit}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.unitPrice)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <div style={{ width: 300 }}>
              {[
                hasPanel && ["Panels", fmt(quote.panel_subtotal)],
                hasTrim && ["Trim & Accessories", fmt(quote.trim_subtotal)],
                hasHardware && ["Hardware", fmt(quote.hardware_subtotal)],
                hasCustom && ["Additional Items", fmt(quote.custom_subtotal)],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: C.steelLight, borderBottom: `1px solid ${C.ash}` }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 17, fontWeight: 700, color: C.steel }}>
                <span>TOTAL</span><span>{fmt(quote.total_price)}</span>
              </div>
              <div style={{ fontSize: 11, color: C.steelLight }}>Quote valid 30 days. Prices subject to material availability.</div>
            </div>
          </div>

          {/* Approval section */}
          {!submitted ? (
            <div style={{ borderTop: `2px solid ${C.ash}`, paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 10 }}>Customer Approval</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, cursor: "pointer" }} />
                <label style={{ fontSize: 13, color: C.steelLight, cursor: "pointer", lineHeight: 1.5 }} onClick={() => setAgreed(!agreed)}>
                  I approve the pricing and specifications in this quote. I understand that panel lengths are customer-provided measurements and this quote is valid for 30 days.
                </label>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Full Name (typed signature)</label>
                  <input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Type your full name to approve"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.ashDark}`, fontSize: 14, boxSizing: "border-box", fontFamily: "cursive", color: C.steel }} />
                </div>
                <button onClick={handleApprove} disabled={!agreed || !sigName || saving}
                  style={{ padding: "10px 24px", borderRadius: 8, background: agreed && sigName ? C.success : C.ashDark, color: C.white, border: "none", fontSize: 13, fontWeight: 700, cursor: agreed && sigName ? "pointer" : "default" }}>
                  {saving ? "Saving…" : "Approve Quote"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: `2px solid ${C.ash}`, paddingTop: 18, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.success }}>Quote Approved by {sigName}</div>
              <div style={{ fontSize: 13, color: C.steelLight, marginTop: 4 }}>Approved {today}. High Plains Custom Metal will contact you to schedule production.</div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 36px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "space-between" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
          <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, fontSize: 13, cursor: "pointer" }}>🖨 Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

// ─── QUOTE BUILDER ────────────────────────────────────────────
function QuoteBuilder({ customers, preselectedCustomerId, prices, onClose, onSaved, quoteToEdit }) {
  const isEdit = !!quoteToEdit;
  const PROVIDERS = ["Coated Metals Group", "United Steel Supply", "Sheffield Metals"];

  // ── Header state ──
  const [customerId, setCustomerId] = useState(preselectedCustomerId || quoteToEdit?.customer_id || "");
  const [poNumber, setPoNumber] = useState(quoteToEdit?.po_number || "");
  const [jobSiteAddress, setJobSiteAddress] = useState(quoteToEdit?.job_site_address || "");
  const [dueDate, setDueDate] = useState(quoteToEdit?.due_date || "");
  const [fulfillment, setFulfillment] = useState(quoteToEdit?.fulfillment || "Pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(quoteToEdit?.delivery_address || "");
  const [notes, setNotes] = useState(quoteToEdit?.notes || "");

  // ── Panel section (optional) ──
  const [includePanel, setIncludePanel] = useState(!!quoteToEdit?.panel_type_id);
  const [panelTypeId, setPanelTypeId] = useState(quoteToEdit?.panel_type_id || "ss");
  const [gauge, setGauge] = useState(quoteToEdit?.gauge || "26");
  const [striation, setStriation] = useState(quoteToEdit?.striation || "No Striations");
  const [ssWidth, setSsWidth] = useState(quoteToEdit?.ss_width || '16"');
  const [tfScrewType, setTfScrewType] = useState(quoteToEdit?.tf_screw_type || "Wood Grip");
  const [colorProvider, setColorProvider] = useState(quoteToEdit?.color_provider || "");
  const [colorId, setColorId] = useState(quoteToEdit?.color_id || "");
  const [colorName, setColorName] = useState(quoteToEdit?.color_name || "");
  const [colorHex, setColorHex] = useState(quoteToEdit?.color_hex || "");
  const [panelRows, setPanelRows] = useState(quoteToEdit?.panel_rows || [{ qty: 1, lengthInput: "", lengthFt: 0, lengthDisplay: "" }]);

  // ── Trim ──
  const [trimGauge, setTrimGauge] = useState(quoteToEdit?.trim_gauge || gauge);
  const [trimRows, setTrimRows] = useState(() =>
    quoteToEdit?.trim_rows || BUILTIN_TRIM.map(t => ({ ...t, actualLF: 0, sticksWaste: 0, totalSticks: 0, customLabel: "" }))
  );

  // ── Hardware ──
  const [hardwareRows, setHardwareRows] = useState(quoteToEdit?.hardware_rows || []);

  // ── Custom products ──
  const [customProducts, setCustomProducts] = useState([]);
  const [customRows, setCustomRows] = useState(quoteToEdit?.custom_rows || []);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [savedQuoteData, setSavedQuoteData] = useState(null);
  const [emailMsg, setEmailMsg] = useState(null);

  const customer = customers.find(c => c.id === customerId);
  const requiresPO = customer?.type === "Contractor/Builder";
  const pt = BUILTIN_PANEL_TYPES.find(p => p.id === panelTypeId) || BUILTIN_PANEL_TYPES[0];

  // SS width object
  const ssWidthObj = SS_WIDTHS.find(w => w.width === ssWidth) || SS_WIDTHS[6];
  const sfPerLF = pt.id === "ss" ? ssWidthObj.sfPerLF : (pt.sfPerLF || null);

  // Width > 16" striation warning
  const wideNoStriation = pt.id === "ss" && ssWidthObj.inches > 16 && striation === "No Striations";

  // Price key for panels
  const priceKey = `${panelTypeId}|${gauge}|${pt.hasStriations ? striation : "standard"}`;
  const pricePerLF = parseFloat(prices?.panels?.[priceKey] || 0);

  useEffect(() => {
    supabase.from("custom_products").select("*").order("name").then(({ data }) => {
      setCustomProducts(data || []);
      if (!quoteToEdit) {
        setCustomRows((data || []).map(cp => ({ ...cp, qty: 0, gauge: cp.requires_gauge ? gauge : null, unitPrice: 0, lineTotal: 0 })));
      }
    });
  }, []);

  // Sync trim gauge with panel gauge by default
  useEffect(() => { if (!quoteToEdit) setTrimGauge(gauge); }, [gauge]);

  // Auto-build hardware rows when panel type or key values change
  useEffect(() => {
    if (!includePanel) { setHardwareRows([]); return; }
    buildHardwareRows();
  }, [panelTypeId, gauge, tfScrewType, includePanel]);

  function buildHardwareRows() {
    if (pt.id === "ss") {
      setHardwareRows([
        { id: "flathead-wood-screws", label: "Flat Top Wood Screws", packSize: 250, unit: "bag", autoCalc: true, qtyNeeded: 0, packsNeeded: 0 },
        { id: "ss-clips", label: "Standing Seam Clips", packSize: 500, unit: "box", autoCalc: true, qtyNeeded: 0, packsNeeded: 0 },
      ]);
    } else if (pt.throughFastener) {
      const screwKey = tfScrewType === "Wood Grip" ? "tf-screws-wood" : "tf-screws-metal";
      setHardwareRows([
        { id: screwKey, label: `${tfScrewType} Screws`, packSize: 250, unit: "bag", autoCalc: true, qtyNeeded: 0, packsNeeded: 0 },
        { id: "rivets", label: "Rivets", packSize: 250, unit: "bag", autoCalc: false, qtyNeeded: 0, packsNeeded: 0 },
        { id: "closure-foam", label: "Foam Closure Strips", packSize: 1, unit: "each", autoCalc: false, qtyNeeded: 0, packsNeeded: 0 },
        { id: "butyl-tape", label: "Butyl Tape", packSize: 1, unit: "roll", autoCalc: false, qtyNeeded: 0, packsNeeded: 0 },
      ]);
    } else {
      setHardwareRows([]);
    }
  }

  // Compute panel rows
  const computedPanelRows = useMemo(() => panelRows.map(row => {
    const totalLF = round2(row.qty * row.lengthFt);
    const lineTotal = round2(totalLF * pricePerLF);
    return { ...row, totalLF, pricePerLF, lineTotal };
  }), [panelRows, pricePerLF]);

  const totalPanelLF = useMemo(() => computedPanelRows.reduce((a, r) => a + r.totalLF, 0), [computedPanelRows]);
  const totalPanelSF = useMemo(() => sfPerLF ? round2(totalPanelLF * sfPerLF) : null, [totalPanelLF, sfPerLF]);
  const panelSubtotal = useMemo(() => computedPanelRows.reduce((a, r) => a + r.lineTotal, 0), [computedPanelRows]);

  // Auto-calc hardware quantities
  const computedHardwareRows = useMemo(() => hardwareRows.map(row => {
    const pricePerPack = parseFloat(prices?.hardware?.[row.id] || 0);
    let qtyNeeded = row.qtyNeeded;
    let packsNeeded = row.packsNeeded;
    if (row.autoCalc) {
      if (pt.id === "ss") {
        if (row.id === "flathead-wood-screws") { qtyNeeded = Math.ceil(totalPanelLF * 1); packsNeeded = Math.ceil(qtyNeeded / 250); }
        if (row.id === "ss-clips") { qtyNeeded = Math.ceil(totalPanelLF * 0.5); packsNeeded = Math.ceil(qtyNeeded / 500); }
      } else if (pt.throughFastener && totalPanelSF) {
        qtyNeeded = Math.ceil((totalPanelSF / 100) * 110);
        packsNeeded = Math.ceil(qtyNeeded / 250);
      }
    }
    return { ...row, qtyNeeded, packsNeeded, pricePerPack, lineTotal: round2(packsNeeded * pricePerPack) };
  }), [hardwareRows, totalPanelLF, totalPanelSF, prices?.hardware, pt.id, pt.throughFastener]);

  const hardwareSubtotal = useMemo(() => computedHardwareRows.reduce((a, r) => a + r.lineTotal, 0), [computedHardwareRows]);

  // Compute trim rows
  const computedTrimRows = useMemo(() => trimRows.map(row => {
    const trimKey = `${row.id}|${trimGauge}`;
    const pricePerStick = parseFloat(prices?.trim?.[trimKey] || 0);
    const totalSticks = Math.ceil((row.actualLF || 0) / 10) + (parseInt(row.sticksWaste) || 0);
    return { ...row, totalSticks, pricePerStick, lineTotal: round2(totalSticks * pricePerStick) };
  }), [trimRows, trimGauge, prices?.trim]);

  const trimSubtotal = useMemo(() => computedTrimRows.reduce((a, r) => a + r.lineTotal, 0), [computedTrimRows]);

  // Compute custom rows
  const computedCustomRows = useMemo(() => customRows.map(row => {
    const cpGauge = row.requires_gauge ? (row.gauge || gauge) : "standard";
    const cpKey = `${row.id}|${cpGauge}`;
    const unitPrice = parseFloat(prices?.custom?.[cpKey] || 0);
    return { ...row, unitPrice, lineTotal: round2((row.qty || 0) * unitPrice) };
  }), [customRows, prices?.custom, gauge]);

  const customSubtotal = useMemo(() => computedCustomRows.reduce((a, r) => a + r.lineTotal, 0), [computedCustomRows]);
  const totalPrice = useMemo(() => round2(panelSubtotal + trimSubtotal + hardwareSubtotal + customSubtotal), [panelSubtotal, trimSubtotal, hardwareSubtotal, customSubtotal]);

  // Panel row handlers
  function updatePanelRow(i, field, val) {
    setPanelRows(rows => {
      const u = [...rows];
      u[i] = { ...u[i], [field]: val };
      if (field === "lengthInput") { const lf = parseLengthFt(val); u[i].lengthFt = lf; u[i].lengthDisplay = val; }
      if (field === "qty") u[i].qty = parseInt(val) || 0;
      return u;
    });
  }
  function addPanelRow() { setPanelRows(r => [...r, { qty: 1, lengthInput: "", lengthFt: 0, lengthDisplay: "" }]); }
  function removePanelRow(i) { setPanelRows(r => r.filter((_, idx) => idx !== i)); }

  function updateTrimRow(i, field, val) { setTrimRows(r => { const u = [...r]; u[i] = { ...u[i], [field]: val }; return u; }); }
  function updateHardwareRow(i, field, val) {
    setHardwareRows(r => {
      const u = [...r]; u[i] = { ...u[i], [field]: val };
      if (field === "qtyNeeded") u[i].packsNeeded = Math.ceil((parseInt(val) || 0) / u[i].packSize);
      return u;
    });
  }
  function updateCustomRow(i, field, val) { setCustomRows(r => { const u = [...r]; u[i] = { ...u[i], [field]: val }; return u; }); }

  function buildPayload(status) {
    const qNum = quoteToEdit?.quote_number || "Q-" + Date.now().toString().slice(-6);
    return {
      customer_id: customerId, quote_number: qNum, status,
      po_number: poNumber, job_site_address: jobSiteAddress,
      due_date: dueDate || null, fulfillment, delivery_address: deliveryAddress,
      notes, gauge, trim_gauge: trimGauge,
      panel_type_id: includePanel ? panelTypeId : null,
      panel_label: includePanel ? pt.label : null,
      striation: includePanel && pt.hasStriations ? striation : null,
      ss_width: includePanel && pt.id === "ss" ? ssWidth : null,
      sf_per_lf: includePanel ? sfPerLF : null,
      metric_display: includePanel ? pt.metricDisplay : false,
      tf_screw_type: includePanel && pt.throughFastener ? tfScrewType : null,
      color_provider: colorProvider, color_id: colorId,
      color_name: colorName, color_hex: colorHex,
      panel_rows: computedPanelRows,
      trim_rows: computedTrimRows,
      hardware_rows: computedHardwareRows,
      custom_rows: computedCustomRows,
      total_panel_lf: round2(totalPanelLF),
      total_panel_sf: totalPanelSF,
      panel_subtotal: round2(panelSubtotal),
      trim_subtotal: round2(trimSubtotal),
      hardware_subtotal: round2(hardwareSubtotal),
      custom_subtotal: round2(customSubtotal),
      total_price: totalPrice,
    };
  }

  async function handleSave(status = "Draft") {
    if (!customerId) return;
    if (requiresPO && !poNumber) return;
    if (fulfillment === "Delivery" && !deliveryAddress) return;
    if (wideNoStriation) return;
    setSaving(true);
    const payload = buildPayload(status);
    let error;
    if (isEdit) ({ error } = await supabase.from("quotes").update(payload).eq("id", quoteToEdit.id));
    else ({ error } = await supabase.from("quotes").insert(payload));
    setSaving(false);
    if (!error) { onSaved(); if (status === "Draft") onClose(); }
  }

  async function handleGenerateAndEmail() {
    if (!customerId) return;
    if (requiresPO && !poNumber) return;
    if (fulfillment === "Delivery" && !deliveryAddress) return;
    if (wideNoStriation) return;
    setSending(true);
    const payload = buildPayload("Sent");
    let quoteId = quoteToEdit?.id;
    if (isEdit) {
      await supabase.from("quotes").update(payload).eq("id", quoteId);
    } else {
      const { data } = await supabase.from("quotes").insert(payload).select().single();
      quoteId = data?.id;
    }
    // Call Supabase Edge Function to send email via Resend
    const { error: emailError } = await supabase.functions.invoke("send-quote-email", {
      body: { quoteId, customerEmail: customer?.email, customerName: customer?.name, quoteNumber: payload.quote_number, total: totalPrice },
    });
    setSending(false);
    if (emailError) {
      setEmailMsg({ type: "error", text: "Quote saved but email failed: " + emailError.message });
    } else {
      setEmailMsg({ type: "success", text: `Quote emailed to ${customer?.email}` });
    }
    setSavedQuoteData({ ...payload, id: quoteId });
    setShowPrint(true);
    onSaved();
  }

  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box", color: C.steel };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, overflowY: "auto", display: "flex", justifyContent: "center", padding: "30px 20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 900, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: C.steel, padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 700 }}>{isEdit ? "Edit Quote" : "New Quote / Takeoff Sheet"}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>High Plains Custom Metal</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 110px", overflowY: "auto", flex: 1 }}>

          {/* ── JOB INFO ── */}
          <SectionHead title="Job Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Customer *</label>
              <CustomerSearch customers={customers} value={customerId} onChange={setCustomerId} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>
                {requiresPO ? "PO Number * (required)" : "PO Number"}
              </label>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)}
                placeholder={requiresPO ? "Required for Contractors" : "Optional"}
                style={{ ...inputStyle, border: `1.5px solid ${requiresPO && !poNumber ? C.danger : C.ashDark}`, background: requiresPO && !poNumber ? "#FFF5F5" : C.white }} />
              {requiresPO && !poNumber && <div style={{ fontSize: 11, color: C.danger, marginTop: 3 }}>Required for Contractor/Builder</div>}
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Job Site Address</label>
              <input value={jobSiteAddress} onChange={e => setJobSiteAddress(e.target.value)} placeholder={customer?.address || "Job site address"} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Required Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {customer && (
            <div style={{ padding: "8px 12px", background: C.smoke, borderRadius: 8, fontSize: 12, color: C.steelLight, marginBottom: 10 }}>
              {customer.contact} · {customer.email} · {customer.phone}
            </div>
          )}

          {/* Fulfillment */}
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Fulfillment *</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SelectBtn label="🏭 Pickup" selected={fulfillment === "Pickup"} onClick={() => setFulfillment("Pickup")} />
              <SelectBtn label="🚚 Delivery" selected={fulfillment === "Delivery"} onClick={() => setFulfillment("Delivery")} />
              {fulfillment === "Delivery" && (
                <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Delivery address *"
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1.5px solid ${!deliveryAddress ? C.danger : C.ashDark}`, fontSize: 13, color: C.steel, minWidth: 200 }} />
              )}
            </div>
            {fulfillment === "Delivery" && !deliveryAddress && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>Delivery address is required</div>}
          </div>

          {/* ── GAUGE (applies to whole order) ── */}
          <SectionHead title="Metal Gauge" sub="Applies to panels and trim throughout this order." />
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            {GAUGES.map(g => <SelectBtn key={g} label={`${g} ga`} selected={gauge === g} onClick={() => setGauge(g)} />)}
          </div>

          {/* ── PANEL SECTION (optional) ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 0" }}>
            <div style={{ flex: 1, borderBottom: `2px solid ${C.copper}`, paddingBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>Panel Order</div>
              <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>Leave unchecked for trim/accessory-only orders</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: C.steelLight, paddingBottom: 4 }}>
              <input type="checkbox" checked={includePanel} onChange={e => setIncludePanel(e.target.checked)} style={{ width: 16, height: 16 }} />
              Include panels
            </label>
          </div>

          {includePanel && (
            <div style={{ marginTop: 16 }}>
              {/* Panel type */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Panel Profile</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {BUILTIN_PANEL_TYPES.map(p => <SelectBtn key={p.id} label={p.label} selected={panelTypeId === p.id} onClick={() => setPanelTypeId(p.id)} />)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
                {/* Striations */}
                {pt.hasStriations && (
                  <div>
                    <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Striations</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {STRIATION_OPTIONS.map(s => (
                        <SelectBtn key={s} label={s} selected={striation === s} onClick={() => setStriation(s)}
                          warn={s === "No Striations" && ssWidthObj.inches > 16} />
                      ))}
                    </div>
                    {wideNoStriation && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>⚠ Panels wider than 16" require Bead Rib or Striations to prevent oil-canning</div>}
                  </div>
                )}
                {/* SS Width */}
                {pt.id === "ss" && (
                  <div>
                    <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Panel Width (standard: 16")</label>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {SS_WIDTHS.map(w => <SelectBtn key={w.width} label={w.width} selected={ssWidth === w.width} onClick={() => setSsWidth(w.width)} />)}
                    </div>
                    <div style={{ fontSize: 11, color: C.steelLight, marginTop: 5 }}>
                      SF/LF: <strong>{round4(ssWidthObj.sfPerLF).toFixed(3)}</strong> · 1 LF = {round4(ssWidthObj.sfPerLF).toFixed(3)} SF
                    </div>
                  </div>
                )}
                {/* TF screw type */}
                {pt.throughFastener && (
                  <div>
                    <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Screw Type</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Wood Grip", "Metal"].map(s => <SelectBtn key={s} label={s} selected={tfScrewType === s} onClick={() => setTfScrewType(s)} />)}
                    </div>
                  </div>
                )}
              </div>

              {/* Color */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Color Provider</label>
                  <select value={colorProvider} onChange={e => { setColorProvider(e.target.value); setColorId(""); setColorName(""); setColorHex(""); }}
                    style={inputStyle}>
                    <option value="">— Select provider —</option>
                    {PROVIDERS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Panel Color</label>
                  <ColorPicker provider={colorProvider} value={colorId} onChange={(id, name, hex) => { setColorId(id); setColorName(name); setColorHex(hex); }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>Price per LF</label>
                  <input value={pricePerLF ? fmt(pricePerLF) : "Not set in price table"} readOnly
                    style={{ ...inputStyle, background: C.smoke, color: pricePerLF ? C.steel : C.warn }} />
                </div>
              </div>

              {/* Panel cut list */}
              <div style={{ fontSize: 13, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif", marginBottom: 10 }}>
                Panel Cut List
                <span style={{ fontSize: 11, fontWeight: 400, color: C.steelLight, marginLeft: 8 }}>
                  Customer-provided measurements. Enter as 14.5 or 14'6"
                  {pt.metricDisplay && " — metric (mm) shown alongside"}
                </span>
              </div>
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: pt.metricDisplay ? "70px 130px 90px 90px 90px 90px 100px 36px" : "70px 130px 90px 90px 100px 100px 36px", background: C.smoke, padding: "8px 12px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
                  <span>Qty</span><span>Length</span>{pt.metricDisplay && <span>mm</span>}<span>LF Each</span><span>Total LF</span>{sfPerLF && <span>Total SF</span>}<span>$/LF</span><span>Line Total</span><span></span>
                </div>
                {computedPanelRows.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: pt.metricDisplay ? "70px 130px 90px 90px 90px 90px 100px 36px" : "70px 130px 90px 90px 100px 100px 36px", padding: "7px 12px", borderBottom: `1px solid ${C.ash}`, alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                    <input value={row.qty} onChange={e => updatePanelRow(i, "qty", e.target.value)} type="number" min="1"
                      style={{ width: 55, padding: "5px 6px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                    <input value={row.lengthInput} onChange={e => updatePanelRow(i, "lengthInput", e.target.value)}
                      placeholder='e.g. 14&apos;6"' style={{ width: 120, padding: "5px 6px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                    {pt.metricDisplay && <span style={{ fontSize: 11, color: C.info, paddingLeft: 4 }}>{row.lengthFt > 0 ? `${ftToMm(row.lengthFt)} mm` : "—"}</span>}
                    <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 4 }}>{row.lengthFt > 0 ? `${round2(row.lengthFt).toFixed(2)}'` : "—"}</span>
                    <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 4 }}>{row.totalLF > 0 ? `${row.totalLF.toFixed(2)} LF` : "—"}</span>
                    {sfPerLF && <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 4 }}>{row.totalLF > 0 ? `${round2(row.totalLF * sfPerLF).toFixed(2)} SF` : "—"}</span>}
                    <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 4 }}>{fmt(pricePerLF)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 4 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
                    <button onClick={() => removePanelRow(i)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                ))}
                <div style={{ padding: "8px 12px", background: "#F9F7F4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={addPanelRow} style={{ fontSize: 12, color: C.copper, background: "none", border: `1px dashed ${C.copper}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>+ Add Row</button>
                  <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
                    <span style={{ color: C.steelLight }}>Total LF: <strong style={{ color: C.steel }}>{totalPanelLF.toFixed(2)}</strong></span>
                    {totalPanelSF && <span style={{ color: C.steelLight }}>Total SF: <strong style={{ color: C.steel }}>{totalPanelSF.toFixed(2)}</strong></span>}
                    <span style={{ color: C.steelLight }}>Subtotal: <strong style={{ color: C.steel }}>{fmt(panelSubtotal)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Hardware */}
              {computedHardwareRows.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif", marginBottom: 10 }}>Hardware & Fasteners
                    <span style={{ fontSize: 11, fontWeight: 400, color: C.steelLight, marginLeft: 8 }}>
                      {pt.id === "ss" ? "Auto-calculated: 1 screw/LF, 1 clip/2LF" : "Screws auto-calculated at 110/100SF"}
                    </span>
                  </div>
                  <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 120px 80px 100px 100px", background: C.smoke, padding: "8px 12px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
                      <span>Item</span><span>Pack Size</span><span>Qty Needed</span><span>Packs</span><span>$/Pack</span><span>Line Total</span>
                    </div>
                    {computedHardwareRows.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 100px 120px 80px 100px 100px", padding: "8px 12px", borderBottom: i < computedHardwareRows.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.steel }}>{row.label}{row.autoCalc && <span style={{ fontSize: 10, color: C.success, marginLeft: 6 }}>auto</span>}</span>
                        <span style={{ fontSize: 12, color: C.steelLight }}>{row.packSize}/{row.unit}</span>
                        <input value={row.autoCalc ? row.qtyNeeded : (row.qtyNeeded || "")} readOnly={row.autoCalc}
                          onChange={e => !row.autoCalc && updateHardwareRow(i, "qtyNeeded", e.target.value)} type="number" min="0"
                          style={{ width: 90, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13, background: row.autoCalc ? C.smoke : C.white }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.packsNeeded}</span>
                        <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{fmt(row.pricePerPack)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
                      </div>
                    ))}
                    <div style={{ padding: "8px 12px", background: "#F9F7F4", textAlign: "right", fontSize: 12 }}>
                      Hardware Subtotal: <strong style={{ color: C.steel, marginLeft: 8 }}>{fmt(hardwareSubtotal)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TRIM & ACCESSORIES ── */}
          <SectionHead title="Trim & Accessories" sub="All trim sold in 10LF sticks. Gauge from selector above applies." optional />
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 110px 100px 110px 110px", background: C.smoke, padding: "8px 12px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
              <span>Item</span><span>Actual LF</span><span>+ Sticks Waste</span><span>Total Sticks</span><span>$/Stick</span><span>Line Total</span>
            </div>
            {computedTrimRows.map((row, i) => (
              <div key={row.id + i} style={{ display: "grid", gridTemplateColumns: "2fr 100px 110px 100px 110px 110px", padding: "7px 12px", borderBottom: i < computedTrimRows.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.steel }}>{row.label}</span>
                  {row.id === "custom-trim" && (
                    <input value={row.customLabel || ""} onChange={e => updateTrimRow(i, "customLabel", e.target.value)}
                      placeholder="Custom item name" style={{ marginLeft: 8, padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 11, width: 150, color: C.steel }} />
                  )}
                </div>
                <input value={row.actualLF || ""} onChange={e => updateTrimRow(i, "actualLF", parseFloat(e.target.value) || 0)} type="number" min="0" placeholder="0"
                  style={{ width: 80, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <input value={row.sticksWaste || ""} onChange={e => updateTrimRow(i, "sticksWaste", parseInt(e.target.value) || 0)} type="number" min="0" placeholder="0"
                  style={{ width: 80, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.totalSticks}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{fmt(row.pricePerStick)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
              </div>
            ))}
            <div style={{ padding: "8px 12px", background: "#F9F7F4", textAlign: "right", fontSize: 12 }}>
              Trim Subtotal: <strong style={{ color: C.steel, marginLeft: 8 }}>{fmt(trimSubtotal)}</strong>
            </div>
          </div>

          {/* ── CUSTOM PRODUCTS ── */}
          {customProducts.length > 0 && (
            <>
              <SectionHead title="Additional Products & Accessories" optional />
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 80px 100px 100px", background: C.smoke, padding: "8px 12px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
                  <span>Item</span><span>Gauge</span><span>Qty</span><span>Unit</span><span>Unit Price</span><span>Line Total</span>
                </div>
                {computedCustomRows.map((row, i) => (
                  <div key={row.id + i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 80px 100px 100px", padding: "7px 12px", borderBottom: i < computedCustomRows.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.steel }}>{row.name}</span>
                      {row.notes && <div style={{ fontSize: 10, color: C.steelLight }}>{row.notes}</div>}
                    </div>
                    {row.requires_gauge
                      ? <select value={row.gauge || gauge} onChange={e => updateCustomRow(i, "gauge", e.target.value)}
                          style={{ padding: "4px 6px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 12 }}>
                          {GAUGES.map(g => <option key={g}>{g}</option>)}
                        </select>
                      : <span style={{ fontSize: 11, color: C.steelLight, paddingLeft: 4 }}>—</span>
                    }
                    <input value={row.qty || ""} onChange={e => updateCustomRow(i, "qty", parseFloat(e.target.value) || 0)} type="number" min="0" placeholder="0"
                      style={{ width: 65, padding: "5px 6px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                    <span style={{ fontSize: 11, color: C.steelLight, paddingLeft: 4 }}>{row.unit}</span>
                    <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 4 }}>{fmt(row.unitPrice)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 4 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
                  </div>
                ))}
                <div style={{ padding: "8px 12px", background: "#F9F7F4", textAlign: "right", fontSize: 12 }}>
                  Additional Items Subtotal: <strong style={{ color: C.steel, marginLeft: 8 }}>{fmt(customSubtotal)}</strong>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <SectionHead title="Notes" optional />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Internal notes, special instructions, delivery info…"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.5, color: C.steel }} />

          {emailMsg && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: emailMsg.type === "success" ? C.successBg : C.dangerBg, color: emailMsg.type === "success" ? C.success : C.danger, fontSize: 13 }}>
              {emailMsg.text}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ position: "sticky", bottom: 0, background: C.white, borderTop: `1px solid ${C.ash}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            {includePanel && <span style={{ color: C.steelLight }}>Panels: <strong>{fmt(panelSubtotal)}</strong></span>}
            <span style={{ color: C.steelLight }}>Trim: <strong>{fmt(trimSubtotal)}</strong></span>
            {includePanel && hardwareSubtotal > 0 && <span style={{ color: C.steelLight }}>Hardware: <strong>{fmt(hardwareSubtotal)}</strong></span>}
            {customSubtotal > 0 && <span style={{ color: C.steelLight }}>Other: <strong>{fmt(customSubtotal)}</strong></span>}
            <span style={{ fontSize: 16, fontWeight: 700, color: C.steel }}>Total: <strong style={{ color: C.copper }}>{fmt(totalPrice)}</strong></span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => handleSave("Draft")} disabled={!customerId || saving}
              style={{ padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button onClick={handleGenerateAndEmail} disabled={!customerId || sending || wideNoStriation || (requiresPO && !poNumber) || (fulfillment === "Delivery" && !deliveryAddress)}
              style={{ padding: "8px 18px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {sending ? "Sending…" : "Generate & Email Quote →"}
            </button>
          </div>
        </div>
      </div>

      {showPrint && savedQuoteData && (
        <QuotePrintView quote={savedQuoteData} customer={customer}
          onClose={() => { setShowPrint(false); onClose(); }}
          onApproved={() => { onSaved(); }} />
      )}
    </div>
  );
}

// ─── QUOTES LIST ──────────────────────────────────────────────
function QuotesList({ customers, prices, onNewQuote }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQuote, setEditQuote] = useState(null);
  const [viewQuote, setViewQuote] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => { loadQuotes(); }, []);

  async function loadQuotes() {
    setLoading(true);
    const { data } = await supabase.from("quotes")
      .select("*, customers(name, contact, email, phone, address, type)")
      .order("created_at", { ascending: false });
    setQuotes(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("quotes").update({ status }).eq("id", id);
    loadQuotes();
  }

  const filtered = quotes.filter(q => filterStatus === "All" || q.status === filterStatus);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.steelLight, marginRight: 4 }}>Filter:</span>
          {["All", ...Object.keys(QUOTE_STATUSES)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${filterStatus === s ? C.copper : C.ashDark}`, background: filterStatus === s ? "#FFF8F2" : C.white, color: filterStatus === s ? C.copper : C.steelLight, cursor: "pointer", fontWeight: filterStatus === s ? 600 : 400 }}>{s}</button>
          ))}
        </div>
        <button onClick={onNewQuote} style={{ padding: "7px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Quote</button>
      </div>

      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "9px 18px", background: C.smoke, borderBottom: `1px solid ${C.ash}`, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Quote #</span><span>Customer</span><span>Type</span><span>Total</span><span>Due</span><span>Status</span><span></span>
        </div>
        {loading && <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Spinner /></div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.steelLight }}>No quotes found.</div>}
        {!loading && filtered.map((q, i) => (
          <div key={q.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "11px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.ash}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{q.quote_number}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{q.customers?.name}</div>
              <div style={{ fontSize: 11, color: C.steelLight }}>{q.po_number && `PO: ${q.po_number}`}</div>
            </div>
            <div style={{ fontSize: 12, color: C.steelLight }}>{q.panel_label || "Trim only"}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{fmt(q.total_price)}</div>
            <div style={{ fontSize: 12, color: q.due_date ? C.steel : C.steelLight }}>{q.due_date || "—"}</div>
            <StatusBadge status={q.status} />
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setViewQuote(q)} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 5, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelMid, cursor: "pointer" }}>View</button>
              <button onClick={() => setEditQuote(q)} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 5, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelMid, cursor: "pointer" }}>Edit</button>
              {q.status === "Sent" && <button onClick={() => updateStatus(q.id, "Approved")} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 5, border: `1px solid ${C.success}`, background: C.successBg, color: C.success, cursor: "pointer", fontWeight: 600 }}>✓ Approve</button>}
              {q.status === "Approved" && <button onClick={() => updateStatus(q.id, "In Production")} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 5, border: `1px solid ${C.warn}`, background: C.warnBg, color: C.warn, cursor: "pointer", fontWeight: 600 }}>→ Prod</button>}
            </div>
          </div>
        ))}
      </div>

      {editQuote && <QuoteBuilder customers={customers} prices={prices} quoteToEdit={editQuote} onClose={() => setEditQuote(null)} onSaved={() => { setEditQuote(null); loadQuotes(); }} />}
      {viewQuote && <QuotePrintView quote={viewQuote} customer={viewQuote.customers} onClose={() => setViewQuote(null)} onApproved={loadQuotes} />}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
export default function QuotingApp({ preselectedCustomerId, onQuoteCreated }) {
  const [customers, setCustomers] = useState([]);
  const [prices, setPrices] = useState({ panels: {}, trim: {}, hardware: {}, custom: {} });
  const [view, setView] = useState("quotes");
  const [showNewQuote, setShowNewQuote] = useState(!!preselectedCustomerId);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [showColorMgr, setShowColorMgr] = useState(false);
  const [showProductMgr, setShowProductMgr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: custs }, { data: pd }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("price_table").select("*"),
    ]);
    setCustomers(custs || []);
    const p = { panels: {}, trim: {}, hardware: {}, custom: {} };
    (pd || []).forEach(r => { p[r.category] = p[r.category] || {}; p[r.category][r.item_key] = r.price; });
    setPrices(p);
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Admin toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button onClick={() => setShowColorMgr(true)} style={{ padding: "6px 14px", borderRadius: 8, background: C.smoke, color: C.steelMid, border: `1px solid ${C.ashDark}`, fontSize: 12, cursor: "pointer" }}>🎨 Manage Colors</button>
        <button onClick={() => setShowProductMgr(true)} style={{ padding: "6px 14px", borderRadius: 8, background: C.smoke, color: C.steelMid, border: `1px solid ${C.ashDark}`, fontSize: 12, cursor: "pointer" }}>📦 Custom Products</button>
        <button onClick={() => setShowPriceTable(true)} style={{ padding: "6px 14px", borderRadius: 8, background: C.smoke, color: C.steelMid, border: `1px solid ${C.ashDark}`, fontSize: 12, cursor: "pointer" }}>⚙ Price Table</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
      ) : (
        <QuotesList customers={customers} prices={prices} onNewQuote={() => setShowNewQuote(true)} />
      )}

      {showNewQuote && (
        <QuoteBuilder customers={customers} prices={prices} preselectedCustomerId={preselectedCustomerId}
          onClose={() => { setShowNewQuote(false); }}
          onSaved={() => { loadAll(); if (onQuoteCreated) onQuoteCreated(); }} />
      )}
      {showPriceTable && <PriceTableEditor onClose={() => { setShowPriceTable(false); loadAll(); }} />}
      {showColorMgr && <ColorManager onClose={() => setShowColorMgr(false)} />}
      {showProductMgr && <CustomProductManager onClose={() => { setShowProductMgr(false); loadAll(); }} />}
    </div>
  );
}
